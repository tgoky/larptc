import {
  ArrowRight,
  Check,
  KeyRound,
  Send,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { TOOL_CATALOG, TOOL_CATEGORIES } from '../data/tools';
import './LandingPage.css';

const TELEGRAM_BOT_URL = 'https://t.me/LarpAccessBot';

const plans = [
  ['Weekly', '$50', '7 days', 'One shoot, one launch, one nasty little screenshot run.'],
  ['Monthly', '$150', '30 days', 'For creators feeding the timeline with fresh larp material.'],
  ['Lifetime', '$500', 'one time', 'Lock in the full toolkit before the dashboard stack gets ridiculous.'],
];

const faqs = [
  ['Is this connected to a real wallet?', 'No. It is visual-only. No logins, no seed phrases, no private keys, no real transactions.'],
  ['Can I set any balance I want?', 'Yes. Set the number, tokens, labels, and activity around the scene you want to post.'],
  ['Does it open like a real app?', 'The live wallet tools can be added to your home screen so they launch full-screen instead of looking like a browser tab.'],
  ['What is live right now?', 'Phantom and Trust Wallet are live first. Creator, commerce, and payment dashboards are next.'],
  ['When does access start?', 'Your timer starts when the activation code is issued in Telegram, not when you redeem it.'],
  ['What is this actually for?', 'Content, parody, visual concepts, mockups, and fictional scenes. Do not use it as proof of funds.'],
];

function ToolLogo({ tool }) {
  return (
    <span className="lt-tool-logo" style={{ '--tool-color': tool.accent }}>
      <img src={tool.logoSrc} alt="" />
    </span>
  );
}

function PreviewWallet({ type }) {
  const phantom = type === 'phantom';
  const tool = TOOL_CATALOG.find((entry) => entry.id === type);

  return (
    <article className={`lt-preview-wallet ${phantom ? 'is-phantom' : 'is-trust'}`}>
      <header>
        <ToolLogo tool={tool} />
        <span>{phantom ? 'Phantom' : 'Trust Wallet'}</span>
        <i />
      </header>
      <small>{phantom ? 'Portfolio value' : 'Wallet value'}</small>
      <strong>{phantom ? '$984,120.55' : '$248,640.19'}</strong>
      <em>{phantom ? 'The comeback chart looks crazy' : 'Quiet money, loud screenshot'}</em>
      <div className="lt-preview-assets">
        <span><b>{phantom ? 'SOL' : 'USDT'}</b><i>{phantom ? '$214,205.12' : '$88,000.00'}</i></span>
        <span><b>{phantom ? 'BTC' : 'TRX'}</b><i>{phantom ? '$542,910.44' : '$9,920.30'}</i></span>
      </div>
    </article>
  );
}

function ToolShelf({ category }) {
  const tools = TOOL_CATALOG.filter((tool) => tool.category === category);

  return (
    <section className="lt-shelf" key={category}>
      <div className="lt-shelf-head">
        <span>{category}</span>
      </div>
      <div className="lt-shelf-grid">
        {tools.map((tool) => (
          <article className={`lt-shelf-card ${tool.status === 'Live' ? 'is-live' : 'is-building'}`} key={tool.id}>
            <div className="lt-shelf-top">
              <ToolLogo tool={tool} />
              <b>{tool.status}</b>
            </div>
            <strong>{tool.productName}</strong>
            <p>{tool.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <main className="lt-page">
      <nav className="lt-nav">
        <Link className="lt-brand" to="/">
          <img src="/jester.png" alt="" />
          <span>Larp Tools</span>
        </Link>
        <div className="lt-nav-links">
          <a href="#live">Live tools</a>
          <a href="#access">Access</a>
          <a href="#faq">FAQ</a>
          <Link to="/enter">Enter code</Link>
          <a className="lt-nav-cta" href={TELEGRAM_BOT_URL}>Open Telegram <Send size={14} /></a>
        </div>
      </nav>

      <section className="lt-hero">
        <div className="lt-hero-copy">
          <div className="lt-kicker"><Sparkles size={14} /> OGU-grade wallet screens for internet characters</div>
          <h1>Fake it till you make it.</h1>
          <p className="lt-subhead">Go band for band. Larp your trading arc. Impress the group chat.</p>
          <p className="lt-description">
            Larp Tools gives you ultra-clean wallet and dashboard screens that open like the real apps,
            hold any number you want, and make the screenshot hit harder.
          </p>
          <div className="lt-hero-actions">
            <a className="lt-button lt-button-primary" href={TELEGRAM_BOT_URL}>
              Buy access <ArrowRight size={17} />
            </a>
            <Link className="lt-button lt-button-secondary" to="/enter">
              Enter code <KeyRound size={16} />
            </Link>
            <Link className="lt-button lt-button-secondary" to="/app/phantom">
    Launch Phantom <ArrowRight size={17} />
  </Link>
  <Link className="lt-button lt-button-secondary" to="/app/trust">
    Launch Phantom <ArrowRight size={17} />
  </Link>

          </div>
          <div className="lt-proof-row">
            <span><b>$1M</b> on screen before breakfast</span>
            <span><b>App</b> mode with no browser chrome</span>
            <span><b>Live</b> Phantom and Trust today</span>
          </div>
          <p className="lt-disclaimer">Visual-only for content, parody, concepts, and mockups. No real funds or account connections.</p>
        </div>

        <div className="lt-hero-visual" aria-hidden="true">
          <div className="lt-market-tape">
            <span>Top larp culture</span>
            <span>Band for band mode</span>
            <span>Trading arc simulator</span>
          </div>
          <div className="lt-stat-card">
            <small>Scene value</small>
            <strong>$1.24M</strong>
            <em>Set the number, post the arc</em>
          </div>
          <PreviewWallet type="phantom" />
          <PreviewWallet type="trust" />
        </div>
      </section>

      <section className="lt-value-strip">
        <article>
          <span>01</span>
          <strong>Opens like the real thing</strong>
          <p>Add it to your home screen and launch straight into the wallet view.</p>
        </article>
        <article>
          <span>02</span>
          <strong>Any balance, any story</strong>
          <p>Build the trading comeback, creator payday, or sudden millionaire phase.</p>
        </article>
        <article>
          <span>03</span>
          <strong>Clean enough for camera</strong>
          <p>Designed for screenshots, clips, skits, concepts, and visual flexing.</p>
        </article>
      </section>

      <section className="lt-live" id="live">
        <header className="lt-section-head">
          <span>Live tools</span>
          <h2>The wallet stack comes first.</h2>
          <p>Two realistic mobile wallet builds are live now. The rest of the library follows after the first pair is nailed.</p>
        </header>
        <div className="lt-shelf-stack">
          {TOOL_CATEGORIES.map((category) => (
            <ToolShelf category={category} key={category} />
          ))}
        </div>
      </section>

      <section className="lt-plans" id="access">
        <header className="lt-section-head">
          <span>Access</span>
          <h2>Choose your pass and start tonight.</h2>
          <p>Buy through Telegram, get your activation code, and start posting richer-looking scenes the same night.</p>
        </header>
        <div className="lt-plan-grid">
          {plans.map(([name, price, period, copy], index) => (
            <article className={`lt-plan-card ${index === 1 ? 'is-featured' : ''}`} key={name}>
              <span>{name}</span>
              <strong>{price}</strong>
              <b>{period}</b>
              <p>{copy}</p>
              <a href={TELEGRAM_BOT_URL}>Choose plan <ArrowRight size={16} /></a>
            </article>
          ))}
        </div>
      </section>

      <section className="lt-faq" id="faq">
        <header className="lt-section-head">
          <span>FAQ</span>
          <h2>Before you start larping.</h2>
          <p>Quick answers for the people trying to make the screenshot hit without connecting anything real.</p>
        </header>
        <div className="lt-faq-grid">
          {faqs.map(([question, answer]) => (
            <article key={question}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lt-bottom-cta">
        <div>
          <span>Ready when the character is.</span>
          <h2>Post the richer version of yourself.</h2>
        </div>
        <div className="lt-bottom-points">
          <span><Check size={15} /> Realistic wallet UI</span>
          <span><Check size={15} /> Full-screen app launch</span>
          <span><Check size={15} /> More larp surfaces coming</span>
        </div>
        <a className="lt-button lt-button-primary" href={TELEGRAM_BOT_URL}>Open Telegram <Send size={16} /></a>
      </section>

      <footer className="lt-footer">
        <div className="lt-brand"><img src="/jester.png" alt="" /><span>Larp Tools</span></div>
        <p>Visual-only dashboard tools for content, parody, concepts, and mockups.</p>
        <div><a href={TELEGRAM_BOT_URL}>Telegram</a><Link to="/terms">Terms</Link></div>
      </footer>
    </main>
  );
}
