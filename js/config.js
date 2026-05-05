// ═══════════════════════════════════════════════════════════════
//  Marengo Asia Hospitals — Training System
//  config.js  ·  MUST be loaded FIRST on every page
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  // ── Paste your Google Apps Script Web App URL here ──────────
  // Example: 'https://script.google.com/macros/s/AKfycb.../exec'
  // Leave as YOUR_DEPLOYMENT_ID to use Demo Mode (no backend)
  API_URL: 'https://script.google.com/macros/s/AKfycbw_REEYFcpbNDNm82tSTSOK26Rbpbxl37IAJpoj6G2jVvEdb_25Ll3ufH54MuBcgwOQ/exec',

  APP_NAME:      'Training System',
  HOSPITAL_NAME: 'Marengo Asia Hospitals',
  TAGLINE:       'Humane by Practice',
  VERSION:       '2.0.0',
};

// ── Demo Mode: true if API_URL is not yet configured ─────────
CONFIG.isDemo = !CONFIG.API_URL ||
                CONFIG.API_URL.includes('YOUR_DEPLOYMENT_ID') ||
                CONFIG.API_URL.trim() === '';

// ── Logo path: works from root and from /pages/ subfolder ────
CONFIG.logoPath = (function () {
  try {
    return window.location.pathname.includes('/pages/')
      ? '../assets/logo.jpg'
      : 'assets/logo.jpg';
  } catch (e) { return 'assets/logo.jpg'; }
})();

// ─────────────────────────────────────────────────────────────
//  PATH HELPER
//  Calculates correct relative path regardless of GitHub Pages
//  repo name or subfolder depth
// ─────────────────────────────────────────────────────────────
const Paths = {
  _inPages() {
    try { return window.location.pathname.includes('/pages/'); }
    catch (e) { return false; }
  },
  root()        { return this._inPages() ? '../' : './'; },
  toLogin()     { window.location.replace(this.root() + 'index.html'); },
  toDashboard() { window.location.href  = this.root() + 'pages/dashboard.html'; },
};

