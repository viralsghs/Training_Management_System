// ═══════════════════════════════════════════════════════════════
//  Marengo Asia Hospitals — Training System
//  config.js  ·  loaded first on EVERY page
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  // ─── Replace with your Google Apps Script Web App URL ───────
  // Leave as-is to run in Demo Mode (no backend required)
  API_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'',

  APP_NAME:      'Training System',
  HOSPITAL_NAME: 'Marengo Asia Hospitals',
  TAGLINE:       'Humane by Practice',
  VERSION:       '2.0.0',
};

// Is real API connected?
CONFIG.isDemo = CONFIG.API_URL.includes('https://script.google.com/macros/s/AKfycbxdvWqe5qTvRS_9_TolrpozlyN5hTuMn8i6ZBaDpa0waOM7Wv_aaflb6DSTa5wYdL7s/exec');

// ─── Logo path helper (works from any subfolder) ───────────────
CONFIG.logoPath = (function () {
  const p = window.location.pathname;
  // If we're inside /pages/ subfolder, go up one level
  return p.includes('/pages/') ? '../assets/logo.jpg' : 'assets/logo.jpg';
})();

// ═══════════════════════════════════════════════════════════════
//  PATH HELPER  — works on localhost, GitHub Pages, any subpath
// ═══════════════════════════════════════════════════════════════
const Paths = {
  _inPages() {
    return window.location.pathname.includes('/pages/');
  },
  root()        { return this._inPages() ? '../'              : './'; },
  toLogin()     { window.location.replace(this.root() + 'index.html'); },
  toDashboard() { window.location.href = this.root() + 'pages/dashboard.html'; },
};

// ═══════════════════════════════════════════════════════════════
//  SESSION  (sessionStorage — same origin, survives navigation)
// ═══════════════════════════════════════════════════════════════
const Session = {
  KEY: 'mah_training_user',

  get() {
    try {
      const s = sessionStorage.getItem(this.KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  },

  set(user) {
    try { sessionStorage.setItem(this.KEY, JSON.stringify(user)); } catch (e) {
      console.error('Session.set failed:', e);
    }
  },

  clear() {
    try { sessionStorage.removeItem(this.KEY); } catch {}
  },

  // Call at top of every dashboard page.
  // Returns user object or null (and redirects to login).
  require(allowedRoles = []) {
    const user = this.get();
    if (!user) {
      console.warn('[Session] No user found — redirecting to login');
      Paths.toLogin();
      return null;
    }
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      console.warn('[Session] Role not allowed:', user.role);
      Paths.toLogin();
      return null;
    }
    return user;
  },
};

// ═══════════════════════════════════════════════════════════════
//  API  — Google Apps Script compatible (JSONP to avoid CORS)
//  Google Apps Script redirects fetch() calls which breaks CORS.
//  JSONP uses a <script> tag which is not subject to CORS rules.
// ═══════════════════════════════════════════════════════════════
const API = {
  _cbId: 0,

  call(action, data = {}) {
    return new Promise((resolve, reject) => {
      const cbName = '__gascb_' + (++this._cbId) + '_' + Date.now();
      const timeout = setTimeout(() => {
        delete window[cbName];
        const s = document.getElementById(cbName);
        if (s) s.remove();
        reject(new Error('Request timed out after 15 seconds'));
      }, 15000);

      window[cbName] = (result) => {
        clearTimeout(timeout);
        delete window[cbName];
        const s = document.getElementById(cbName);
        if (s) s.remove();
        resolve(result);
      };

      const flat = { action, callback: cbName };
      for (const [k, v] of Object.entries(data)) {
        flat[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
      }
      const qs  = new URLSearchParams(flat);
      const url = `${CONFIG.API_URL}?${qs}`;

      const script = document.createElement('script');
      script.id  = cbName;
      script.src = url;
      script.onerror = () => {
        clearTimeout(timeout);
        delete window[cbName];
        script.remove();
        reject(new Error('Network error — check Apps Script URL'));
      };
      document.head.appendChild(script);
    }).catch(e => {
      console.error('[API]', action, e);
      return { success: false, message: e.message };
    });
  },
};

// ═══════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════
const Utils = {
  formatDate(isoStr) {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleDateString('en-IN',
        { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return isoStr; }
  },

  formatDateTime(isoStr) {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleString('en-IN',
        { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { return isoStr; }
  },

  statusColor(s) {
    return { Draft:'gray', Scheduled:'amber', Active:'green',
             Completed:'blue', Archived:'slate' }[s] || 'gray';
  },

  downloadCSV(rows, filename) {
    const csv  = rows.map(r =>
      r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'),
                   { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },

  generateQRDataURL(text, size = 200) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}`
         + `&data=${encodeURIComponent(text)}&format=png&margin=10&color=003399&bgcolor=ffffff`;
  },
};

// ═══════════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════════
const Toast = {
  _ready: false,
  _ensure() {
    if (this._ready) return;
    const tc = document.createElement('div');
    tc.id = '_tc';
    tc.style.cssText =
      'position:fixed;bottom:24px;right:24px;z-index:99999;'
    + 'display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    document.body.appendChild(tc);
    const s = document.createElement('style');
    s.textContent =
      '@keyframes _tIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}'
    + '@keyframes _tOut{to{transform:translateX(110%);opacity:0}}';
    document.head.appendChild(s);
    this._ready = true;
  },

  show(msg, type = 'info', ms = 4000) {
    this._ensure();
    const C = { success:'#10b981', error:'#ef4444', warning:'#f59e0b', info:'#6366f1' };
    const I = { success:'✓', error:'✕', warning:'⚠', info:'ℹ' };
    const el = document.createElement('div');
    el.style.cssText =
      `background:#1a2035;color:#fff;padding:13px 18px;border-radius:12px;`
    + `font-size:14px;display:flex;align-items:center;gap:10px;`
    + `box-shadow:0 8px 32px rgba(0,0,0,.4);border-left:3px solid ${C[type]};`
    + `animation:_tIn .3s ease;max-width:340px;font-family:inherit;pointer-events:auto;`;
    el.innerHTML =
      `<span style="color:${C[type]};font-weight:700;font-size:15px">${I[type]}</span>`
    + `<span>${msg}</span>`;
    document.getElementById('_tc').appendChild(el);
    setTimeout(() => {
      el.style.animation = '_tOut .3s ease forwards';
      setTimeout(() => el.remove(), 320);
    }, ms);
  },
};
