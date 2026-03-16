// ── Popup download notifications (Steam-style toasts) ─────────────────────────
// Shows "X downloaded Y" toasts in bottom-right corner

const _toastNames = [
  'Phantom', 'Vortex99', 'dark_wolf', 'ShadowByte', 'NightOwl_', 'blazer', 'coldfire',
  'ProGamer2077', 'Mike_G', 'IceDragon', 'LoneRifle', 'Zephyr', 'n1ghtvision', 'Rogue_',
  'GhostHawk', 'VertexX', 'PowerSurge', 'CrimsonBlade', 'StormBreaker', 'Neon_Ace',
];

const _toastColors = [
  '#38bdf8', '#818cf8', '#f472b6', '#34d399', '#fb923c', '#a78bfa', '#22d3ee',
];

let _toastId = 0;
let _toastTimer = null;
let _recentToastNames = [];

function _toastGamePool() {
  const top = window.topGames || [];
  const trending = window.trendingGames || [];
  const pool = [];
  top.forEach((g, i) => {
    const w = Math.max(5 - i, 2);
    for (let j = 0; j < w; j++) pool.push(g);
  });
  trending.forEach(g => { pool.push(g); pool.push(g); });
  return pool;
}

function _pickToastName() {
  const avail = _toastNames.filter(n => !_recentToastNames.includes(n));
  const pool = avail.length > 3 ? avail : _toastNames;
  const name = pool[Math.floor(Math.random() * pool.length)];
  _recentToastNames.push(name);
  if (_recentToastNames.length > 5) _recentToastNames.shift();
  return name;
}

function _showDownloadToast() {
  const pool = _toastGamePool();
  if (!pool.length) { _scheduleToast(); return; }

  const game = pool[Math.floor(Math.random() * pool.length)];
  const user = _pickToastName();
  const colorIdx = _toastNames.indexOf(user) % _toastColors.length;
  const color = _toastColors[Math.abs(colorIdx)];
  const id = ++_toastId;

  const container = document.getElementById('toast-container');
  if (!container) { _scheduleToast(); return; }

  const initial = user.charAt(0).toUpperCase();
  const safeAttrs = `${game.appId}, ${_jqAttr(game.name)}, '', ${_jqAttr(game.size || '')}, ${_jqAttr(game.tags || [])}`;

  const toast = document.createElement('div');
  toast.id = `toast-${id}`;
  toast.className = 'toast-popup';
  toast.innerHTML = `
    <div class="toast-popup-inner">
      <div class="toast-popup-avatar" style="background:${color}22;border-color:${color}50;color:${color}">${initial}</div>
      <div class="toast-popup-thumb">
        <img src="${steamImg(game.appId)}" alt="" loading="lazy" onerror="this.style.opacity='0.15'" />
      </div>
      <div class="toast-popup-body">
        <div class="toast-popup-user">${user}</div>
        <div class="toast-popup-msg">downloaded</div>
        <div class="toast-popup-game">${game.name}</div>
      </div>
      <button class="toast-popup-btn" onclick="quickDownload(${safeAttrs}); this.closest('.toast-popup').remove();">
        <i class="fa-solid fa-download text-[9px]"></i> Get
      </button>
    </div>`;

  container.appendChild(toast);

  // Limit visible toasts
  while (container.children.length > 3) container.removeChild(container.firstChild);

  // Auto-dismiss after 6 seconds
  setTimeout(() => {
    const el = document.getElementById(`toast-${id}`);
    if (el) {
      el.classList.add('toast-popup-out');
      setTimeout(() => el.remove(), 300);
    }
  }, 6000);

  _scheduleToast();
}

function _scheduleToast() {
  clearTimeout(_toastTimer);
  const delay = 8000 + Math.random() * 14000;
  if (Math.random() < 0.2) {
    _toastTimer = setTimeout(() => { _showDownloadToast(); _showDownloadToast(); }, delay);
  } else {
    _toastTimer = setTimeout(_showDownloadToast, delay);
  }
}

function initNotifications() {
  // First toast after 3–8 seconds
  _toastTimer = setTimeout(_showDownloadToast, 3000 + Math.random() * 5000);
}

document.addEventListener('DOMContentLoaded', initNotifications);
