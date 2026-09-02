import React, { useMemo, useRef, useState } from 'react';
import { getTokenQuote, useWalletStore } from '../../store/useWalletStore';
import './TrustWalletDetail.css';

/* ---------------------------------- icons --------------------------------- */

const IconChevronLeft = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="m14.5 6-6 6 6 6" />
  </svg>
);

const IconEth = () => (
  <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#627EEA" />
    <path d="M16 4v8.87l7.48 3.35z" fill="#FFFFFF" fillOpacity="0.6" />
    <path d="M16 4L8.52 16.22l7.48-3.35z" fill="#FFFFFF" />
    <path d="M16 21.96v6.04l7.5-10.32z" fill="#FFFFFF" fillOpacity="0.6" />
    <path d="M16 28v-6.04L8.52 17.68z" fill="#FFFFFF" />
    <path d="M16 20.57l7.48-4.35L16 12.87z" fill="#FFFFFF" fillOpacity="0.2" />
    <path d="M8.52 16.22l7.48 4.35v-7.7z" fill="#FFFFFF" fillOpacity="0.6" />
  </svg>
);

const IconStar = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill={filled ? "#5B83FC" : "none"}
      stroke={filled ? "none" : "#8b8fa5"}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);


const IconSend = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 17.5 17.5 6.5" />
    <path d="M8.5 6.5h9v9" />
  </svg>
);

const IconReceive = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <path d="M14 14h3v3h-3zM19.5 17.5v3M14 20.5h2" strokeWidth="1.9" />
  </svg>
);

const IconCandles = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
    <rect x="4" y="8.5" width="4" height="8" rx="1.4" />
    <path d="M6 4.5v4M6 16.5v3" />
    <rect x="14.5" y="5.5" width="4" height="8" rx="1.4" />
    <path d="M16.5 2.5v3M16.5 13.5v4" />
  </svg>
);

const IconSparkle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 3.5l1.6 4.9 4.9 1.6-4.9 1.6L10 16.5 8.4 11.6 3.5 10l4.9-1.6L10 3.5z" />
    <path d="M18 13.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" opacity="0.7" />
  </svg>
);

const IconSwap = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 9.5a8 8 0 0 1 13.6-2.6" />
    <path d="M18.5 2.5v4.6h-4.6" />
    <path d="M19.5 14.5a8 8 0 0 1-13.6 2.6" />
    <path d="M5.5 21.5v-4.6h4.6" />
  </svg>
);

/* --------------------------------- helpers -------------------------------- */

const TIMEFRAMES = ['1H', '1D', '1W', '1M', '1Y', 'YTD', 'ALL'];
const QUICK_USD = [100, 500, 1000, 5000];

const TF_SETTINGS = {
  '1H': { points: 60, minChange: -0.02, maxChange: 0.02 },
  '1D': { points: 78, minChange: -0.06, maxChange: 0.06 },
  '1W': { points: 84, minChange: -0.14, maxChange: 0.16 },
  '1M': { points: 90, minChange: -0.28, maxChange: 0.34 },
  '1Y': { points: 104, minChange: -0.55, maxChange: 1.4 },
  YTD: { points: 92, minChange: -0.5, maxChange: 1.1 },
  ALL: { points: 120, minChange: -0.7, maxChange: 4 },
};

