import { lazy, Suspense, useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Navigate, Route, Routes, Link, useNavigate, useParams } from 'react-router-dom';
import PwaManifestManager from './components/PwaManifestManager';
import { findTool, TOOL_CATALOG, TOOL_CATEGORIES } from './data/tools';
import LandingPage from './landing/LandingPage';
import {
  clearSessionToken,
  consumeInstallHandoff,
  createInstallHandoff,
  getStoredSessionToken,
  logoutAccessSession,
  redeemAccessCode,
  storeSessionToken,
  validateAccessSession,
} from './services/accessApi';

const PhantomWallet = lazy(() => import('./wallets/phantom/PhantomWallet'));
const TrustWallet = lazy(() => import('./wallets/trust/TrustWallet'));
const TELEGRAM_BOT_URL = 'https://t.me/LarpAccessBot';
const STANDALONE_PREVIEW_KEY = 'larp-tools-standalone-preview';
const OPEN_PREVIEW_MODE = import.meta.env.VITE_OPEN_PREVIEW_MODE !== 'false';

function isStandaloneApp() {
  const params = new URLSearchParams(window.location.search);
  const previewValue = params.get('standalonePreview');

  if (previewValue === '1') {
    window.sessionStorage.setItem(STANDALONE_PREVIEW_KEY, '1');
  } else if (previewValue === '0') {
    window.sessionStorage.removeItem(STANDALONE_PREVIEW_KEY);
  }

  return window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    window.sessionStorage.getItem(STANDALONE_PREVIEW_KEY) === '1';
}

function ToolLogo({ tool }) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div className="tool-logo" style={{ '--tool-accent': tool.accent }}>
      {tool.logoSrc && !logoFailed ? (
        <img src={tool.logoSrc} alt="" onError={() => setLogoFailed(true)} />
      ) : (
        <span>{tool.initials}</span>
      )}
    </div>
  );
}

function ToolCard({ tool }) {
  const isUnlocked = Boolean(tool.href);
  return (
    <article className={isUnlocked ? 'wallet-card tool-card tool-card-live' : 'wallet-card tool-card tool-card-locked'}>
      <div className="tool-card-topline">
        <ToolLogo tool={tool} />
        <span className={isUnlocked ? 'tool-status tool-status-live' : 'tool-status tool-status-locked'}>
          {tool.status}
        </span>
      </div>
      <div className="tool-card-copy">
        <div className="tool-name">{tool.name}</div>
        <h2>{tool.productName}</h2>
        <p>{tool.description}</p>
      </div>
      <div className="tool-card-actions">
        {isUnlocked ? (
          <Link to={tool.installHref}>Install app <Download size={15} /></Link>
        ) : (
          <span>In production</span>
        )}
      </div>
    </article>
  );
}

function formatExpiry(access) {
  if (access?.preview) return 'Preview mode';
  if (access?.lifetime) return 'Lifetime access';
  if (!access?.expiresAt) return 'Active subscription';
  return `Access until ${new Date(access.expiresAt).toLocaleDateString()}`;
}

function WalletSplash({ toolId }) {
  const tool = findTool(toolId);

  return (
    <main className="wallet-splash" style={{ '--splash-color': tool?.accent || '#111827' }}>
      <div className="wallet-splash-mark">
        {tool?.logoSrc ? <img src={tool.logoSrc} alt="" /> : <span>{tool?.initials || 'L'}</span>}
      </div>
    </main>
  );
}

