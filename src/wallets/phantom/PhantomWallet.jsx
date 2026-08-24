import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchBasePrices,
  getTokenOverlayFallbackIcon,
  getTokenOverlayIcon,
  getTokenQuote,
  useWalletStore,
} from '../../store/useWalletStore';
import PullToRefresh from '../../components/PullToRefresh';
import PhantomSpoofModal from './PhantomSpoofModal';
import PhantomTokenDetail from './PhantomTokenDetail';
import './PhantomWallet.css';

const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const IconChevronRight = () => (
  <svg className="ph-chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7.5" />
    <path d="m20 20-4.2-4.2" />
  </svg>
);

const IconBanknote = () => (
  <svg viewBox="0 0 32 20" fill="none" className="ph-cash-svg">
    <rect width="32" height="20" rx="6" fill="#808085" />
    <circle cx="16" cy="10" r="3.6" fill="#1a1a1c" />
    <path d="M 6 5.5 C 6 8.5 8.5 6 8.5 8.5 C 7.2 8.5 6 7.2 6 5.5 Z" fill="#1a1a1c" />
    <path d="M 26 5.5 C 26 8.5 23.5 6 23.5 8.5 C 24.8 8.5 26 7.2 26 5.5 Z" fill="#1a1a1c" />
    <path d="M 6 14.5 C 6 11.5 8.5 14 8.5 11.5 C 7.2 11.5 6 12.8 6 14.5 Z" fill="#1a1a1c" />
    <path d="M 26 14.5 C 26 11.5 23.5 14 23.5 11.5 C 24.8 11.5 26 12.8 26 14.5 Z" fill="#1a1a1c" />
  </svg>
);

const PERP_ITEMS = [
  { id: 'bitcoin-taproot', symbol: 'BTC', icon: '/token-logos/btc.png' },
  { id: 'ethereum', symbol: 'ETH', icon: '/token-logos/ethereum_logo.webp' },
  { id: 'solana', symbol: 'SOL', icon: '/token-logos/solana_logo.png' },
];

