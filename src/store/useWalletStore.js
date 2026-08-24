import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEX_MARKETS = {
  tron: {
    address: 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR',
    fallbackIcon: 'TRX',
    nativeSymbol: 'TRX',
    network: 'Tron',
  },
  usdtTron: {
    address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    fallbackIcon: 'USDT',
    nativeSymbol: 'TRX',
    network: 'Tron',
  },
  solana: {
    address: 'So11111111111111111111111111111111111111112',
    fallbackIcon: 'SOL',
    nativeSymbol: 'SOL',
    network: 'Solana',
  },
  ethereum: {
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    fallbackIcon: 'ETH',
    nativeSymbol: 'ETH',
    network: 'Ethereum',
  },
  bitcoin: {
    address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    fallbackIcon: 'BTC',
    nativeSymbol: 'BTC',
    network: 'Bitcoin',
  },
  sui: {
    address: '0x2::sui::SUI',
    fallbackIcon: 'SUI',
    nativeSymbol: 'SUI',
    network: 'Sui',
  },
  usdc: {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    fallbackIcon: 'USDC',
    nativeSymbol: 'SOL',
    network: 'Solana',
  },
  polygon: {
    address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
    fallbackIcon: 'POL',
    nativeSymbol: 'POL',
    network: 'Polygon',
  },
  bnb: {
    address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    fallbackIcon: 'BNB',
    nativeSymbol: 'BNB',
    network: 'BNB Smart Chain',
  },
  hype: {
    address: '',
    fallbackIcon: 'HYPE',
    nativeSymbol: 'HYPE',
    network: 'Hyperliquid',
  },
  monad: {
    address: '',
    fallbackIcon: 'MON',
    nativeSymbol: 'MON',
    network: 'Monad',
  },
};

const NATIVE_MARKET_BY_NETWORK = {
  Tron: 'tron',
  Solana: 'solana',
  Ethereum: 'ethereum',
  Bitcoin: 'bitcoin',
  Sui: 'sui',
  Polygon: 'polygon',
  'BNB Smart Chain': 'bnb',
  BSC: 'bnb',
  Binance: 'bnb',
  Hyperliquid: 'hype',
  Monad: 'monad',
};

const FALLBACK_ICON_STYLES = {
  tron: { bg: '#ef1f2d', fg: '#ffffff', text: 'TRX', fontSize: 34 },
  usdtTron: { bg: '#26a17b', fg: '#ffffff', text: 'T', fontSize: 56 },
  solana: { bg: '#0b0b0f', fg: '#43f58a', text: 'SOL', fontSize: 30 },
  ethereum: { bg: '#e8e8ed', fg: '#1b1b1f', text: 'ETH', fontSize: 28 },
  bitcoin: { bg: '#f7931a', fg: '#ffffff', text: 'BTC', fontSize: 28 },
  sui: { bg: '#6ec7ff', fg: '#ffffff', text: 'SUI', fontSize: 28 },
  usdc: { bg: '#2775ca', fg: '#ffffff', text: 'USDC', fontSize: 24 },
  polygon: { bg: '#8247e5', fg: '#ffffff', text: 'POL', fontSize: 26 },
  bnb: { bg: '#0c1017', fg: '#f0b90b', text: 'BNB', fontSize: 28 },
  hype: { bg: '#0f1318', fg: '#ffffff', text: 'HYPE', fontSize: 23 },
  monad: { bg: '#18181d', fg: '#ffffff', text: 'MON', fontSize: 24 },
};

function makeCircleIcon({ bg, fg, text, fontSize = 32 }) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="50" fill="${bg}" />
      <text
        x="50"
        y="55"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="${fg}"
        font-family="Inter, Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="700"
      >${text}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const FALLBACK_ICON_URLS = Object.fromEntries(
  Object.entries(FALLBACK_ICON_STYLES).map(([marketKey, style]) => [marketKey, makeCircleIcon(style)])
);

const NETWORK_BADGE_PATHS = {
  tron: '/network-badges/tron.png',
  solana: '/network-badges/solana.svg',
  ethereum: '/network-badges/ethereum.svg',
  bitcoin: '/network-badges/bitcoin.svg',
  sui: '/network-badges/sui.svg',
  polygon: '/network-badges/polygon.svg',
  bnb: '/network-badges/bnb.svg',
  hype: '/network-badges/hyperliquid.svg',
  monad: '/network-badges/monad.svg',
};

