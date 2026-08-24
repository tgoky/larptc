import React, { useState } from 'react';
import { useWalletStore, fetchDexscreenerToken, getFallbackIconUrl, getNativeMarketKeyForNetwork } from '../../store/useWalletStore';

const QUICK_ASSETS = [
  { symbol: 'TRX', name: 'TRX', id: 'custom-trx', marketKey: 'tron', dexscreenerAddress: 'TNUC9Qb1rRpS5CbWLmNMxXBjyFoydXjWFR', network: 'Tron' },
  { symbol: 'USDT', name: 'USDT', id: 'custom-usdt', marketKey: 'usdtTron', dexscreenerAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', network: 'Tron' },
  { symbol: 'BTC', name: 'Bitcoin', id: 'custom-btc', marketKey: 'bitcoin', dexscreenerAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', network: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', id: 'custom-eth', marketKey: 'ethereum', dexscreenerAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', network: 'Ethereum' },
  { symbol: 'BNB', name: 'BNB', id: 'custom-bnb', marketKey: 'bnb', dexscreenerAddress: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', network: 'BNB Smart Chain' },
  { symbol: 'SOL', name: 'Solana', id: 'custom-sol', marketKey: 'solana', dexscreenerAddress: 'So11111111111111111111111111111111111111112', network: 'Solana' },
];

export default function TrustSpoofModal({
  onClose,
  canInstall = false,
  onInstall = null,
  isStandalone = false,
}) {
  const {
    trust,
    setTrustWalletName,
    addTrustToken,
    updateTrustTokenAmount,
    clearTrustData,
    resetTrust,
  } = useWalletStore();
  const [activeTab, setActiveTab] = useState('Assets');
  const [walletName, setWalletName] = useState(trust.walletName);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetAmount, setAssetAmount] = useState('');
  const [ca, setCa] = useState('');
  const [caAmount, setCaAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSaveSettings = () => {
    setTrustWalletName(walletName.trim() || 'Main Wallet 23');
    onClose();
  };

  const clearAllData = () => {
    clearTrustData();
    onClose();
  };

  const handleResetWallet = () => {
    resetTrust();
    onClose();
  };

  const handleAddQuick = () => {
    if (!selectedAsset) return setError('Select an asset');
    const amt = parseFloat(assetAmount);
    if (Number.isNaN(amt) || amt < 0) return setError('Invalid amount');

    setError('');
    updateTrustTokenAmount(selectedAsset.id, amt);
    onClose();
  };

  const handleAddCA = async () => {
    if (!ca.trim()) return setError('Enter a contract address');
    const amt = parseFloat(caAmount);
    if (Number.isNaN(amt) || amt < 0) return setError('Invalid amount');

    setLoading(true);
    setError('');

    const pair = await fetchDexscreenerToken(ca.trim());
    setLoading(false);

    if (!pair) {
      return setError('Token not found on Dexscreener');
    }

    const price = parseFloat(pair.priceUsd) || 0;
    const change = parseFloat(pair.priceChange?.h24) || 0;
    const tokenId = ca.trim();
    const existing = trust.tokens.find((token) => token.id === tokenId);

    if (existing) {
      updateTrustTokenAmount(tokenId, amt);
    } else {
      addTrustToken({
        id: tokenId,
        name: pair.baseToken.name,
        symbol: pair.baseToken.symbol,
        amount: amt,
        icon: pair.info?.imageUrl || getFallbackIconUrl(getNativeMarketKeyForNetwork(pair.chainId)),
        currentPrice: price,
        priceChange24h: change,
        label: pair.chainId,
        network: pair.chainId,
        networkMarketKey: getNativeMarketKeyForNetwork(pair.chainId),
        dexscreenerAddress: tokenId,
      });
    }
    onClose();
  };

  return (
    <div className="tw-modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="tw-modal-content">
        <div className="tw-modal-header">
          <div className="tw-modal-title">Trust Wallet Setup</div>
          <button className="tw-modal-close" type="button" onClick={onClose}>×</button>
        </div>

        <div className="tw-modal-tabs">
          <button className={`tw-modal-tab ${activeTab === 'Assets' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('Assets')}>Balances</button>
          <button className={`tw-modal-tab ${activeTab === 'By CA' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('By CA')}>By CA</button>
          <button className={`tw-modal-tab ${activeTab === 'Settings' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('Settings')}>Settings</button>
        </div>

        {error ? <div className="tw-error-text">{error}</div> : null}

        {activeTab === 'Assets' ? (
          <div>
            <p className="tw-modal-note">Use the same local balance-edit pattern as Phantom. Holdings start at zero and stay persisted on this device.</p>
            <div className="tw-quick-grid">
              {QUICK_ASSETS.map((asset) => (
                <button
                  key={asset.id}
                  className={`tw-quick-btn ${selectedAsset?.id === asset.id ? 'active' : ''}`}
                  type="button"
                  onClick={() => { setSelectedAsset(asset); setError(''); }}
                >
                  {asset.symbol}
                </button>
              ))}
            </div>
            {selectedAsset ? (
              <div className="tw-form-group">
                <label>Set {selectedAsset.symbol} amount</label>
                <input type="number" step="any" className="tw-input" value={assetAmount} onChange={(event) => setAssetAmount(event.target.value)} placeholder="0.00" />
              </div>
            ) : null}
            <button className="tw-btn-primary" type="button" onClick={handleAddQuick}>Save Amount</button>
          </div>
        ) : null}

        {activeTab === 'By CA' ? (
          <div>
            <p className="tw-modal-note">Add a custom token by contract address and save a local amount while pricing still resolves from Dexscreener.</p>
            <div className="tw-form-group">
              <label>Contract Address</label>
              <input type="text" className="tw-input" value={ca} onChange={(event) => setCa(event.target.value)} placeholder="0x... / T..." />
            </div>
            <div className="tw-form-group">
              <label>Set token amount</label>
              <input type="number" step="any" className="tw-input" value={caAmount} onChange={(event) => setCaAmount(event.target.value)} placeholder="0.00" />
            </div>
            <button className="tw-btn-primary" type="button" onClick={handleAddCA} disabled={loading}>
              {loading ? 'Searching Dexscreener...' : 'Save Custom Token'}
            </button>
          </div>
        ) : null}

        {activeTab === 'Settings' ? (
          <div>
            <div className="tw-form-group">
              <label>Wallet Name</label>
              <input type="text" className="tw-input" value={walletName} onChange={(event) => setWalletName(event.target.value)} placeholder="Main Wallet 23" />
            </div>
            <button className="tw-btn-primary" type="button" onClick={handleSaveSettings}>Save Settings</button>
            {canInstall ? <button className="tw-btn-secondary" type="button" onClick={onInstall}>Install App</button> : null}
            {isStandalone ? <p className="tw-modal-note">App is already running in standalone mode.</p> : null}
            <div className="tw-settings-block">
              <div className="tw-form-group"><label>Clear Mode</label></div>
              <p className="tw-modal-note">Reset all current token holdings to zero while keeping the default Trust token set.</p>
              <button className="tw-btn-danger" type="button" onClick={clearAllData}>Clear All Balances</button>
            </div>
            <button className="tw-btn-secondary tw-btn-secondary-danger" type="button" onClick={handleResetWallet}>Reset Wallet Defaults</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
