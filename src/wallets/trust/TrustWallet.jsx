import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchBasePrices,
  getTokenOverlayFallbackIcon,
  getTokenOverlayIcon,
  getTokenQuote,
  useWalletStore,
} from '../../store/useWalletStore';
import PullToRefresh from '../../components/PullToRefresh';
import TrustSpoofModal from './TrustSpoofModal';
import './TrustWallet.css';

const AssetIcon = ({ src, className = '', alt = '' }) => (
  <img className={className} src={src} alt={alt} aria-hidden={alt ? undefined : 'true'} />
);

const IconGear = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconSearch = () => (
  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.15" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7.5" />
    <path d="m20 20-4.2-4.2" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

const IconTrendCaret = ({ positive }) => (
  <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d={positive ? 'M6 1 11 7H1L6 1Z' : 'M6 11 1 5h10L6 11Z'} fill="currentColor" />
  </svg>
);

function formatMoney(value) {
  if (!value || Math.abs(value) < 0.01) return '$0.00';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTokenPrice(value) {
  if (!value) return '$0.00';
  if (value < 0.01) return '<$0.01';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTokenAmount(amount) {
  if (!amount) return '0';
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: amount < 1 ? 4 : 0,
    maximumFractionDigits: 4,
  });
}

function formatPnl(value, percent) {
  const signedMoney = value < 0 ? `-${formatMoney(Math.abs(value))}` : formatMoney(value);
  return `${signedMoney} (${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%)`;
}

function TokenIcon({ token, imageUrl, overlayIconUrl }) {
  const [hasError, setHasError] = useState(false);
  const [overlaySrc, setOverlaySrc] = useState(overlayIconUrl);

  useEffect(() => {
    setOverlaySrc(overlayIconUrl);
  }, [overlayIconUrl]);

  return (
    <div className="tw-token-icon">
      {imageUrl && !hasError ? (
        <img src={imageUrl} alt={token.symbol} onError={() => setHasError(true)} />
      ) : (
        <span>{token.symbol.slice(0, 3)}</span>
      )}
      {overlaySrc ? (
        <div className="tw-token-overlay">
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
        </div>
      ) : null}
    </div>
  );
}

export default function TrustWallet() {
  const { trust, setPhantomPrices } = useWalletStore();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showAllTokens, setShowAllTokens] = useState(false);
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

  const tokenRows = useMemo(
    () =>
      [...trust.tokens]
        .map((token) => {
          const quote = getTokenQuote(token, trust.prices);
          const amount = token.amount || 0;
          const fiatValue = amount * quote.usd;
          const overlayIconUrl = getTokenOverlayIcon(token);

          return {
            ...token,
            label: token.label || token.network || quote.chainId || '',
            amount,
            fiatValue,
            overlayIconUrl,
            quote,
          };
        })
        .sort((left, right) => {
          if (right.fiatValue !== left.fiatValue) return right.fiatValue - left.fiatValue;
          if (right.amount !== left.amount) return right.amount - left.amount;
          return left.name.localeCompare(right.name);
        }),
    [trust.prices, trust.tokens]
  );

  const { totalBalance, totalPnlVal, totalPnlPct } = useMemo(() => {
    let totalVal = 0;
    let totalPnl = 0;
    let totalPrevVal = 0;

    tokenRows.forEach((token) => {
      totalVal += token.fiatValue;
      if (token.quote.change !== 0 && token.amount > 0) {
        const previousPrice = token.quote.usd / (1 + token.quote.change / 100);
        const previousValue = previousPrice * token.amount;
        totalPnl += token.fiatValue - previousValue;
        totalPrevVal += previousValue;
      }
    });

    return {
      totalBalance: totalVal,
      totalPnlVal: totalPnl,
      totalPnlPct: totalPrevVal > 0 ? (totalPnl / totalPrevVal) * 100 : 0,
    };
  }, [tokenRows]);

  const pnlPositive = totalPnlVal >= 0;
  const visibleTokenRows = showAllTokens ? tokenRows : tokenRows.slice(0, 5);
  const canToggleTokenRows = tokenRows.length > 5;
  const actionButtons = [
    { key: 'send', label: 'Send', icon: <AssetIcon src="/trust/send.svg" className="tw-ui-icon tw-action-glyph" />, accent: false, onClick: undefined },
    { key: 'receive', label: 'Receive', icon: <AssetIcon src="/trust/receive.svg" className="tw-ui-icon tw-action-glyph" />, accent: false, onClick: undefined },
    { key: 'swap', label: 'Swap', icon: <AssetIcon src="/trust/swap.svg" className="tw-ui-icon tw-action-glyph" />, accent: false, onClick: undefined },
    { key: 'buy', label: 'Buy', icon: <AssetIcon src="/trust/buy.svg" className="tw-ui-icon tw-action-glyph" />, accent: true, onClick: () => setShowSetupModal(true) },
  ];

  return (
    <div className="trust-app">
      <div className="tw-device-shell">
        <header className="tw-header">
          <div className="tw-header-left">
            <button className="tw-icon-btn tw-gear-btn" type="button" aria-label="Settings" onClick={() => setShowSetupModal(true)}>
              <IconGear />
              <span className="tw-red-dot" />
            </button>
            <div className="tw-search-bar">
              <IconSearch />
              <span>Search</span>
            </div>
          </div>
          <button className="tw-icon-btn tw-scan-btn" type="button" aria-label="Scan">
            <AssetIcon src="/trust/qr.svg" className="tw-ui-icon tw-ui-icon-scan" />
          </button>
        </header>

        <PullToRefresh className="tw-scroll" onRefresh={refreshTrust} indicatorTop={18}>
          <div className="tw-shell">
            <section className="tw-wallet-hero">
              <div className="tw-wallet-pill-row">
                <div className="tw-wallet-pill">
                  <span>{trust.walletName}</span>
                  <IconChevronRight />
                  <span className="tw-wallet-red-dot" />
                </div>
                <button className="tw-copy-btn" type="button" aria-label="Copy wallet">
                  <AssetIcon src="/trust/copy.svg" className="tw-ui-icon tw-ui-icon-copy" />
                </button>
              </div>

              <div className="tw-total-balance">{formatMoney(totalBalance)}</div>
              <div className={`tw-pnl-row ${pnlPositive ? 'positive' : 'negative'}`}>
                <span className="tw-pnl-caret"><IconTrendCaret positive={pnlPositive} /></span>
                <span>{formatPnl(totalPnlVal, totalPnlPct)}</span>
              </div>

              <div className="tw-actions">
                {actionButtons.map((action) => (
                  <div className="tw-action-item" key={action.key}>
                    <button
                      className={`tw-action-btn ${action.accent ? 'tw-action-btn-green' : ''}`}
                      type="button"
                      aria-label={action.label}
                      onClick={action.onClick}
                    >
                      {action.icon}
                    </button>
                    <span>{action.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="tw-assets-section">
              <div className="tw-tabs-header">
                <div className="tw-tabs">
                  <button className="tw-tab active" type="button">Crypto</button>
                  <button className="tw-tab" type="button">Watchlist</button>
                  <button className="tw-tab" type="button">NFTs</button>
                </div>
                <div className="tw-tab-actions">
                  <button className="tw-icon-btn tw-dim-btn" type="button" aria-label="History"><AssetIcon src="/trust/history.svg" className="tw-ui-icon tw-ui-icon-tab" /></button>
                  <button className="tw-icon-btn tw-dim-btn" type="button" aria-label="Settings"><AssetIcon src="/trust/set.svg" className="tw-ui-icon tw-ui-icon-tab" /></button>
                </div>
              </div>

              <div className="tw-token-list">
                {visibleTokenRows.map((token) => {
                  const negative = token.quote.change < 0;
                  return (
                    <button className="tw-token-row" type="button" key={token.id}>
                      <div className="tw-token-left">
                        <TokenIcon token={token} imageUrl={token.quote.imageUrl || token.icon || ''} overlayIconUrl={token.overlayIconUrl} />

                        <div className="tw-token-meta">
                          <div className="tw-token-title-row">
                            <span className="tw-token-symbol">{token.symbol}</span>
                            <span className="tw-token-network">{token.label || token.network}</span>
                          </div>
                          <div className="tw-token-subtitle-row">
                            <span>{formatTokenPrice(token.quote.usd)}</span>
                            <span className={`tw-token-change ${negative ? 'neg' : 'pos'}`}>{negative ? '' : '+'}{token.quote.change.toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="tw-token-right">
                        <div className="tw-token-amount">{formatTokenAmount(token.amount)}</div>
                        <div className="tw-token-fiat">{formatMoney(token.fiatValue)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {showAllTokens ? (
              <section className="tw-manage-section">
                <button className="tw-manage-cta" type="button" onClick={() => setShowSetupModal(true)}>
                  Manage crypto
                </button>
              </section>
            ) : null}

            {canToggleTokenRows ? (
              <section className="tw-toggle-section">
                <button className="tw-view-all-btn" type="button" onClick={() => setShowAllTokens((current) => !current)}>
                  <span>{showAllTokens ? 'View less' : 'View all'}</span>
                  <span className={`tw-view-all-chevron ${showAllTokens ? 'expanded' : ''}`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </button>
              </section>
            ) : null}
          </div>
        </PullToRefresh>

        <nav className="tw-bottom-nav">
          <button className="tw-nav-btn tw-nav-btn-active" type="button">
            <AssetIcon src="/trust/home.svg" className="tw-ui-icon tw-footer-icon" />
            <span>Home</span>
          </button>
          <button className="tw-nav-btn" type="button">
            <AssetIcon src="/trust/trending.svg" className="tw-ui-icon tw-footer-icon" />
            <span>Trending</span>
          </button>
          <div className="tw-trade-slot">
            <button className="tw-trade-floating-btn" type="button" aria-label="Trade">
              <AssetIcon src="/trust/arrows.svg" className="tw-ui-icon tw-trade-glyph" />
            </button>
            <span className="tw-trade-label">Trade</span>
          </div>
          <button className="tw-nav-btn" type="button">
            <AssetIcon src="/trust/rewards.svg" className="tw-ui-icon tw-footer-icon" />
            <span>Rewards</span>
          </button>
          <button className="tw-nav-btn" type="button">
            <AssetIcon src="/trust/compass.svg" className="tw-ui-icon tw-footer-icon" />
            <span>Discover</span>
          </button>
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