const TOKEN_LOGO_PATHS = {
  bnb: '/token-logos/bnb.png',
  bitcoin: '/token-logos/btc.png',
  ethereum: '/token-logos/ethereum_logo.webp',
  solana: '/token-logos/solana_logo.png',
  usdc: '/token-logos/usdc.png',
  usdtTron: '/token-logos/usdt.png',
  tron: '/token-logos/tron_logo.png',  
  hype: '/token-logos/hyperliquid.webp',
  monad: '/token-logos/monad_logo.png',
  sui: '/token-logos/sui_logo.jpg',
  polygon: '/token-logos/polygon_logo.png',
};

export function getFallbackIconUrl(marketKey) {
  return FALLBACK_ICON_URLS[marketKey] || '';
}

export function getNetworkBadgeIconUrl(marketKey) {
  return NETWORK_BADGE_PATHS[marketKey] || '';
}

export function getTokenLogoIconUrl(marketKey) {
  return TOKEN_LOGO_PATHS[marketKey] || '';
}

function getPreferredTokenIconUrl(marketKey, fallbackUrl = '') {
  return getTokenLogoIconUrl(marketKey) || fallbackUrl || getFallbackIconUrl(marketKey);
}

function normalizeAddress(value) {
  return (value || '').trim().toLowerCase();
}

export function getNativeMarketKeyForNetwork(network) {
  return NATIVE_MARKET_BY_NETWORK[network] || null;
}

function getTokenOverlayMarketKey(token) {
  const networkMarketKey = token.networkMarketKey || getNativeMarketKeyForNetwork(token.network);
  if (!networkMarketKey) return null;

  const nativeSymbol = DEX_MARKETS[networkMarketKey]?.nativeSymbol;
  if (!nativeSymbol) return null;
  if ((token.symbol || '').toUpperCase() === nativeSymbol.toUpperCase()) return null;

  return networkMarketKey;
}

const defaultPhantomTokens = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', verified: true, amount: 0, marketKey: 'ethereum', dexscreenerAddress: DEX_MARKETS.ethereum.address, network: 'Ethereum', icon: getPreferredTokenIconUrl('ethereum') },
  { id: 'solana', name: 'Solana', symbol: 'SOL', verified: true, amount: 0, marketKey: 'solana', dexscreenerAddress: DEX_MARKETS.solana.address, network: 'Solana', icon: getPreferredTokenIconUrl('solana') },
  {
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
    verified: true,
    amount: 0,
    marketKey: 'usdc',
    dexscreenerAddress: DEX_MARKETS.usdc.address,
    network: 'Solana',
    icon: getPreferredTokenIconUrl('usdc'),
  },
];

const defaultPhantom = {
  username: '@housedge',
  accountNumber: 45,
  cashBalance: 0,
  tokens: defaultPhantomTokens,
  prices: {},
};

const defaultTrustTokens = [
  { id: 'custom-trx', name: 'TRX', symbol: 'TRX', amount: 0, marketKey: 'tron', dexscreenerAddress: DEX_MARKETS.tron.address, network: 'Tron', icon: getFallbackIconUrl('tron') },
  { id: 'custom-usdt', name: 'USDT', symbol: 'USDT', amount: 0, marketKey: 'usdtTron', dexscreenerAddress: DEX_MARKETS.usdtTron.address, network: 'Tron', networkMarketKey: 'tron', icon: getFallbackIconUrl('usdtTron') },
  { id: 'custom-btc', name: 'Bitcoin', symbol: 'BTC', amount: 0, marketKey: 'bitcoin', dexscreenerAddress: DEX_MARKETS.bitcoin.address, network: 'Bitcoin', icon: getPreferredTokenIconUrl('bitcoin') },
  { id: 'custom-eth', name: 'Ethereum', symbol: 'ETH', amount: 0, marketKey: 'ethereum', dexscreenerAddress: DEX_MARKETS.ethereum.address, network: 'Ethereum', icon: getPreferredTokenIconUrl('ethereum') },
  { id: 'custom-bnb', name: 'BNB', symbol: 'BNB', amount: 0, marketKey: 'bnb', dexscreenerAddress: DEX_MARKETS.bnb.address, network: 'BNB Smart Chain', icon: getFallbackIconUrl('bnb') },
  { id: 'custom-sol', name: 'Solana', symbol: 'SOL', amount: 0, marketKey: 'solana', dexscreenerAddress: DEX_MARKETS.solana.address, network: 'Solana', icon: getPreferredTokenIconUrl('solana') },
];

