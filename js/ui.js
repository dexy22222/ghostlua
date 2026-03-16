// ── Shared helper functions ───────────────────────────────────────────────────
function steamImg(appId) {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;
}
function _thumbFb(el) {
  el.parentNode.innerHTML = '<span class="game-thumb-fallback"><i class="fa-brands fa-steam"></i></span>';
}
function _srFb(el) {
  el.parentNode.innerHTML = '<span class="search-result-fallback"><i class="fa-brands fa-steam"></i></span>';
}
function _prFb(el) {
  el.parentNode.innerHTML = '<span class="profile-game-fallback"><i class="fa-brands fa-steam"></i></span>';
}
function _jqAttr(val) {
  return JSON.stringify(val).replace(/"/g, '&quot;');
}
function _fmtDate(date) {
  if (!date) return null;
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days < 1)   return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)   return `${days}d ago`;
  if (days < 30)  return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// ── Online Presence ───────────────────────────────────────────────────────────
const SESSION_ID        = Math.random().toString(36).slice(2);
const HEARTBEAT_KEY     = 'gl_presence';
const HEARTBEAT_INTERVAL = 4000;
const SESSION_TTL       = 10000;
const ONLINE_BASE       = 24;

function getActiveSessions() {
  try {
    const raw = JSON.parse(localStorage.getItem(HEARTBEAT_KEY) || '{}');
    const now = Date.now();
    return Object.fromEntries(Object.entries(raw).filter(([, ts]) => now - ts < SESSION_TTL));
  } catch { return {}; }
}

function getNaturalCount(real) {
  const t    = Date.now() / 1000;
  const wave = Math.round(
    Math.sin(t / 90)  * 7 +
    Math.sin(t / 23)  * 3 +
    Math.sin(t / 400) * 5
  );
  return Math.max(ONLINE_BASE + real + wave, ONLINE_BASE - 2);
}

function heartbeat() {
  try {
    const s = getActiveSessions();
    s[SESSION_ID] = Date.now();
    localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(s));
    updateOnlineDisplay(Object.keys(s).length);
    _bc.postMessage({ type: 'ping' });
  } catch {}
}

function updateOnlineDisplay(localCount) {
  const n = getNaturalCount(localCount);
  document.querySelectorAll('.online-count').forEach(el => el.textContent = `${n} online`);
}

let _bc;
try {
  _bc = new BroadcastChannel('ghostlua_presence');
  _bc.onmessage = () => updateOnlineDisplay(Object.keys(getActiveSessions()).length);
} catch { _bc = { postMessage: () => {} }; }

heartbeat();
setInterval(heartbeat, HEARTBEAT_INTERVAL);
setInterval(() => updateOnlineDisplay(Object.keys(getActiveSessions()).length), 12000);

window.addEventListener('beforeunload', () => {
  try {
    const s = getActiveSessions();
    delete s[SESSION_ID];
    localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(s));
  } catch {}
});

// ── Generic Modal ─────────────────────────────────────────────────────────────
const modalContent = {
  privacy: {
    title: 'Privacy Policy',
    body: `<p class="mb-3 text-slate-500 text-xs">Last updated: March 2026</p>
<p class="mb-3">GhostLua ("we") operates this website. We do not sell your data.</p>
<p class="mb-3"><strong class="text-slate-200">Data We Collect:</strong> Basic usage analytics only.</p>
<p class="mb-3"><strong class="text-slate-200">Discord Login:</strong> Discord user ID and username for account identification.</p>
<p>Questions? Join our <a href="https://discord.gg/ghostlua" target="_blank" class="text-indigo-400 hover:text-indigo-300">Discord</a>.</p>`
  },
  tos: {
    title: 'Terms of Service',
    body: `<p class="mb-3 text-slate-500 text-xs">Last updated: March 2026</p>
<p class="mb-3">By using GhostLua you agree to these terms. Service is provided "as is".</p>
<p class="mb-3"><strong class="text-slate-200">Acceptable Use:</strong> Not for illegal purposes.</p>
<p class="mb-3"><strong class="text-slate-200">Steam:</strong> Game data from Steam's public APIs. Not affiliated with Valve.</p>
<p>Questions? Join our <a href="https://discord.gg/ghostlua" target="_blank" class="text-indigo-400 hover:text-indigo-300">Discord</a>.</p>`
  }
};

function showModal(type) {
  const d = modalContent[type]; if (!d) return;
  document.getElementById('modal-title').textContent = d.title;
  document.getElementById('modal-content').innerHTML = d.body;
  document.getElementById('generic-modal').classList.remove('hidden');
}
function hideModal()      { document.getElementById('generic-modal').classList.add('hidden'); }
function showLoginModal() { /* removed */ }
function hideLoginModal() { /* removed */ }
function toggleMobileMenu() { document.getElementById('mobile-menu').classList.toggle('hidden'); }

function copyAppId() {
  if (!window.currentDownloadGame) return;
  navigator.clipboard.writeText(String(window.currentDownloadGame.appId)).then(() => {
    const btn = document.getElementById('dl-copy-btn');
    if (!btn) return;
    btn.innerHTML = '<i class="fa-solid fa-check text-emerald-400 text-[10px]"></i>';
    setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy text-[10px]"></i>'; }, 1500);
  }).catch(() => {});
}
