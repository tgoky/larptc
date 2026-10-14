import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchBasePrices,
  fetchDexscreenerToken,
  getTokenQuote,
  useWalletStore,
} from '../../store/useWalletStore';
import PullToRefresh from '../../components/PullToRefresh';
import './PhantomWallet.css';

const TIMEFRAMES = ['LIVE', '1D', '1W', '1M', '1Y', 'ALL'];

const CHART_PRESETS = {
  LIVE: { pointCount: 96,  durationMs: 30 * 60 * 1000,                 volatility: 0.011, spikeChance: 0.08, spikeScale: 2.6 },
  '1D': { pointCount: 150, durationMs: 24 * 60 * 60 * 1000,            volatility: 0.008, spikeChance: 0.05, spikeScale: 2.2 },
  '1W': { pointCount: 170, durationMs: 7 * 24 * 60 * 60 * 1000,        volatility: 0.009, spikeChance: 0.05, spikeScale: 2.2 },
  '1M': { pointCount: 190, durationMs: 30 * 24 * 60 * 60 * 1000,       volatility: 0.010, spikeChance: 0.05, spikeScale: 2.2 },
  '1Y': { pointCount: 230, durationMs: 365 * 24 * 60 * 60 * 1000,      volatility: 0.014, spikeChance: 0.04, spikeScale: 2.0 },
  ALL:  { pointCount: 260, durationMs: 2 * 365 * 24 * 60 * 60 * 1000,  volatility: 0.020, spikeChance: 0.04, spikeScale: 2.0 },
};

const LIVE_RIGHT_GAP_RATIO = 0.13;

const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const IconChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#a1a1a6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const IconHeart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" width="19" height="19">
    <path d="M19.5 13.572 12 21l-7.5-7.428A5 5 0 1 1 12 7.006a5 5 0 1 1 7.5 6.572Z" />
  </svg>
);

/* Exact Apple SF Symbol: square.and.arrow.up.fill */
const IconUploadSolid = () => (
  <svg width="19" height="21" viewBox="0 0 24 26" fill="currentColor">
    {/* Smooth rounded upward arrow */}
    <path d="M12 1.2a1.3 1.3 0 0 1 .92.38l4.4 4.4a1.3 1.3 0 0 1-1.84 1.84L13.3 5.64v8.16a1.3 1.3 0 1 1-2.6 0V5.64L8.52 7.82a1.3 1.3 0 0 1-1.84-1.84l4.4-4.4a1.3 1.3 0 0 1 .92-.38z" />
    {/* Soft squircle tray with continuous rounded corners */}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5 9c-2.76 0-5 2.24-5 5v5.5C0 22.54 2.46 25 5.5 25h13c3.04 0 5.5-2.46 5.5-5.5V14c0-2.76-2.24-5-5-5h-4.3a1.2 1.2 0 0 0-1.2 1.2v5.6a1.5 1.5 0 1 1-3 0v-5.6A1.2 1.2 0 0 0 9.3 9H5z"
    />
  </svg>
);


const IconMoreDots = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <circle cx="5" cy="12" r="2.1" />
    <circle cx="12" cy="12" r="2.1" />
    <circle cx="19" cy="12" r="2.1" />
  </svg>
);

/* Exact 45° paper plane Send glyph */
const IconSendDiagonal = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.5 10.6c-.7-.4-.7-1.5 0-1.8L19.8 1.3c.8-.4 1.7.3 1.5 1.2l-3.8 17.5c-.2.8-1.2 1.1-1.8.5l-5.1-4.7-4.2 3.2c-.6.4-1.4 0-1.4-.7v-3.8l7.2-6.5-9.7 4.5z" />
  </svg>
);

/* Exact QR Module Receive glyph */
const IconReceiveQr = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M6 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z" />
    <path fillRule="evenodd" clipRule="evenodd" d="M18 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z" />
    <path fillRule="evenodd" clipRule="evenodd" d="M6 14a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z" />
    <rect x="15" y="14" width="2.6" height="2.6" rx="0.8" />
    <rect x="19" y="14" width="3.2" height="2.4" rx="0.8" />
    <path d="M19 18h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z" />
    <circle cx="15.8" cy="20.5" r="1.3" />
  </svg>
);