function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatPrice(value) {
  if (!Number.isFinite(value) || value === 0) return '$0.00';
  if (value >= 1000) {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(6)}`;
}

function formatMoney(value) {
  if (!Number.isFinite(value) || Math.abs(value) < 0.01) return '$0.00';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAmount(value) {
  if (!Number.isFinite(value) || value === 0) return '0';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  if (value < 0.00001) return '< 0.00001';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: value < 1 ? 5 : 2,
    maximumFractionDigits: value < 1 ? 5 : 4,
  });
}

/* -------------------------------- component ------------------------------- */

export default function TrustTokenDetail({ token, onBack }) {
  const { trust, updateTrustTokenAmount } = useWalletStore();

  const [timeframe, setTimeframe] = useState('1D');
const [starred, setStarred] = useState(true);
  const [scrubIndex, setScrubIndex] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState('add');
  const [amountInput, setAmountInput] = useState('');
  const [error, setError] = useState('');
  const chartRef = useRef(null);

  const quote = useMemo(
    () => getTokenQuote(token, trust.prices) || { usd: 0, change: 0, imageUrl: '' },
    [token, trust.prices]
  );

  const price = Number(quote.usd) || 0;
  const change = Number(quote.change) || 0;
  const amount = Number(token.amount) || 0;
  const balanceUsd = price * amount;
  const negative = change < 0;
  const changeUsd = change !== 0 ? price - price / (1 + change / 100) : 0;

  /* -------- chart series (stable per token + timeframe) -------- */
  const chart = useMemo(() => {
    const cfg = TF_SETTINGS[timeframe];
    const rng = mulberry32(hashSeed(`${token.id || token.symbol}|${timeframe}`));
    const end = price || 1;

    let totalChange;
    if (timeframe === '1D' && change !== 0) {
      totalChange = change / 100;
    } else {
      totalChange = cfg.minChange + rng() * (cfg.maxChange - cfg.minChange);
    }
    const start = end / (1 + totalChange);

    const n = cfg.points;
    const raw = [0];
    for (let i = 1; i < n; i++) raw.push(raw[i - 1] + (rng() - 0.5) * 2);
    const rMin = Math.min(...raw);
    const rMax = Math.max(...raw);
    const rSpan = rMax - rMin || 1;
    const prices = raw.map((v) => start + ((end - start) * (v - rMin)) / rSpan);

    const pMin = Math.min(...prices);
    const pMax = Math.max(...prices);
    const pad = (pMax - pMin) * 0.14 || Math.max(pMax * 0.02, 0.01);
    const lo = pMin - pad;
    const hi = pMax + pad;

    const W = 390;
    const H = 260;
    const x = (i) => (i / (n - 1)) * W;
    const yFor = (p) => H - ((p - lo) / (hi - lo)) * H;

    const lineD = prices
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)} ${yFor(p).toFixed(2)}`)
      .join(' ');
    const areaD = `${lineD} L ${W} ${H} L 0 ${H} Z`;

    return { prices, lineD, areaD, yFor, H };
  }, [token.id, token.symbol, timeframe, price, change]);

  const gradientId = useMemo(
    () => `twd-fill-${String(token.id || token.symbol).replace(/[^a-zA-Z0-9]/g, '')}`,
    [token.id, token.symbol]
  );

  const lineColor = negative ? '#ff453a' : '#3fcf7f';
  const lastIndex = chart.prices.length - 1;
  const topPct = (p) => (chart.yFor(p) / chart.H) * 100;

  /* -------- scrubbing -------- */
  const handleScrubMove = (event) => {
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const fraction = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    setScrubIndex(Math.round(fraction * lastIndex));
  };

  /* -------- balance editing -------- */
  const parsedInput = parseFloat(amountInput);
  const inputValid = Number.isFinite(parsedInput) && parsedInput >= 0;
  const usdPreview = inputValid ? parsedInput * price : 0;

  const applyQuickUsd = (usd) => {
    if (!price) return;
    setAmountInput(String(Number((usd / price).toFixed(6))));
    setError('');
  };

  const saveBalance = () => {
    if (!inputValid) {
      setError('Enter a valid amount');
      return;
    }
    const next = mode === 'add' ? amount + parsedInput : parsedInput;
    if (token.id) updateTrustTokenAmount(token.id, next);
    setSheetOpen(false);
    setAmountInput('');
    setError('');
  };

  return (
    <div className="twd-screen">
      {/* header */}
      <header className="twd-header">
        <button className="twd-circle-btn" type="button" onClick={onBack} aria-label="Back">
          <IconChevronLeft />
        </button>
        <button
          className={`twd-circle-btn star ${starred ? 'active' : ''}`}
          type="button"
          onClick={() => setStarred((s) => !s)}
          aria-label="Favorite"
        >
          <IconStar filled={starred} />
        </button>
      </header>

      {/* token row */}
      <div className="twd-token-row">
        <span className="twd-token-icon">
          {token.symbol === 'ETH' ? (
            <IconEth />
          ) : quote.imageUrl || token.icon ? (
            <img
              src={quote.imageUrl || token.icon}
              alt={token.symbol}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            (token.symbol || '?').slice(0, 1)
          )}
        </span>
        <div className="twd-token-id">
          <span className="twd-token-sym">{token.symbol}</span>
          <span className="twd-token-name">{token.name || token.symbol}</span>
        </div>
        <div className="twd-token-side">
          <span className="twd-token-price">{formatPrice(price)}</span>
          <span className={`twd-token-change ${change === 0 ? 'flat' : negative ? 'neg' : 'pos'}`}>
            {change !== 0
              ? `${changeUsd >= 0 ? '+' : '-'}${formatPrice(Math.abs(changeUsd))} (${change >= 0 ? '+' : ''}${change.toFixed(2)}%)`
              : '0.00%'}
          </span>
        </div>
      </div>

      {/* chart */}
      <div
        className="twd-chart"
        ref={chartRef}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          handleScrubMove(e);
        }}
        onPointerMove={(e) => {
          if (scrubIndex !== null) handleScrubMove(e);
        }}
        onPointerUp={() => setScrubIndex(null)}
        onPointerCancel={() => setScrubIndex(null)}
        onPointerLeave={() => setScrubIndex(null)}
      >
        <svg viewBox="0 0 390 260" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.26" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={chart.areaD} fill={`url(#${gradientId})`} />
          <path
            d={chart.lineD}
            fill="none"
            stroke={lineColor}
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {scrubIndex === null ? (
          <span className="twd-end-dot" style={{ top: `${topPct(chart.prices[lastIndex])}%` }} />
        ) : (
          <>
            <div
              className="twd-scrub-label"
              style={{ left: `${Math.min(Math.max((scrubIndex / lastIndex) * 100, 10), 90)}%` }}
            >
              {formatPrice(chart.prices[scrubIndex])}
            </div>
            <div
              className="twd-scrub-line"
              style={{ left: `${(scrubIndex / lastIndex) * 100}%` }}
            />
            <div
              className="twd-scrub-dot"
              style={{
                left: `${(scrubIndex / lastIndex) * 100}%`,
                top: `${topPct(chart.prices[scrubIndex])}%`,
              }}
            />
          </>
        )}
      </div>

      {/* timeframes */}
      <div className="twd-timeframes">
        <button className="twd-tf-settings" type="button" aria-label="Chart settings">
          <IconCandles />
        </button>
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            className={`twd-tf ${timeframe === tf ? 'active' : ''}`}
            type="button"
            onClick={() => {
              setTimeframe(tf);
              setScrubIndex(null);
            }}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* balance */}
      <button className="twd-balance" type="button" onClick={() => { setMode('add'); setSheetOpen(true); }}>
        <span className="twd-balance-label">Your balance</span>
        <span className="twd-balance-right">
          <span className="twd-balance-value">{formatMoney(balanceUsd)}</span>
          <span className="twd-balance-amount">{formatAmount(amount)} {token.symbol}</span>
          <span className="twd-balance-hint">Tap to add funds</span>
        </span>
      </button>

      {/* send / receive */}
      <div className="twd-actions">
        <button className="twd-action-btn" type="button">
          <IconSend />
          Send
        </button>
        <button
          className="twd-action-btn"
          type="button"
          onClick={() => { setMode('add'); setSheetOpen(true); }}
        >
          <IconReceive />
          Receive
        </button>
      </div>

      {/* ai summary */}
      <div className="twd-ai">
        <IconSparkle />
        AI Summary
      </div>

      {/* trade */}
      <button className="twd-trade" type="button">
        <IconSwap />
        Trade
      </button>

      {/* receive / add funds sheet */}
      {sheetOpen ? (
        <div
          className="twd-sheet-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setSheetOpen(false); }}
        >
          <div className="twd-sheet">
            <div className="twd-sheet-handle" />
            <div className="twd-sheet-title">
              <h3>Receive {token.symbol}</h3>
              <button className="twd-sheet-close" type="button" onClick={() => setSheetOpen(false)}>×</button>
            </div>

            <div className="twd-mode-seg">
              <button
                className={mode === 'add' ? 'active' : ''}
                type="button"
                onClick={() => setMode('add')}
              >
                Add to balance
              </button>
              <button
                className={mode === 'set' ? 'active' : ''}
                type="button"
                onClick={() => setMode('set')}
              >
                Set exact
              </button>
            </div>

            <div className="twd-form-group">
              <label>Amount ({token.symbol})</label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                className="twd-amount-input"
                value={amountInput}
                placeholder="0.00"
                onChange={(e) => { setAmountInput(e.target.value); setError(''); }}
              />
              <div className="twd-usd-preview">≈ {formatMoney(usdPreview)}</div>
            </div>

            <div className="twd-chip-row">
              {QUICK_USD.map((usd) => (
                <button
                  key={usd}
                  className="twd-chip"
                  type="button"
                  disabled={!price}
                  onClick={() => applyQuickUsd(usd)}
                >
                  +${usd.toLocaleString()}
                </button>
              ))}
            </div>

            {error ? <div className="twd-error">{error}</div> : null}

            <button className="twd-sheet-save" type="button" onClick={saveBalance}>
              {mode === 'add' ? 'Add to balance' : 'Save balance'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}