function ToolsDashboard({ access, onLogout }) {
  return (
    <div className="dashboard-container tools-dashboard">
      <Link className="dashboard-back-link" to="/">&larr; Larp Tools</Link>
      <h1>Tools Console</h1>
      <p>Install each live simulator as its own home-screen app. Draft tools stay visible here so the library roadmap is clear.</p>
      <div className="dashboard-access-row">
        <span>{access?.planName || 'Subscriber access'} - {formatExpiry(access)}</span>
        {access?.preview ? <span>Public UI preview is on</span> : <button type="button" onClick={onLogout}>Sign out</button>}
      </div>
      {TOOL_CATEGORIES.map((category) => (
        <section className="dashboard-tool-group" key={category}>
          <h2>{category}</h2>
          <div className="wallet-grid">
            {TOOL_CATALOG.filter((tool) => tool.category === category).map((tool) => (
              <ToolCard key={tool.productName} tool={tool} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function InstallPage() {
  const { toolId } = useParams();
  const tool = findTool(toolId);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState('');
  const desktopPreviewHref = tool?.id ? `/app/${tool.id}` : '/tools';

  if (!tool?.href) return <Navigate to="/tools" replace />;

  async function prepareInstall() {
    setPreparing(true);
    setError('');
    try {
      if (OPEN_PREVIEW_MODE) {
        window.location.assign(`/apps/${tool.id}/install.html?preview=1&target=${encodeURIComponent(`/app/${tool.id}`)}`);
        return;
      }
      const result = await createInstallHandoff(tool.id);
      window.location.assign(`/apps/${tool.id}/install.html?pair=${encodeURIComponent(result.pairingCode)}`);
    } catch (prepareError) {
      setError(prepareError.message);
      setPreparing(false);
    }
  }

  return (
    <main className="install-page">
      <Link className="dashboard-back-link" to="/tools">&larr; Tools console</Link>
      <div className="install-app-icon"><ToolLogo tool={tool} /></div>
      <span className="enter-kicker">Home screen app</span>
      <h1>Install {tool.name}</h1>
      <p>
        Add a dedicated {tool.name} icon to your home screen. It opens directly into the
        simulator without the normal browser frame.
      </p>
      <div className="install-instructions">
        <div><strong>1. Prepare the app</strong><span>Create a secure 10-minute transfer for this device.</span></div>
        <div><strong>2. Add it to your home screen</strong><span>The next screen contains the exact shortcut to install.</span></div>
      </div>
      <div className="install-preview-note">
        <strong>Laptop preview</strong>
        <span>Use desktop preview mode to inspect the standalone app UI without doing the full iPhone install loop.</span>
        <Link to={desktopPreviewHref}>Open desktop app preview</Link>
      </div>
      {error ? <div className="enter-error">{error}</div> : null}
      <button className="install-open-button" type="button" onClick={prepareInstall} disabled={preparing}>
        {preparing ? 'Preparing...' : `Prepare ${tool.name}`}
      </button>
    </main>
  );
}

function InstalledAppPage() {
  const { toolId } = useParams();
  const tool = findTool(toolId);
  const navigate = useNavigate();
  const [pairingCode, setPairingCode] = useState('');
  const [status, setStatus] = useState('ready');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tool?.href) return;
    if (OPEN_PREVIEW_MODE) {
      navigate(`${tool.href}?standalonePreview=1`, { replace: true });
      return;
    }
    if (getStoredSessionToken()) {
      navigate(tool.href, { replace: true });
    }
  }, [navigate, tool]);

  async function connectInstalledApp(event) {
    event.preventDefault();
    if (!pairingCode.trim()) {
      setError('Enter the pairing code shown during installation.');
      return;
    }
    setStatus('connecting');
    setError('');
    try {
      const result = await consumeInstallHandoff(pairingCode, tool.id);
      storeSessionToken(result.sessionToken);
      navigate(tool.href, { replace: true });
    } catch (handoffError) {
      setError(handoffError.message);
      setStatus('ready');
    }
  }

  if (!tool?.href) return <Navigate to="/" replace />;

  return (
    <main className="install-page install-ready-page">
      <form className="installed-pairing-form" onSubmit={connectInstalledApp}>
        <div className="install-app-icon"><ToolLogo tool={tool} /></div>
        <span className="enter-kicker">First launch</span>
        <h1>Connect {tool.name}</h1>
        <p>Enter the 10-character pairing code shown on the Safari installation screen.</p>
        <label htmlFor="pairing-code">Pairing code</label>
        <input
          id="pairing-code"
          value={pairingCode}
          onChange={(event) => {
            setPairingCode(event.target.value.toUpperCase());
            setError('');
          }}
          maxLength={10}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck="false"
        />
        {error ? <div className="enter-error">{error}</div> : null}
        <button className="install-open-button" type="submit" disabled={status === 'connecting'}>
          {status === 'connecting' ? 'Connecting...' : `Open ${tool.name}`}
        </button>
      </form>
    </main>
  );
}

function EnterPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) {
      setError('Enter your Telegram activation code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const access = await redeemAccessCode(normalizedCode);
      storeSessionToken(access.sessionToken);
      navigate('/tools', { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="enter-page">
      <div className="enter-glow" />
      <Link className="enter-brand" to="/">Larp Tools</Link>
      <form className="enter-card" onSubmit={handleSubmit}>
        <div className="enter-kicker">Private access</div>
        <h1>Enter activation code</h1>
        <p>Enter the code issued through Telegram to unlock the tools console on this device.</p>
        <label htmlFor="activation-code">Activation code</label>
        <input
          id="activation-code"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setError('');
          }}
          placeholder="LARP-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
          autoComplete="one-time-code"
        />
        {error ? <div className="enter-error">{error}</div> : null}
        <button type="submit" disabled={loading}>{loading ? 'Checking...' : 'Enter Now'}</button>
        <a className="enter-buy-link" href={TELEGRAM_BOT_URL}>Need access? Open Telegram</a>
      </form>
    </main>
  );
}

function AccessGuard({ children, loadingFallback = <main className="access-loading">Checking access...</main> }) {
  const [status, setStatus] = useState('loading');
  const [access, setAccess] = useState(null);

  useEffect(() => {
    if (OPEN_PREVIEW_MODE) {
      setAccess({ active: true, preview: true, planName: 'Open preview', lifetime: true });
      setStatus('active');
      return undefined;
    }

    let cancelled = false;

    validateAccessSession()
      .then((result) => {
        if (cancelled) return;
        setAccess(result);
        setStatus(result.active ? 'active' : 'inactive');
      })
      .catch(() => {
        if (cancelled) return;
        clearSessionToken();
        setStatus('inactive');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading') {
    return loadingFallback;
  }

  if (status !== 'active' || (!OPEN_PREVIEW_MODE && !getStoredSessionToken())) {
    return <Navigate to="/enter" replace />;
  }

  return children(access);
}

function InstalledOnlyGuard({ toolId, children }) {
  if (!OPEN_PREVIEW_MODE && !isStandaloneApp()) {
    return <Navigate to={`/install/${toolId}`} replace />;
  }

  return children;
}

function Wallet3() {
  return <div style={{ background: '#fff', height: '100vh' }}>Ledger Portfolio Simulator Appears Here</div>;
}

function Wallet4() {
  return <div style={{ background: '#fff', height: '100vh' }}>Custom Balance Builder Appears Here</div>;
}

function WalletAppRoute({ toolId, children }) {
  return (
    <AccessGuard loadingFallback={<WalletSplash toolId={toolId} />}>
      {() => <Suspense fallback={<WalletSplash toolId={toolId} />}>{children}</Suspense>}
    </AccessGuard>
  );
}

function TermsPage() {
  return (
    <main className="enter-page terms-page">
      <Link className="enter-brand" to="/">Larp Tools</Link>
      <article className="enter-card">
        <div className="enter-kicker">Terms</div>
        <h1>Simulation only</h1>
        <p>Larp Tools creates UI-only simulations for training, demo, onboarding and testing environments.</p>
        <p>Do not use simulated balances to misrepresent ownership, income, funds, payments or transactions.</p>
        <Link className="enter-buy-link" to="/">Return home</Link>
      </article>
    </main>
  );
}

function App() {
  return (
    <>
      <PwaManifestManager />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/enter" element={<EnterPage />} />
        <Route
          path="/tools"
          element={(
            <AccessGuard>
              {(access) => (
                <ToolsDashboard
                  access={access}
                  onLogout={async () => {
                    await logoutAccessSession();
                    window.location.assign('/enter');
                  }}
                />
              )}
            </AccessGuard>
          )}
        />
        <Route path="/install/:toolId" element={<AccessGuard>{() => <InstallPage />}</AccessGuard>} />
        <Route path="/installed/:toolId" element={<InstalledAppPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/app/phantom/*" element={<WalletAppRoute toolId="phantom"><PhantomWallet /></WalletAppRoute>} />
        <Route path="/app/trust/*" element={<WalletAppRoute toolId="trust"><TrustWallet /></WalletAppRoute>} />
        <Route path="/wallet/1/*" element={<InstalledOnlyGuard toolId="phantom"><WalletAppRoute toolId="phantom"><PhantomWallet /></WalletAppRoute></InstalledOnlyGuard>} />
        <Route path="/wallet/2/*" element={<InstalledOnlyGuard toolId="trust"><WalletAppRoute toolId="trust"><TrustWallet /></WalletAppRoute></InstalledOnlyGuard>} />
        <Route path="/wallet/3/*" element={<AccessGuard>{() => <Wallet3 />}</AccessGuard>} />
        <Route path="/wallet/4/*" element={<AccessGuard>{() => <Wallet4 />}</AccessGuard>} />
      </Routes>
    </>
  );
}

export default App;