// ─────────────────────────────────────────────────────────────
//  SESSION  (sessionStorage — tab/window scoped, same origin)
// ─────────────────────────────────────────────────────────────
const Session = {
  KEY: 'mah_training_user',

  get() {
    try {
      const s = sessionStorage.getItem(this.KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  },

  set(user) {
    try {
      sessionStorage.setItem(this.KEY, JSON.stringify(user));
      // verify it was stored
      const check = sessionStorage.getItem(this.KEY);
      if (!check) throw new Error('sessionStorage write failed');
    } catch (e) {
      console.error('[Session.set] Error:', e);
    }
  },

  clear() {
    try { sessionStorage.removeItem(this.KEY); } catch {}
  },

  // Call at top of every dashboard page
  require(allowedRoles = []) {
    const user = this.get();
    if (!user || !user.id) {
      console.warn('[Session.require] No valid user — going to login');
      Paths.toLogin();
      return null;
    }
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      console.warn('[Session.require] Role not allowed:', user.role);
      Paths.toLogin();
      return null;
    }
    return user;
  },
};

// ─────────────────────────────────────────────────────────────
//  API  — Google Apps Script (JSONP approach avoids CORS)
//
//  HOW IT WORKS:
//  Google Apps Script web apps redirect all requests, which
//  causes CORS failures with fetch(). Instead we inject a
//  <script> tag — browsers don't apply CORS to script tags.
//  The Apps Script backend wraps the JSON in callback(json).
//
//  REQUIREMENT: Code.gs must use makeOutput(result, callback)
//  which is already included in the provided Code.gs file.
//  After any Code.gs change → Deploy → New Version in GAS.
// ─────────────────────────────────────────────────────────────
const API = {
  _id: 0,

  call(action, data = {}) {
    if (CONFIG.isDemo) {
      // Should not reach here in demo mode, but guard anyway
      return Promise.resolve({ success: false, message: 'Demo mode — no API' });
    }

    return new Promise((resolve) => {
      const name    = '_cb' + (++this._id) + '_' + Date.now();
      const TIMEOUT = 20000; // 20 seconds

      // Cleanup helper
      const cleanup = () => {
        clearTimeout(timer);
        try { delete window[name]; } catch {}
        const el = document.getElementById('_s_' + name);
        if (el) el.remove();
      };

      // Timeout handler
      const timer = setTimeout(() => {
        cleanup();
        resolve({
          success: false,
          message: 'Request timed out (20s). Check:\n'
                 + '1. Apps Script URL is correct in config.js\n'
                 + '2. Deployed as "Execute as: Me, Access: Anyone"\n'
                 + '3. Code.gs was updated and redeployed with JSONP support\n'
                 + '4. setupSheets() was run in Apps Script'
        });
      }, TIMEOUT);

      // JSONP callback
      window[name] = (result) => {
        cleanup();
        resolve(result);
      };

      // Build URL with all params
      const params = { action, callback: name };
      for (const [k, v] of Object.entries(data)) {
        params[k] = (v !== null && typeof v === 'object') ? JSON.stringify(v) : String(v ?? '');
      }
      const qs  = new URLSearchParams(params).toString();
      const url = CONFIG.API_URL + '?' + qs;

      // Inject script tag
      const s = document.createElement('script');
      s.id  = '_s_' + name;
      s.src = url;
      s.onerror = () => {
        cleanup();
        resolve({
          success: false,
          message: 'Cannot reach Apps Script. Check your API URL in config.js.'
        });
      };
      (document.head || document.body).appendChild(s);

    }).catch(e => {
      console.error('[API]', action, e);
      return { success: false, message: String(e.message || e) };
    });
  },
};

// ─────────────────────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────────────────────
const Utils = {
  formatDate(v) {
    if (!v) return '—';
    try { return new Date(v).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); }
    catch { return v; }
  },
  formatDateTime(v) {
    if (!v) return '—';
    try { return new Date(v).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }); }
    catch { return v; }
  },
  statusColor(s) {
    return { Draft:'gray', Scheduled:'amber', Active:'green', Completed:'blue', Archived:'slate' }[s] || 'gray';
  },
  downloadCSV(rows, filename) {
    const csv  = rows.map(r => r.map(c => `"${String(c??'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF'+csv], { type:'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href:url, download:filename });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },
  generateQRDataURL(text, size = 200) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=png&margin=10&color=003399&bgcolor=ffffff`;
  },
};

// ─────────────────────────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────────────────────────
const Toast = {
  _ok: false,
  _ensure() {
    if (this._ok) return;
    const d = document.createElement('div');
    d.id = '_tc';
    d.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    document.body.appendChild(d);
    const s = document.createElement('style');
    s.textContent = '@keyframes _tIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes _tOut{to{transform:translateX(110%);opacity:0}}';
    document.head.appendChild(s);
    this._ok = true;
  },
  show(msg, type = 'info', ms = 4500) {
    this._ensure();
    const C = { success:'#10b981', error:'#ef4444', warning:'#f59e0b', info:'#6366f1' };
    const I = { success:'✓', error:'✕', warning:'⚠', info:'ℹ' };
    const el = document.createElement('div');
    el.style.cssText = `background:#1a2035;color:#fff;padding:13px 18px;border-radius:12px;font-size:14px;display:flex;align-items:center;gap:10px;box-shadow:0 8px 32px rgba(0,0,0,.4);border-left:3px solid ${C[type]};animation:_tIn .3s ease;max-width:340px;font-family:inherit;pointer-events:auto;`;
    el.innerHTML = `<span style="color:${C[type]};font-weight:700;font-size:15px">${I[type]}</span><span>${msg}</span>`;
    document.getElementById('_tc').appendChild(el);
    setTimeout(() => { el.style.animation='_tOut .3s ease forwards'; setTimeout(() => el.remove(), 320); }, ms);
  },
};
