import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchBasePrices,
  fetchDexscreenerToken,
  getTokenQuote,
  useWalletStore,
} from '../../store/useWalletStore';
import PullToRefresh from '../../components/PullToRefresh';

const TIMEFRAMES = ['LIVE', '1D', '1W', '1M', '1Y', 'ALL'];

const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const IconChevronRight = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="#a1a1a6" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    width="20" 
    height="20"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

// Replaced Bell with Phantom Heart Icon
const IconHeart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.25-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const IconMore = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

// Fixed 2-bar Phantom Filter Icon
const IconSliders = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M8 4v16M16 4v16M5 9h6M13 15h6" />
  </svg>
);

const ETH_LOGO_URL = '/tokens-logos/ethereum_logo.webp';

function TokenAvatar({ token, imageUrl }) {
  const isEthereum = token?.symbol?.toUpperCase() === 'ETH' || token?.name?.toLowerCase() === 'ethereum';
  const displayImage = isEthereum ? ETH_LOGO_URL : imageUrl;

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
        <span style={{ color: '#000', fontSize: '18px', fontWeight: '900' }}>Ξ</span>
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
  if (!value || value <= 0) return '$575.3M';
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
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  }).replace(' ', '');
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

function generateSeries(currentPrice, changePercent, timeframe) {
  const pointCount =
    timeframe === 'LIVE' ? 16 :
    timeframe === '1D' ? 120 :
    timeframe === '1W' ? 160 :
    timeframe === '1M' ? 180 :
    timeframe === '1Y' ? 240 :
    300;
  const now = Date.now();
  const durationMs =
    timeframe === 'LIVE' ? 60 * 60 * 1000 :
    timeframe === '1D' ? 24 * 60 * 60 * 1000 :
    timeframe === '1W' ? 7 * 24 * 60 * 60 * 1000 :
    timeframe === '1M' ? 30 * 24 * 60 * 60 * 1000 :
    timeframe === '1Y' ? 365 * 24 * 60 * 60 * 1000 :
    365 * 2 * 24 * 60 * 60 * 1000;

  const startPrice = currentPrice > 0 ? currentPrice / (1 + changePercent / 100) : 1;
  const endPrice = currentPrice > 0 ? currentPrice : startPrice;
  const volatility = 0.02;

  const points = [];
  const random = createSeededRandom(`${currentPrice}-${changePercent}-${timeframe}`);
  let value = startPrice;

  for (let index = 0; index < pointCount; index += 1) {
    const progress = index / (pointCount - 1);
    const drift = (endPrice - value) * 0.08;
    const wave = Math.sin(progress * Math.PI * 4) * currentPrice * volatility * 0.3;
    const noise = (random() - 0.5) * currentPrice * volatility;
    value = index === pointCount - 1 ? endPrice : Math.max(0.000001, value + drift + noise + wave);
    points.push({
      time: new Date(now - durationMs + progress * durationMs),
      value,
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
    () => generateSeries(liveQuote.usd || 1, liveQuote.change || 0, timeframe),
    [liveQuote.change, liveQuote.usd, timeframe],
  );
  const amount = token.amount || 0;
  const totalValue = amount * liveQuote.usd;
  const return24h = amount > 0 && liveQuote.change !== 0
    ? totalValue - (liveQuote.usd / (1 + liveQuote.change / 100)) * amount
    : 0;

  const loadTokenInfo = useCallback(async () => {
    const pair = token.dexscreenerAddress ? await fetchDexscreenerToken(token.dexscreenerAddress) : null;
    if (!pair) return;

    setTokenInfo({
      imageUrl: pair.info?.imageUrl || token.icon || '',
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
        imageUrl: pair.info?.imageUrl || token.icon || '',
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
  const activePrice = activePoint?.value ?? liveQuote.usd;
  const startValue = chartData[0]?.value || activePrice || 1;
  const activeChangeValue = activePrice - startValue;
  const activeChangePct = startValue ? (activeChangeValue / startValue) * 100 : 0;
  const lineIsNegative = activeChangeValue < 0;

  // Render edge-to-edge chart with glowing end-dot
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartData.length === 0) return;

    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);

    const min = Math.min(...chartData.map((point) => point.value));
    const max = Math.max(...chartData.map((point) => point.value));
    const range = max - min || 1;
    const padX = 0; // Edge to edge!
    const padY = 12;
    const width = rect.width;
    const height = rect.height - padY * 2;

    const getX = (index) => (index / (chartData.length - 1)) * width;
    const getY = (value) => padY + height - ((value - min) / range) * height;

    const lineColor = lineIsNegative ? '#ff453a' : '#00e557';

    context.beginPath();
    for (let index = 0; index < chartData.length; index += 1) {
      const x = getX(index);
      const y = getY(chartData[index].value);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = lineColor;
    context.lineWidth = 2.4;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.stroke();

    if (scrubIndex !== null) {
      const activeX = getX(scrubIndex);
      const activeY = getY(chartData[scrubIndex].value);

      context.beginPath();
      context.moveTo(activeX, 0);
      context.lineTo(activeX, rect.height);
      context.strokeStyle = 'rgba(255,255,255,0.15)';
      context.lineWidth = 1;
      context.stroke();

      context.beginPath();
      context.arc(activeX, activeY, 5, 0, Math.PI * 2);
      context.fillStyle = lineColor;
      context.fill();
    } else {
      // Pulsing/glowing right dot tip
      const lastX = getX(chartData.length - 1) - 4;
      const lastY = getY(chartData[chartData.length - 1].value);

      context.beginPath();
      context.arc(lastX, lastY, 7, 0, Math.PI * 2);
      context.fillStyle = lineIsNegative ? 'rgba(255, 69, 58, 0.3)' : 'rgba(0, 229, 87, 0.3)';
      context.fill();

      context.beginPath();
      context.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
      context.fillStyle = lineColor;
      context.fill();
    }
  }, [activeChangeValue, chartData, lineIsNegative, scrubIndex]);

  function updateScrub(clientX) {
    const canvas = canvasRef.current;
    if (!canvas || chartData.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const index = Math.round((x / rect.width) * (chartData.length - 1));
    setScrubIndex(index);
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

  return (
    <div className="ph-detail-v2">
      <div className="ph-detail-sheet-handle" />

      <header className="ph-detail-header-v2">
        <button className="ph-detail-top-avatar-btn" type="button" onClick={onBack} aria-label="Back">
          <TokenAvatar token={token} imageUrl={tokenInfo?.imageUrl || liveQuote.imageUrl || token.icon} />
        </button>

        <div className="ph-detail-header-right">
          <button className="ph-detail-icon-circle" type="button" aria-label="Favorites">
            <IconHeart />
          </button>
          <button className="ph-detail-icon-circle" type="button" aria-label="More Options">
            <IconMore />
          </button>
        </div>
      </header>

      <PullToRefresh className="ph-detail-scroll" onRefresh={refreshDetail}>
        <div>
          <section className="ph-detail-hero-v2">
            <button className="ph-detail-name-btn" type="button">
              <span>{token.name}</span>
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
              <div className="ph-chart-scrub-label" style={{ left: `${activeProgress * 100}%` }}>
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
                  <TokenAvatar token={token} imageUrl={tokenInfo?.imageUrl || liveQuote.imageUrl || token.icon} />
                  <div className="ph-pos-info">
                    <div className="ph-pos-title-row">
                      <span className="ph-pos-sym">{token.symbol}</span>
                      <span className="ph-pos-net">Base</span>
                    </div>
                    <div className="ph-pos-amount">0.00049 {token.symbol}</div>
                  </div>
                </div>
                <div className="ph-pos-right">
                  <div className="ph-pos-value">$1.23</div>
                  <div className="ph-pos-change positive">+$0.02</div>
                </div>
                <IconChevronRight />
              </button>

              <button className="ph-pos-item" type="button">
                <div className="ph-pos-left">
                  <TokenAvatar token={token} imageUrl={tokenInfo?.imageUrl || liveQuote.imageUrl || token.icon} />
                  <div className="ph-pos-info">
                    <div className="ph-pos-title-row">
                      <span className="ph-pos-sym">{token.symbol}</span>
                      <span className="ph-pos-net">{token.network || token.name}</span>
                    </div>
                    <div className="ph-pos-amount">{formatTokenAmount(amount, token.symbol)}</div>
                  </div>
                </div>
                <div className="ph-pos-right">
                  <div className="ph-pos-value">{formatMoney(totalValue)}</div>
                  <div className={`ph-pos-change ${return24h >= 0 ? 'positive' : 'negative'}`}>
                    {return24h >= 0 ? '+' : '-'}{formatMoney(Math.abs(return24h))}
                  </div>
                </div>
                <IconChevronRight />
              </button>
            </div>
          </section>
        </div>
      </PullToRefresh>

      <div className="ph-detail-bottom-dock">
        <div className="ph-detail-mcap">
          <span className="ph-detail-mcap-val">{formatLargeNumber(tokenInfo?.marketCap || liveQuote.marketCap)}</span>
          <span className="ph-detail-mcap-lbl">market cap</span>
        </div>
        <button className="ph-detail-trade-btn" type="button">
          Trade
        </button>
      </div>
    </div>
  );
}