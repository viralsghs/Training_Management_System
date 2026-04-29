// ============================================================
// HOSPITAL TRAINING MANAGEMENT SYSTEM
// GitHub Hosted — Google Apps Script Backend
// ============================================================

const CONFIG = {
  // ⚠️ REPLACE THIS with your deployed Google Apps Script Web App URL
  API_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',

  APP_NAME: 'MedTrain',
  HOSPITAL_NAME: 'Hospital Training Portal',
  VERSION: '2.0.0'
};

// ============================================================
// API HELPER — All calls go through this
// ============================================================
const API = {
  async call(action, data = {}) {
    try {
      const params = new URLSearchParams({ action, ...Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : v])
      )});
      const res = await fetch(`${CONFIG.API_URL}?${params}`);
      const json = await res.json();
      return json;
    } catch (e) {
      console.error('API Error:', e);
      return { success: false, message: 'Connection error. Please try again.' };
    }
  },

  async post(action, data = {}) {
    try {
      const body = new FormData();
      body.append('action', action);
      for (const [k, v] of Object.entries(data)) {
        body.append(k, typeof v === 'object' ? JSON.stringify(v) : v);
      }
      const res = await fetch(CONFIG.API_URL, { method: 'POST', body });
      const json = await res.json();
      return json;
    } catch (e) {
      return { success: false, message: 'Connection error.' };
    }
  }
};

// ============================================================
// SESSION MANAGEMENT
// ============================================================
const Session = {
  get() {
    const s = sessionStorage.getItem('medtrain_user');
    return s ? JSON.parse(s) : null;
  },
  set(user) {
    sessionStorage.setItem('medtrain_user', JSON.stringify(user));
  },
  clear() {
    sessionStorage.removeItem('medtrain_user');
  },
  require(allowedRoles = []) {
    const user = this.get();
    if (!user) { window.location.href = '/index.html'; return null; }
    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      window.location.href = '/index.html'; return null;
    }
    return user;
  }
};

// ============================================================
// UTILITIES
// ============================================================
const Utils = {
  formatDate(isoStr) {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return isoStr; }
  },
  formatDateTime(isoStr) {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { return isoStr; }
  },
  statusColor(status) {
    const map = { Draft: 'gray', Scheduled: 'amber', Active: 'green', Completed: 'blue', Archived: 'slate' };
    return map[status] || 'gray';
  },
  downloadCSV(rows, filename) {
    const csv = rows.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  generateQRDataURL(text, size = 200) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=png&margin=10&color=1a1a2e&bgcolor=ffffff`;
  }
};

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
const Toast = {
  show(msg, type = 'info', duration = 4000) {
    let tc = document.getElementById('toast-container');
    if (!tc) {
      tc = document.createElement('div');
      tc.id = 'toast-container';
      tc.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
      document.body.appendChild(tc);
    }
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#6366f1' };
    const t = document.createElement('div');
    t.style.cssText = `background:#1e1e2e;color:#fff;padding:14px 18px;border-radius:12px;font-size:14px;display:flex;align-items:center;gap:10px;box-shadow:0 8px 32px rgba(0,0,0,.3);border-left:3px solid ${colors[type]};animation:toastIn .3s ease;max-width:340px;font-family:inherit;`;
    t.innerHTML = `<span style="color:${colors[type]};font-weight:700;font-size:16px">${icons[type]}</span><span>${msg}</span>`;
    tc.appendChild(t);
    setTimeout(() => { t.style.animation = 'toastOut .3s ease forwards'; setTimeout(() => t.remove(), 300); }, duration);
  }
};

// Add toast animations globally
if (!document.getElementById('toast-style')) {
  const s = document.createElement('style');
  s.id = 'toast-style';
  s.textContent = `@keyframes toastIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes toastOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(40px)}}`;
  document.head.appendChild(s);
}
