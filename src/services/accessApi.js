const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const SESSION_STORAGE_KEY = 'larp-tools-session';
const DEVICE_SECRET_KEY = 'larp-tools-device-secret';

export function getStoredSessionToken() {
  return window.localStorage.getItem(SESSION_STORAGE_KEY) || '';
}

export function storeSessionToken(token) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, token);
}

export function clearSessionToken() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function logoutAccessSession() {
  const token = getStoredSessionToken();
  if (token) {
    await fetch(`${API_BASE_URL}/api/access/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(await getDeviceHeaders()),
      },
    }).catch(() => {});
  }
  clearSessionToken();
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Unable to reach the access service.');
  }
  return data;
}

export async function redeemAccessCode(code) {
  const response = await fetch(`${API_BASE_URL}/api/access/redeem`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await getDeviceHeaders()),
    },
    body: JSON.stringify({ code }),
  });
  return parseResponse(response);
}

export async function validateAccessSession(token = getStoredSessionToken()) {
  if (!token) return { active: false };

  const response = await fetch(`${API_BASE_URL}/api/access/session`, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(await getDeviceHeaders()),
    },
  });

  if (response.status === 401) {
    clearSessionToken();
    return { active: false };
  }

  return parseResponse(response);
}

export async function createInstallHandoff(toolId) {
  const token = getStoredSessionToken();
  const response = await fetch(`${API_BASE_URL}/api/access/install-handoff`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(await getDeviceHeaders()),
    },
    body: JSON.stringify({ toolId }),
  });
  return parseResponse(response);
}

export async function consumeInstallHandoff(pairingCode, toolId) {
  const response = await fetch(`${API_BASE_URL}/api/access/install-handoff/consume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await getDeviceHeaders()),
    },
    body: JSON.stringify({ pairingCode, toolId }),
  });
  return parseResponse(response);
}

async function getDeviceHeaders() {
  const deviceSecret = getOrCreateDeviceSecret();
  const fingerprint = await getBrowserFingerprint();
  return {
    'X-Device-Secret': deviceSecret,
    'X-Device-Fingerprint': fingerprint,
    'X-Device-Label': getDeviceLabel(),
  };
}

function getOrCreateDeviceSecret() {
  const existing = window.localStorage.getItem(DEVICE_SECRET_KEY);
  if (existing) return existing;

  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  const secret = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  window.localStorage.setItem(DEVICE_SECRET_KEY, secret);
  return secret;
}

async function getBrowserFingerprint() {
  const source = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    String(navigator.hardwareConcurrency || ''),
    String(navigator.maxTouchPoints || ''),
  ].join('|');
  const digest = await window.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(source)
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function getDeviceLabel() {
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  return `${mobile ? 'Mobile' : 'Desktop'} browser`;
}
