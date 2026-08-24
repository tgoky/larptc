import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_APP = {
  title: 'Larp Tools',
  manifest: '/manifest.webmanifest',
  icon: '/jester.png',
  themeColor: '#0a0a0a',
  statusBarStyle: 'black-translucent',
  bodyClass: '',
};

const TOOL_APPS = {
  phantom: {
    title: 'Phantom',
    manifest: '/manifests/phantom.webmanifest',
    icon: '/tool-icons/phantom.png',
    themeColor: '#181818',
    statusBarStyle: 'black-translucent',
    bodyClass: 'app-shell-phantom',
  },
  trust: {
    title: 'Trust Wallet',
    manifest: '/manifests/trust.webmanifest',
    icon: '/tool-icons/trust.png',
    themeColor: '#ffffff',
    statusBarStyle: 'default',
    bodyClass: 'app-shell-trust',
  },
};

function getApp(pathname) {
  if (pathname.startsWith('/wallet/1') || pathname.startsWith('/app/phantom') || pathname === '/installed/phantom') return TOOL_APPS.phantom;
  if (pathname.startsWith('/wallet/2') || pathname.startsWith('/app/trust') || pathname === '/installed/trust') return TOOL_APPS.trust;
  return DEFAULT_APP;
}

export default function PwaManifestManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const app = getApp(pathname);
    document.title = app.title;
    updateLink('manifest', app.manifest);
    updateLink('apple-touch-icon', app.icon);
    updateMeta('theme-color', app.themeColor);
    updateMeta('apple-mobile-web-app-title', app.title);
    updateMeta('apple-mobile-web-app-status-bar-style', app.statusBarStyle);
    document.body.classList.remove('app-shell-phantom', 'app-shell-trust');
    if (app.bodyClass) {
      document.body.classList.add(app.bodyClass);
    }
  }, [pathname]);

  return null;
}

function updateLink(rel, href) {
  let link = document.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
}

function updateMeta(name, content) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}
