import React, { useState } from 'react';
import { useWalletStore, fetchDexscreenerToken, getFallbackIconUrl, getNativeMarketKeyForNetwork } from '../../store/useWalletStore';
import './PhantomWallet.css';

/* Quick-pick assets matching Phantom's defaults */
const QUICK_ASSETS = [
  { id: 'solana',          symbol: 'SOL' },
  { id: 'ethereum',        symbol: 'ETH' },
  // { id: 'bitcoin-taproot', symbol: 'BTC (Taproot)' },
  // { id: 'bitcoin-segwit',  symbol: 'BTC (Segwit)' },
  // { id: 'monad',           symbol: 'MON' },
  // { id: 'sui',             symbol: 'SUI' },
  // { id: 'polygon',         symbol: 'POL' },
  // { id: 'hype',            symbol: 'HYPE' },
  { id: 'usdc',     symbol: 'USDC' },
];

export default function PhantomSpoofModal({ onClose }) {
  const {
    phantom,
    addPhantomToken,
    resetPhantom,
    updatePhantomTokenAmount,
    setPhantomUsername,
    setPhantomAccountNumber,
  } = useWalletStore();

  const [tab, setTab] = useState('position'); // 'position' | 'ca' | 'settings'
  const [selectedId, setSelectedId] = useState(null);
  const [amount, setAmount] = useState('');
  const [ca, setCa] = useState('');
  const [username, setUsername] = useState(phantom.username);
  const [accountNum, setAccountNum] = useState(String(phantom.accountNumber));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ---- Add from quick-pick ---- */
  const handleQuickAdd = () => {
    if (!selectedId) { setError('Select an asset.'); return; }
    const num = parseFloat(amount);
    if (!num || num <= 0) { setError('Enter a valid amount.'); return; }
    setError('');
    updatePhantomTokenAmount(selectedId, num);
    onClose();
  };

  /* ---- Add from contract address ---- */
  const handleCAAdd = async () => {
    if (!ca.trim()) { setError('Paste a contract address.'); return; }
    const num = parseFloat(amount);
    if (!num || num <= 0) { setError('Enter a valid amount.'); return; }
    setError('');
    setLoading(true);

    const pair = await fetchDexscreenerToken(ca.trim());
    if (!pair) { setError('Not found on Dexscreener. Check the CA.'); setLoading(false); return; }

    const price = parseFloat(pair.priceUsd) || 0;
    const change = parseFloat(pair.priceChange?.h24) || 0;

    // Check if we already have it
    const existing = phantom.tokens.find((t) => t.id === pair.baseToken.address);
    if (existing) {
      updatePhantomTokenAmount(existing.id, num);
    } else {
      addPhantomToken({
        id: pair.baseToken.address,
        name: pair.baseToken.name,
        symbol: pair.baseToken.symbol,
        verified: false,
        amount: num,
        icon: pair.info?.imageUrl || getFallbackIconUrl(getNativeMarketKeyForNetwork(pair.chainId)),
        currentPrice: price,
        priceChange24h: change,
        marketCap: parseFloat(pair.marketCap) || parseFloat(pair.fdv) || 0,
        fdv: parseFloat(pair.fdv) || 0,
        chainId: pair.chainId || '',
        network: pair.chainId || '',
        networkMarketKey: getNativeMarketKeyForNetwork(pair.chainId),
        dexscreenerAddress: pair.baseToken.address,
      });
    }
    setLoading(false);
    onClose();
  };

  /* ---- Save settings ---- */
  const handleSaveSettings = () => {
    const trimmed = username.trim();
    if (trimmed) setPhantomUsername(trimmed.startsWith('@') ? trimmed : `@${trimmed}`);
    const num = parseInt(accountNum);
    if (!isNaN(num) && num > 0) setPhantomAccountNumber(num);
    onClose();
  };

  const handleResetWallet = () => {
    resetPhantom();
    onClose();
  };

  return (
    <div className="ph-modal-overlay" onClick={onClose}>
      <div className="ph-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ph-modal-handle" />
        <h3>Wallet Settings</h3>

        {/* Tabs */}
        <div className="ph-modal-tabs">
          <button className={`ph-tab-btn ${tab === 'position' ? 'active' : ''}`} onClick={() => { setTab('position'); setError(''); }}>
            Add Position
          </button>
          <button className={`ph-tab-btn ${tab === 'ca' ? 'active' : ''}`} onClick={() => { setTab('ca'); setError(''); }}>
            By CA
          </button>
          <button className={`ph-tab-btn ${tab === 'settings' ? 'active' : ''}`} onClick={() => { setTab('settings'); setError(''); }}>
            Settings
          </button>
        </div>

        {/* ======== POSITION TAB ======== */}
        {tab === 'position' && (
          <>
            <div className="ph-modal-section">
              <label>Select Asset</label>
              <div className="ph-quick-picks">
                {QUICK_ASSETS.map((a) => (
                  <button
                    key={a.id}
                    className={`ph-pick-btn ${selectedId === a.id ? 'selected' : ''}`}
                    onClick={() => { setSelectedId(a.id); setError(''); }}
                  >
                    {a.symbol}
                  </button>
                ))}
              </div>
            </div>
            <div className="ph-modal-section">
              <label>Amount</label>
              <input
                className="ph-modal-input"
                type="number"
                step="any"
                placeholder="e.g. 1.5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            {error && <div className="ph-modal-error">{error}</div>}
            <button className="ph-modal-submit" onClick={handleQuickAdd}>Add Position</button>
          </>
        )}

        {/* ======== CA TAB ======== */}
        {tab === 'ca' && (
          <>
            <div className="ph-modal-section">
              <label>Contract Address</label>
              <input
                className="ph-modal-input"
                type="text"
                placeholder="Paste token CA..."
                value={ca}
                onChange={(e) => setCa(e.target.value)}
              />
            </div>
            <div className="ph-modal-section">
              <label>Amount</label>
              <input
                className="ph-modal-input"
                type="number"
                step="any"
                placeholder="e.g. 100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            {error && <div className="ph-modal-error">{error}</div>}
            <button className="ph-modal-submit" disabled={loading} onClick={handleCAAdd}>
              {loading ? 'Fetching...' : 'Add Asset'}
            </button>
          </>
        )}

        {/* ======== SETTINGS TAB ======== */}
        {tab === 'settings' && (
          <>
            <div className="ph-modal-section">
              <label>Username</label>
              <input
                className="ph-modal-input"
                type="text"
                placeholder="@username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="ph-modal-section">
              <label>Account Number</label>
              <input
                className="ph-modal-input"
                type="number"
                placeholder="45"
                value={accountNum}
                onChange={(e) => setAccountNum(e.target.value)}
              />
            </div>
            <button className="ph-modal-submit" onClick={handleSaveSettings}>Save Settings</button>
            <button className="ph-modal-cancel" onClick={handleResetWallet}>Reset Wallet</button>
          </>
        )}

        <button className="ph-modal-cancel" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