const defaultTrust = {
  walletName: 'Main Wallet 23',
  tokens: defaultTrustTokens,
  prices: {},
};

const TOKEN_PRICE_INDEX = {
  tron: ['custom-trx'],
  usdtTron: ['custom-usdt'],
  solana: ['solana', 'custom-sol'],
  ethereum: ['ethereum', 'custom-eth'],
  bitcoin: ['bitcoin-taproot', 'bitcoin-segwit', 'custom-btc'],
  bnb: ['custom-bnb'],
  usdc: ['usdc'],
};

function mergeTokenDefaults(tokens, defaults) {
  const mergedDefaults = defaults.map((defaultToken) => {
    const persistedToken = tokens.find((token) => token.id === defaultToken.id);
    return persistedToken ? { ...defaultToken, ...persistedToken } : defaultToken;
  });

  const customTokens = tokens.filter(
    (token) => !defaults.some((defaultToken) => defaultToken.id === token.id)
  );

  return [...mergedDefaults, ...customTokens];
}

export function getTokenQuote(token, prices) {
  if (prices[token.id]) {
    const entry = prices[token.id];
    return {
      usd: entry.usd || 0,
      change: entry.change || 0,
      imageUrl: getPreferredTokenIconUrl(token.marketKey, entry.imageUrl || token.icon),
      marketCap: entry.marketCap || 0,
      fdv: entry.fdv || 0,
      chainId: entry.chainId || token.network || '',
    };
  }

  if (Object.prototype.hasOwnProperty.call(token, 'currentPrice')) {
    return {
      usd: token.currentPrice,
      change: token.priceChange24h || 0,
      imageUrl: getPreferredTokenIconUrl(token.marketKey, token.icon),
      marketCap: token.marketCap || 0,
      fdv: token.fdv || 0,
      chainId: token.chainId || token.network || '',
    };
  }

  const entry = prices[token.id];
  if (entry) {
    return {
      usd: entry.usd || 0,
      change: entry.change || 0,
      imageUrl: entry.imageUrl || '',
      marketCap: entry.marketCap || 0,
      fdv: entry.fdv || 0,
      chainId: entry.chainId || token.network || '',
    };
  }

  return {
    usd: 0,
    change: 0,
    imageUrl: getPreferredTokenIconUrl(token.marketKey, token.icon),
    marketCap: 0,
    fdv: 0,
    chainId: token.network || '',
  };
}

export function getTokenOverlayIcon(token) {
  const overlayMarketKey = getTokenOverlayMarketKey(token);
  if (!overlayMarketKey) return '';
  return getNetworkBadgeIconUrl(overlayMarketKey) || getFallbackIconUrl(overlayMarketKey);
}

export function getTokenOverlayFallbackIcon(token) {
  const overlayMarketKey = getTokenOverlayMarketKey(token);
  return overlayMarketKey ? getFallbackIconUrl(overlayMarketKey) : '';
}

