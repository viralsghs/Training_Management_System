// ============================================================
// MEDTRAIN — Hospital Training Management System
// config.js  — loaded first on every page
// ============================================================

const CONFIG = {
  // ⚠️  After deploying Google Apps Script, replace the URL below.
  // Leave as-is to run in Demo Mode (no backend needed).
  API_URL: 'https://script.google.com/macros/s/AKfycbxdvWqe5qTvRS_9_TolrpozlyN5hTuMn8i6ZBaDpa0waOM7Wv_aaflb6DSTa5wYdL7s/exec',

  APP_NAME:      'MedTrain',
  HOSPITAL_NAME: 'Hospital Training Portal',
  VERSION:       '2.0.0',
};

// ── Is the real API configured? ────────────────────────────
CONFIG.isDemo = CONFIG.API_URL.includes('YOUR_DEPLOYMENT_ID');

// ============================================================
// RELATIVE-PATH HELPER
// Works on localhost, GitHub Pages subdirectories, everywhere.
// pages/dashboard.html → '../index.html'
// index.html           → 'index.html'
// ============================================================
const Paths = {
  // depth = how many levels deep is the current page?
  _depth() {
    const p = window.location.pathname;
    // count slashes after the repo root
    const parts = p.replace(/\/$/, '').split('/').filter(Boolean);
    // On GitHub Pages: /RepoName/pages/dashboard.html → depth inside pages = 1
    // On root:        /RepoName/index.html → depth = 0
    // Heuristic: if the last segment has a '.' it is a file, step back
    return parts[parts.length - 1]?.includes('.') ? parts.length - 1 : parts.length;
  },
  root() {
    const d = this._depth();
    if (d <= 1) return './';      // we are at root level (index.html or /pages not yet entered)
    return '../';                 // one folder deep (pages/)
  },
  toLogin()     { window.location.replace(this.root() + 'index.html'); },
  toDashboard() { window.location.href  = this.root() + 'pages/dashboard.html'; },
};

// ============================================================
// SESSION  (sessionStorage — tab-scoped, survives page nav)
// ============================================================
const Session = {
  KEY: 'medtrain_user',
  get() {
    try {
      const s = sessionStorage.getItem(this.KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  },
  set(user) {
    try { sessionStorage.setItem(this.KEY, JSON.stringify(user)); } catch {}
  },
  clear() {
    try { sessionStorage.removeItem(this.KEY); } catch {}
  },
  // Call at top of every dashboard page. Returns user or null (and redirects).
  require(allowedRoles = []) {
    const user = this.get();
    if (!user) { Paths.toLogin(); return null; }
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      Paths.toLogin(); return null;
    }
    return user;
  },
};

// ============================================================
// API  (fetch wrapper — GET with query params)
// ============================================================
const API = {
  async call(action, data = {}) {
    try {
      const flat = {};
      for (const [k, v] of Object.entries(data)) {
        flat[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
      }
      const params = new URLSearchParams({ action, ...flat });
      const res = await fetch(`${CONFIG.API_URL}?${params}`, {
        method: 'GET',
        redirect: 'follow',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error('[API]', action, e);
      return { success: false, message: 'Connection error: ' + e.message };
    }
  },
};

// ============================================================
// UTILITIES
// ============================================================
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
  statusColor(status) {
    return { Draft:'gray', Scheduled:'amber', Active:'green',
             Completed:'blue', Archived:'slate' }[status] || 'gray';
  },
  downloadCSV(rows, filename) {
    const csv = rows
      .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },
  generateQRDataURL(text, size = 200) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}`
         + `&data=${encodeURIComponent(text)}&format=png&margin=10&color=1a1a2e&bgcolor=ffffff`;
  },
};

// ============================================================
// TOAST
// ============================================================
const Toast = {
  _init() {
    if (document.getElementById('_toast_box')) return;
    const tc = document.createElement('div');
    tc.id = '_toast_box';
    tc.style.cssText =
      'position:fixed;bottom:24px;right:24px;z-index:99999;'
    + 'display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    document.body.appendChild(tc);

    const s = document.createElement('style');
    s.textContent =
      '@keyframes _tIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}'
    + '@keyframes _tOut{to{transform:translateX(110%);opacity:0}}';
    document.head.appendChild(s);
  },
  show(msg, type = 'info', ms = 4000) {
    this._init();
    const colors = { success:'#10b981', error:'#ef4444', warning:'#f59e0b', info:'#6366f1' };
    const icons  = { success:'✓', error:'✕', warning:'⚠', info:'ℹ' };
    const el = document.createElement('div');
    el.style.cssText =
      `background:#1e1e2e;color:#fff;padding:13px 18px;border-radius:12px;font-size:14px;`
    + `display:flex;align-items:center;gap:10px;box-shadow:0 8px 32px rgba(0,0,0,.4);`
    + `border-left:3px solid ${colors[type]};animation:_tIn .3s ease;max-width:340px;`
    + `font-family:'DM Sans',sans-serif;pointer-events:auto;`;
    el.innerHTML =
      `<span style="color:${colors[type]};font-weight:700;font-size:15px">${icons[type]}</span>`
    + `<span>${msg}</span>`;
    document.getElementById('_toast_box').appendChild(el);
    setTimeout(() => {
      el.style.animation = '_tOut .3s ease forwards';
      setTimeout(() => el.remove(), 320);
    }, ms);
  },
};