function TokenAvatar({ token, imageUrl, overlayIconUrl = '', size = 'md' }) {
  const initials = token.symbol?.slice(0, 3) || token.name?.slice(0, 2) || '?';
  const [overlaySrc, setOverlaySrc] = useState(overlayIconUrl);

  useEffect(() => {
    setOverlaySrc(overlayIconUrl);
  }, [overlayIconUrl]);

  return (
    <div className={`ph-token-avatar ph-token-avatar-${size}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={token.symbol}
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <span>{initials}</span>
      )}
      {overlaySrc ? (
        <span className="ph-token-avatar-overlay">
          <img
            src={overlaySrc}
            alt=""
            onError={() => {
              const fallbackSrc = getTokenOverlayFallbackIcon(token);
              if (overlaySrc === fallbackSrc) {
                setOverlaySrc('');
                return;
              }
              setOverlaySrc(fallbackSrc);
            }}
          />
        </span>
      ) : null}
    </div>
  );
}

function formatMoney(value) {
  if (!value) return '$0.00';
  if (Math.abs(value) < 0.01) return value > 0 ? '<$0.01' : '-<$0.01';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTokenAmount(value, symbol) {
  if (!value) return `0 ${symbol}`;
  if (value >= 1_000_000) {
    const shortMillions = value >= 10_000_000
      ? (value / 1_000_000).toFixed(0)
      : (value / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${shortMillions} ${symbol}`;
  }
  if (value < 0.00001) return `< 0.00001 ${symbol}`;
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: value < 1 ? 5 : 0,
    maximumFractionDigits: value < 1 ? 5 : 4,
  })} ${symbol}`;
}

function truncateTokenName(name) {
  if (!name) return '';
  return name.length > 30 ? `${name.slice(0, 30)}…` : name;
}

export default function PhantomWallet() {
  const { phantom, setPhantomPrices } = useWalletStore();
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [activeTopTab, setActiveTopTab] = useState('Home');
  const [showAllTokens, setShowAllTokens] = useState(false);

  const loadPrices = useCallback(async () => {
    const prices = await fetchBasePrices();
    if (Object.keys(prices).length > 0) {
      setPhantomPrices(prices);
    }
  }, [setPhantomPrices]);

  useEffect(() => {
    loadPrices();
    const timer = setInterval(loadPrices, 60000);
    return () => clearInterval(timer);
  }, [loadPrices]);

  const tokensWithQuotes = useMemo(
    () =>
      [...phantom.tokens]
        .map((token) => {
          const quote = getTokenQuote(token, phantom.prices);
          const amount = token.amount || 0;
          const fiatValue = quote.usd * amount;
          const prevPrice = quote.change !== 0 ? quote.usd / (1 + quote.change / 100) : quote.usd;
          const pnl = amount > 0 ? (quote.usd - prevPrice) * amount : 0;

          return {
            ...token,
            quote,
            amount,
            fiatValue,
            pnl,
            overlayIconUrl: getTokenOverlayIcon(token),
          };
        })
        .sort((left, right) => {
          if (right.fiatValue !== left.fiatValue) return right.fiatValue - left.fiatValue;
          if (right.amount !== left.amount) return right.amount - left.amount;
          return left.name.localeCompare(right.name);
        }),
    [phantom.prices, phantom.tokens]
  );

  const { totalBalance, totalPnlValue, totalPnlPct } = useMemo(() => {
    let balance = 0;
    let pnlValue = 0;
    let previousValue = 0;

    tokensWithQuotes.forEach((token) => {
      balance += token.fiatValue;
      if (token.amount > 0 && token.quote.change !== 0) {
        const previousPrice = token.quote.usd / (1 + token.quote.change / 100);
        const priorValue = previousPrice * token.amount;
        pnlValue += token.fiatValue - priorValue;
        previousValue += priorValue;
      }
    });

    return {
      totalBalance: balance,
      totalPnlValue: pnlValue,
      totalPnlPct: previousValue > 0 ? (pnlValue / previousValue) * 100 : 0,
    };
  }, [tokensWithQuotes]);

  const balanceText = formatMoney(totalBalance);
  const visibleTokens = showAllTokens ? tokensWithQuotes : tokensWithQuotes.slice(0, 3);

  if (selectedToken) {
    return (
      <div className="phantom-app">
        <PhantomTokenDetail token={selectedToken} onBack={() => setSelectedToken(null)} />
      </div>
    );
  }

  return (
    <div className="phantom-app">
      <header className="ph-new-header">
        <button
          className="ph-header-avatar-left"
          type="button"
          onClick={() => setShowBuyModal(true)}
          aria-label="Account Settings"
        >
          <img src="/phantom/asset-images/mascot.jpg" alt="PFP" />
        </button>
        <div className="ph-top-pills-scroll">
          {['Home', 'Trade', 'Predict', 'Explore'].map((tab) => (
            <button
              key={tab}
              className={`ph-top-pill ${activeTopTab === tab ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveTopTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <PullToRefresh className="phantom-scroll" onRefresh={loadPrices}>
        <main>
          <section className="ph-hero">
            <button className="ph-account-dropdown" type="button" onClick={() => setShowBuyModal(true)}>
              <span>Account {phantom.accountNumber}</span>
              <IconChevronDown />
            </button>
            <div className="ph-hero-balance">{balanceText}</div>
            <div className={`ph-hero-change ${totalPnlValue >= 0 ? 'positive' : 'negative'}`}>
              <span className="ph-hero-change-value">
                {totalPnlValue >= 0 ? '+' : '-'}{formatMoney(Math.abs(totalPnlValue)).replace('$', '$')}
              </span>
              <span className={`ph-hero-pill ${totalPnlValue >= 0 ? 'positive' : 'negative'}`}>
                {totalPnlValue >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%
              </span>
            </div>
          </section>

          <section className="ph-cash-card-v2">
            <div className="ph-cash-left">
              <IconBanknote />
              <span>Cash</span>
            </div>
            <div className="ph-cash-value">{formatMoney(phantom.cashBalance || 0)}</div>
          </section>

          <section className="ph-token-section">
            <button
              className="ph-section-header"
              type="button"
              onClick={() => setShowAllTokens((prev) => !prev)}
            >
              <h2>Tokens</h2>
              <IconChevronRight />
            </button>

            <div className="ph-token-list">
              {visibleTokens.map((token) => (
                <button
                  key={token.id}
                  className="ph-token-row"
                  type="button"
                  onClick={() => setSelectedToken(token)}
                >
                  <TokenAvatar token={token} imageUrl={token.quote.imageUrl || token.icon} overlayIconUrl={token.overlayIconUrl} />
                  <div className="ph-token-main">
                    <div className="ph-token-title">
                      <span className="ph-token-name-text">{truncateTokenName(token.name)}</span>
                      {token.label ? <em>{token.label}</em> : null}
                    </div>
                    <div className="ph-token-subtitle">{formatTokenAmount(token.amount, token.symbol)}</div>
                  </div>
                  <div className="ph-token-side">
                    <span className="ph-token-fiat">{formatMoney(token.fiatValue)}</span>
                    <span className={`ph-token-pnl ${token.pnl > 0 ? 'positive' : token.pnl < 0 ? 'negative' : 'neutral'}`}>
                      {token.pnl === 0 ? '$0.00' : `${token.pnl > 0 ? '+' : '-'}${formatMoney(Math.abs(token.pnl)).replace('$', '$')}`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="ph-token-section">
            <div className="ph-section-header">
              <h2>Perps</h2>
              <IconChevronRight />
            </div>
            <div className="ph-perps-row">
              {PERP_ITEMS.map((perp) => {
                const targetToken = tokensWithQuotes.find(
                  (token) => token.id === perp.id || token.symbol === perp.symbol
                );
                return (
                  <button
                    key={perp.id}
                    className="ph-perp-card"
                    type="button"
                    onClick={() => targetToken && setSelectedToken(targetToken)}
                  >
                    <img src={perp.icon} alt={perp.symbol} className="ph-perp-icon" />
                  </button>
                );
              })}
            </div>
          </section>
        </main>
      </PullToRefresh>

      <div className="ph-floating-dock">
        <div className="ph-dock-search">
          <IconSearch />
          <span>Search Phantom</span>
        </div>
        <button className="ph-dock-add-btn" type="button" onClick={() => setShowBuyModal(true)} aria-label="Wallet Settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {showBuyModal ? <PhantomSpoofModal onClose={() => setShowBuyModal(false)} /> : null}
    </div>
  );
}