export const useWalletStore = create(
  persist(
    (set) => ({
      phantom: { ...defaultPhantom },
      trust: { ...defaultTrust },

      setPhantomUsername: (username) =>
        set((state) => ({
          phantom: { ...state.phantom, username },
        })),

      setPhantomAccountNumber: (num) =>
        set((state) => ({
          phantom: { ...state.phantom, accountNumber: num },
        })),

      addPhantomToken: (token) =>
        set((state) => ({
          phantom: {
            ...state.phantom,
            tokens: [...state.phantom.tokens, token],
          },
        })),

      updatePhantomTokenAmount: (tokenId, newAmount) =>
        set((state) => ({
          phantom: {
            ...state.phantom,
            tokens: state.phantom.tokens.map((token) =>
              token.id === tokenId ? { ...token, amount: newAmount } : token
            ),
          },
        })),

      removePhantomToken: (tokenId) =>
        set((state) => ({
          phantom: {
            ...state.phantom,
            tokens: state.phantom.tokens.filter((token) => token.id !== tokenId),
          },
        })),

      setPhantomPrices: (prices) =>
        set((state) => ({
          phantom: { ...state.phantom, prices },
          trust: { ...state.trust, prices },
        })),

      setTokenPriceData: (tokenId, price, change24h, extras = {}) =>
        set((state) => ({
          phantom: {
            ...state.phantom,
            tokens: state.phantom.tokens.map((token) =>
              token.id === tokenId
                ? { ...token, currentPrice: price, priceChange24h: change24h, ...extras }
                : token
            ),
          },
        })),

      setTrustWalletName: (walletName) =>
        set((state) => ({
          trust: { ...state.trust, walletName },
        })),

      addTrustToken: (token) =>
        set((state) => ({
          trust: {
            ...state.trust,
            tokens: [...state.trust.tokens, token],
          },
        })),

      updateTrustTokenAmount: (tokenId, newAmount) =>
        set((state) => ({
          trust: {
            ...state.trust,
            tokens: state.trust.tokens.map((token) =>
              token.id === tokenId ? { ...token, amount: newAmount } : token
            ),
          },
        })),

      removeTrustToken: (tokenId) =>
        set((state) => ({
          trust: {
            ...state.trust,
            tokens: state.trust.tokens.filter((token) => token.id !== tokenId),
          },
        })),

      clearTrustData: () =>
        set((state) => ({
          trust: {
            ...state.trust,
            tokens: state.trust.tokens.map((token) => ({ ...token, amount: 0 })),
          },
        })),

      resetTrust: () =>
        set(() => ({
          trust: { ...defaultTrust },
        })),

      resetPhantom: () =>
        set(() => ({
          phantom: { ...defaultPhantom },
        })),
    }),
    {
      name: 'wallet-spoof-storage',
      version: 4,
      migrate: (persistedState, version) => {
        if (!persistedState) return persistedState;
        if (version < 4) {
          return {
            ...persistedState,
            trust: { ...defaultTrust },
          };
        }
        return persistedState;
      },
      merge: (persistedState, currentState) => {
        if (!persistedState) return currentState;

        const merged = { ...currentState, ...persistedState };
        merged.phantom = { ...defaultPhantom, ...(persistedState.phantom || {}) };
        merged.trust = { ...defaultTrust, ...(persistedState.trust || {}) };

        if (merged.phantom.tokens) {
          merged.phantom.tokens = mergeTokenDefaults(merged.phantom.tokens, defaultPhantomTokens);
        }

        if (merged.trust.tokens) {
          merged.trust.tokens = mergeTokenDefaults(merged.trust.tokens, defaultTrustTokens);
        }

        return merged;
      },
    }
  )
);

export async function fetchDexscreenerToken(address) {
  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.pairs && data.pairs.length > 0) {
      return [...data.pairs]
        .filter((pair) => Number.parseFloat(pair.priceUsd) > 0)
        .sort((left, right) => {
          const leftLiquidity = Number.parseFloat(left.liquidity?.usd) || 0;
          const rightLiquidity = Number.parseFloat(right.liquidity?.usd) || 0;
          if (rightLiquidity !== leftLiquidity) return rightLiquidity - leftLiquidity;

          const leftVolume = Number.parseFloat(left.volume?.h24) || 0;
          const rightVolume = Number.parseFloat(right.volume?.h24) || 0;
          if (rightVolume !== leftVolume) return rightVolume - leftVolume;

          const leftMarketCap = Number.parseFloat(left.marketCap || left.fdv) || 0;
          const rightMarketCap = Number.parseFloat(right.marketCap || right.fdv) || 0;
          return rightMarketCap - leftMarketCap;
        })[0] || null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchBasePrices() {
  const entries = Object.entries(TOKEN_PRICE_INDEX);
  const prices = {};

  await Promise.all(
    entries.map(async ([marketKey, tokenIds]) => {
      const market = DEX_MARKETS[marketKey];
      if (!market?.address) return;

      const pair = await fetchDexscreenerToken(market.address);
      if (!pair) return;

      const targetAddress = normalizeAddress(market.address);
      const baseAddress = normalizeAddress(pair.baseToken?.address);
      const quoteAddress = normalizeAddress(pair.quoteToken?.address);
      const basePriceUsd = parseFloat(pair.priceUsd) || 0;
      const basePerQuote = parseFloat(pair.priceNative) || 0;

      let usd = basePriceUsd;
      if (targetAddress && quoteAddress === targetAddress && basePerQuote > 0) {
        usd = basePriceUsd / basePerQuote;
      }

      const quote = {
        usd,
        change: parseFloat(pair.priceChange?.h24) || 0,
        imageUrl:
          (targetAddress && baseAddress === targetAddress ? pair.info?.imageUrl : '') ||
          getFallbackIconUrl(marketKey),
        marketCap: parseFloat(pair.marketCap) || 0,
        fdv: parseFloat(pair.fdv) || 0,
        chainId: pair.chainId || market.network,
      };

      tokenIds.forEach((tokenId) => {
        prices[tokenId] = quote;
      });
    })
  );

  return prices;
}