import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  document.body.innerHTML = '<div style="padding:2rem;font-family:sans-serif;">#root 요소를 찾을 수 없습니다.</div>';
} else {
  try {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    rootEl.innerHTML = `<div style="padding:2rem;font-family:sans-serif;max-width:32rem;">
      <p><strong>앱을 불러오지 못했습니다.</strong></p>
      <p style="color:#666;font-size:0.875rem;">${err instanceof Error ? err.message : String(err)}</p>
      <p style="margin-top:1rem;"><a href="/">새로고침</a></p>
    </div>`;
    console.error('App mount error:', err);
  }
}