const IconSliders = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M8 4v16M16 4v16M5 9h6M13 15h6" />
  </svg>
);

const CANONICAL_LOGOS = {
  USDC: '/token-logos/usdc.png',
  ETH: '/token-logos/ethereum_logo.webp',
  SOL: '/token-logos/solana_logo.png',
  BTC: '/token-logos/btc.png',
};

function resolveLogo(token, fallbackUrl) {
  const sym = token?.symbol?.toUpperCase();
  if (sym && CANONICAL_LOGOS[sym]) return CANONICAL_LOGOS[sym];
  return token?.icon || fallbackUrl || '';
}

function TokenAvatar({ token, imageUrl }) {
  const displayImage = resolveLogo(token, imageUrl);

  return (
    <div className="ph-detail-avatar">
      {displayImage ? (
        <img
          src={displayImage}
          alt={token.symbol}
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <span style={{ color: '#fff', fontSize: '16px', fontWeight: '800' }}>
          {token?.symbol?.slice(0, 1) || '?'}
        </span>
      )}
    </div>
  );
}

function formatMoney(value) {
  if (!value) return '$0.00';
  if (Math.abs(value) < 0.01) return value > 0 ? '<$0.01' : '-<$0.01';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatLargeNumber(value) {
  if (!value || value <= 0) return '--';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
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

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(' ', '');
}

function createSeededRandom(seedText) {
  let seed = 0;
  for (let index = 0; index < seedText.length; index += 1) {
    seed = (seed * 31 + seedText.charCodeAt(index)) >>> 0;
  }
  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function deriveBaseAmount(tokenId, price) {
  const rand = createSeededRandom(`${tokenId}|base-pos`);
  const targetFiat = 0.5 + rand() * 3;
  const rough = targetFiat / Math.max(price, 0.01);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  return Number(((1 + rand() * 8.9) * magnitude).toPrecision(2));
}

function deriveDustAmount(tokenId, price) {
  const rand = createSeededRandom(`${tokenId}|dust-pos`);
  const targetFiat = 0.02 + rand() * 0.13;
  const rough = targetFiat / Math.max(price, 0.01);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  return Number(((1 + rand() * 8.9) * magnitude).toPrecision(2));
}

function deriveFallbackMcap(tokenId) {
  const rand = createSeededRandom(`${tokenId}|mcap`);
  const magnitude = Math.pow(10, 9 + Math.floor(rand() * 2));
  return Math.round((1 + rand() * 4) * magnitude);
}

function generateSeries(currentPrice, changePercent, timeframe, seedKey) {
  const preset = CHART_PRESETS[timeframe] || CHART_PRESETS.LIVE;
  const now = Date.now();
  const price = currentPrice > 0 ? currentPrice : 1;
  const safeChange = Math.min(Math.max(Number.isFinite(changePercent) ? changePercent : 0, -95), 95);

  const endLog = Math.log(price);
  const startLog = endLog - Math.log(1 + safeChange / 100);
  const steps = preset.pointCount - 1;
  const random = createSeededRandom(`${seedKey || 'token'}|${timeframe}`);

  const walk = new Array(preset.pointCount);
  walk[0] = 0;
  for (let i = 1; i <= steps; i += 1) {
    let step = random() * 2 - 1;
    if (random() < preset.spikeChance) step *= preset.spikeScale;
    walk[i] = walk[i - 1] + step;
  }
  const netDrift = walk[steps];

  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const detrended = walk[i] - netDrift * t;
    points.push({
      time: new Date(now - preset.durationMs + t * preset.durationMs),
      value: Math.exp(startLog + (endLog - startLog) * t + detrended * preset.volatility),
    });
  }
  return points;
}

export default function PhantomTokenDetail({ token, onBack }) {
  const { phantom, setPhantomPrices } = useWalletStore();
  const canvasRef = useRef(null);
  const dragStateRef = useRef({ dragging: false });
  const [timeframe, setTimeframe] = useState('LIVE');
  const [scrubIndex, setScrubIndex] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);

  const liveQuote = useMemo(() => getTokenQuote(token, phantom.prices), [token, phantom.prices]);

  const chartData = useMemo(
    () => generateSeries(liveQuote.usd || 1, liveQuote.change || 0, timeframe, token.id),
    [liveQuote.change, liveQuote.usd, timeframe, token.id],
  );

  const spoofRef = useRef(null);
  const priceNow = liveQuote.usd > 0 ? liveQuote.usd : 0;
  if (
    !spoofRef.current ||
    spoofRef.current.tokenId !== token.id ||
    (priceNow > 0 && spoofRef.current.derivedWithoutPrice)
  ) {
    const price = priceNow || 1;
    spoofRef.current = {
      tokenId: token.id,
      derivedWithoutPrice: priceNow === 0,
      baseAmount: deriveBaseAmount(token.id, price),
      dustAmount: deriveDustAmount(token.id, price),
      fallbackMcap: deriveFallbackMcap(token.id),
    };
  }
  const { baseAmount, dustAmount, fallbackMcap } = spoofRef.current;

  const amount = token.amount || 0;
  const networkAmount = amount > 0 ? amount : dustAmount;

  const prevPrice = liveQuote.change !== 0
    ? liveQuote.usd / (1 + liveQuote.change / 100)
    : liveQuote.usd;

  const baseValue = baseAmount * liveQuote.usd;
  const basePnl = (liveQuote.usd - prevPrice) * baseAmount;

  const networkValue = networkAmount * liveQuote.usd;
  const networkPnl = (liveQuote.usd - prevPrice) * networkAmount;

  const loadTokenInfo = useCallback(async () => {
    const pair = token.dexscreenerAddress ? await fetchDexscreenerToken(token.dexscreenerAddress) : null;
    if (!pair) return;

    setTokenInfo({
      imageUrl: resolveLogo(token, pair.info?.imageUrl || token.icon || ''),
      marketCap: Number.parseFloat(pair.marketCap || pair.fdv) || 0,
      network: token.network || pair.chainId || token.name,
    });
  }, [token]);

  const refreshDetail = useCallback(async () => {
    const prices = await fetchBasePrices();
    if (Object.keys(prices).length > 0) {
      setPhantomPrices(prices);
    }
    await loadTokenInfo();
  }, [loadTokenInfo, setPhantomPrices]);

  useEffect(() => {
    let isCancelled = false;

    async function loadDetail() {
      const prices = await fetchBasePrices();
      if (!isCancelled && Object.keys(prices).length > 0) {
        setPhantomPrices(prices);
      }

      const pair = token.dexscreenerAddress ? await fetchDexscreenerToken(token.dexscreenerAddress) : null;
      if (isCancelled || !pair) return;

      setTokenInfo({
        imageUrl: resolveLogo(token, pair.info?.imageUrl || token.icon || ''),
        marketCap: Number.parseFloat(pair.marketCap || pair.fdv) || 0,
        network: token.network || pair.chainId || token.name,
      });
    }

    void loadDetail();

    return () => {
      isCancelled = true;
    };
  }, [setPhantomPrices, token]);

  const activeIndex = scrubIndex === null ? (chartData.length - 1) : Math.min(scrubIndex, chartData.length - 1);
  const activePoint = chartData[activeIndex] || null;
  const activeProgress = chartData.length > 1 ? activeIndex / (chartData.length - 1) : 1;
  const plotRatio = timeframe === 'LIVE' ? 1 - LIVE_RIGHT_GAP_RATIO : 1;
  const activePrice = activePoint?.value ?? liveQuote.usd;
  const startValue = chartData[0]?.value || activePrice || 1;
  const activeChangeValue = activePrice - startValue;
  const activeChangePct = startValue ? (activeChangeValue / startValue) * 100 : 0;
  const lineIsNegative = activeChangeValue < 0;

  const drawChart = useCallback((phase = 0) => {
    const canvas = canvasRef.current;
    if (!canvas || chartData.length === 0) return;

    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const targetWidth = Math.round(rect.width * dpr);
    const targetHeight = Math.round(rect.height * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);

    const min = Math.min(...chartData.map((p) => p.value));
    const max = Math.max(...chartData.map((p) => p.value));
    const range = max - min || 1;
    const padY = 14;
    const rightGap = timeframe === 'LIVE' ? Math.round(rect.width * LIVE_RIGHT_GAP_RATIO) : 0;
    const width = rect.width - rightGap;
    const height = rect.height - padY * 2;

    const getX = (i) => (i / (chartData.length - 1)) * width;
    const getY = (v) => padY + height - ((v - min) / range) * height;
    const lineColor = lineIsNegative ? '#ff453a' : '#00e557';

    context.beginPath();
    for (let i = 0; i < chartData.length; i += 1) {
      const x = getX(i);
      const y = getY(chartData[i].value);
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = lineColor;
    context.lineWidth = 2.4;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.stroke();

    const lastIndex = chartData.length - 1;
    if (scrubIndex !== null) {
      const clamped = Math.min(scrubIndex, lastIndex);
      const sx = getX(clamped);
      const sy = getY(chartData[clamped].value);

      context.beginPath();
      context.moveTo(sx, 0);
      context.lineTo(sx, rect.height);
      context.strokeStyle = 'rgba(255,255,255,0.14)';
      context.lineWidth = 1;
      context.stroke();

      context.beginPath();
      context.arc(sx, sy, 5, 0, Math.PI * 2);
      context.fillStyle = lineColor;
      context.fill();
    } else {
      const lx = getX(lastIndex);
      const ly = getY(chartData[lastIndex].value);
      const pulse = 0.5 + 0.5 * Math.sin(phase / 320);

      context.beginPath();
      context.arc(lx, ly, 6 + pulse * 4, 0, Math.PI * 2);
      context.fillStyle = lineIsNegative
        ? `rgba(255, 69, 58, ${0.16 + pulse * 0.16})`
        : `rgba(0, 229, 87, ${0.16 + pulse * 0.16})`;
      context.fill();

      context.beginPath();
      context.arc(lx, ly, 3.6, 0, Math.PI * 2);
      context.fillStyle = lineColor;
      context.fill();
    }
  }, [chartData, lineIsNegative, scrubIndex, timeframe]);

  useEffect(() => {
    drawChart(0);
    if (scrubIndex !== null) return undefined;

    let rafId = requestAnimationFrame(function loop(now) {
      drawChart(now);
      rafId = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(rafId);
  }, [drawChart, scrubIndex]);

  function updateScrub(clientX) {
    const canvas = canvasRef.current;
    if (!canvas || chartData.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const rightGap = timeframe === 'LIVE' ? Math.round(rect.width * LIVE_RIGHT_GAP_RATIO) : 0;
    const plotWidth = Math.max(rect.width - rightGap, 1);
    const x = Math.min(Math.max(clientX - rect.left, 0), plotWidth);
    setScrubIndex(Math.round((x / plotWidth) * (chartData.length - 1)));
  }

  function handlePointerDown(event) {
    dragStateRef.current.dragging = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    updateScrub(event.clientX);
  }

  function handlePointerMove(event) {
    if (!dragStateRef.current.dragging) return;
    updateScrub(event.clientX);
  }

  function handlePointerUp(event) {
    dragStateRef.current.dragging = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  const tokenImage = resolveLogo(token, tokenInfo?.imageUrl || liveQuote.imageUrl);

  return (
    <div className="ph-detail-v2">
      <div className="ph-detail-sheet-handle" />

      {/* Header: Circle for Heart + One Solid Capsule for Upload & More Dots */}
      <header className="ph-detail-header-v2">
        <button className="ph-detail-top-avatar-btn" type="button" onClick={onBack} aria-label="Back">
          <TokenAvatar token={token} imageUrl={tokenImage} />
        </button>

        <div className="ph-detail-header-right">
          <button className="ph-detail-icon-circle" type="button" aria-label="Favorites">
            <IconHeart />
          </button>
          
          <div className="ph-detail-pill-capsule">
            <button className="ph-detail-capsule-item" type="button" aria-label="Share">
              <IconUploadSolid />
            </button>
            <button className="ph-detail-capsule-item" type="button" aria-label="More Options">
              <IconMoreDots />
            </button>
          </div>
        </div>
      </header>

      <PullToRefresh className="ph-detail-scroll" onRefresh={refreshDetail}>
        <div className="ph-detail-scroll-content">
          <section className="ph-detail-hero-v2">
            <button className="ph-detail-name-btn" type="button">
              <span>{token.name}</span>
              <span className="ph-detail-ticker">{token.symbol}</span>
              <IconChevronDown />
            </button>
            <div className="ph-detail-price-v2">{formatMoney(activePrice)}</div>
            <div className={`ph-detail-change-v2 ${lineIsNegative ? 'negative' : 'positive'}`}>
              {activeChangeValue >= 0 ? '+' : '-'}{formatMoney(Math.abs(activeChangeValue))} ({activeChangePct >= 0 ? '+' : ''}{activeChangePct.toFixed(2)}%)
            </div>
          </section>

          <section
            className="ph-detail-chart-v2"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={() => {
              if (!dragStateRef.current.dragging) setScrubIndex(null);
            }}
          >
            {scrubIndex !== null && activePoint ? (
              <div
                className="ph-chart-scrub-label"
                style={{ left: `${activeProgress * plotRatio * 100}%` }}
              >
                {formatTime(activePoint.time)}
              </div>
            ) : null}
            <canvas ref={canvasRef} className="ph-chart-canvas" />
          </section>

          <section className="ph-timeframe-row-v2">
            <div className="ph-timeframe-pills">
              {TIMEFRAMES.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  className={`ph-tf-pill ${entry === timeframe ? 'active' : ''}`}
                  onClick={() => setTimeframe(entry)}
                >
                  {entry === 'LIVE' ? (
                    <>
                      <span className="ph-live-bullet">•</span>LIVE
                    </>
                  ) : (
                    entry
                  )}
                </button>
              ))}
            </div>
            <button className="ph-tf-filter-btn" type="button" aria-label="Chart Settings">
              <IconSliders />
            </button>
          </section>

          <section className="ph-positions-section-v2">
            <h2>Your Positions</h2>
            <div className="ph-positions-list">
              <button className="ph-pos-item" type="button">
                <div className="ph-pos-left">
                  <TokenAvatar token={token} imageUrl={tokenImage} />
                  <div className="ph-pos-info">
                    <div className="ph-pos-title-row">
                      <span className="ph-pos-sym">{token.symbol}</span>
                      <span className="ph-pos-net">Base</span>
                    </div>
                    <div className="ph-pos-amount">{formatTokenAmount(baseAmount, token.symbol)}</div>
                  </div>
                </div>
                <div className="ph-pos-right">
                  <div className="ph-pos-value">{formatMoney(baseValue)}</div>
                  <div className={`ph-pos-change ${basePnl >= 0 ? 'positive' : 'negative'}`}>
                    {basePnl >= 0 ? '+' : '-'}{formatMoney(Math.abs(basePnl))}
                  </div>
                </div>
                <IconChevronRight />
              </button>

              <button className="ph-pos-item" type="button">
                <div className="ph-pos-left">
                  <TokenAvatar token={token} imageUrl={tokenImage} />
                  <div className="ph-pos-info">
                    <div className="ph-pos-title-row">
                      <span className="ph-pos-sym">{token.symbol}</span>
                      <span className="ph-pos-net">{token.network || token.name}</span>
                    </div>
                    <div className="ph-pos-amount">{formatTokenAmount(networkAmount, token.symbol)}</div>
                  </div>
                </div>
                <div className="ph-pos-right">
                  <div className="ph-pos-value">{formatMoney(networkValue)}</div>
                  <div className={`ph-pos-change ${networkPnl >= 0 ? 'positive' : 'negative'}`}>
                    {networkPnl >= 0 ? '+' : '-'}{formatMoney(Math.abs(networkPnl))}
                  </div>
                </div>
                <IconChevronRight />
              </button>
            </div>
          </section>

          {/* Solid capsule Send & Receive buttons with genuine glyphs */}
          <section className="ph-detail-actions-row">
            <button className="ph-detail-action-btn" type="button">
              <IconSendDiagonal />
              <span>Send</span>
            </button>
            <button className="ph-detail-action-btn" type="button">
              <IconReceiveQr />
              <span>Receive</span>
            </button>
          </section>
        </div>
      </PullToRefresh>

      {/* Dock pinned to bottom with wide 42% Trade button */}
      <div className="ph-detail-bottom-dock">
        <div className="ph-detail-mcap">
          <span className="ph-detail-mcap-val">
            {formatLargeNumber(tokenInfo?.marketCap || liveQuote.marketCap || fallbackMcap)}
          </span>
          <span className="ph-detail-mcap-lbl">market cap</span>
        </div>
        <button className="ph-detail-trade-btn" type="button">
          Trade
        </button>
      </div>
    </div>
  );
}