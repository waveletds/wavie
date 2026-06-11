import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Dynamic API fetch proxy routing for external hostnames (e.g. Vercel custom domains)
const originalFetch = window.fetch;

function customFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let urlString = '';
  if (typeof input === 'string') {
    urlString = input;
  } else if (input instanceof URL) {
    urlString = input.href;
  } else {
    urlString = input.url;
  }
  
  if (urlString.startsWith('/api/')) {
    const isLocalOrRunApp = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1' || 
                            window.location.hostname.endsWith('.run.app');
    if (!isLocalOrRunApp) {
      const BACKEND_URL = 'https://ais-dev-u5d5onrifboqsn4sy7bhcx-822881957035.europe-west2.run.app';
      urlString = BACKEND_URL + urlString;
    }
  }
  
  if (typeof input === 'string') {
    return originalFetch(urlString, init);
  } else if (input instanceof URL) {
    return originalFetch(new URL(urlString), init);
  } else {
    const newRequest = new Request(urlString, input as Request);
    return originalFetch(newRequest, init);
  }
}

try {
  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    configurable: true,
    writable: true,
    enumerable: true
  });
} catch (e) {
  console.warn('Unable to override window.fetch with Object.defineProperty, trying globalThis fallback:', e);
  try {
    (globalThis as any).fetch = customFetch;
  } catch (err) {
    console.error('Failed all attempts to proxy window.fetch. External custom domains may require absolute path routing.', err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
