// ── Notifications Panel ─────────────────────────────────────────────────────
// Site announcements, updates, and system messages (not download activity)

const _notifTypes = [
  { icon: 'fa-solid fa-circle-info', color: '#22d3ee', label: 'info' },
  { icon: 'fa-solid fa-sparkles', color: '#a78bfa', label: 'update' },
  { icon: 'fa-solid fa-bullhorn', color: '#34d399', label: 'announcement' },
  { icon: 'fa-solid fa-shield-halved', color: '#f59e0b', label: 'security' },
  { icon: 'fa-solid fa-wrench', color: '#94a3b8', label: 'maintenance' },
];

const _notifMessages = [
  { type: 'announcement', msg: 'Welcome to GhostLua — free Steam Lua scripts for everyone.' },
  { type: 'info', msg: 'Search for any game by name. DLCs are supported too.' },
  { type: 'update', msg: 'New scripts added this week. Check Recently Added for the latest.' },
  { type: 'info', msg: 'Join our Discord for support and to request new games.' },
  { type: 'announcement', msg: 'GhostLua is now live on Cloudflare. Faster for everyone!' },
  { type: 'info', msg: 'Star games to save them to your favorites for quick access.' },
  { type: 'update', msg: 'Database updated with hundreds of new titles.' },
  { type: 'security', msg: 'All scripts are verified. Download only from GhostLua.' },
  { type: 'info', msg: 'Use the random filter to discover new games.' },
  { type: 'announcement', msg: 'Status page available — check system health anytime.' },
];

let _notifIdCounter = 0;
let _notifFeed = [];
let _notifTimer = null;

function _notifTimestamp(minsAgo) {
  if (minsAgo < 1) return 'just now';
  if (minsAgo < 60) return `${minsAgo}m ago`;
  return `${Math.floor(minsAgo / 60)}h ago`;
}

function _makeNotif(minsAgo) {
  const template = _notifMessages[Math.floor(Math.random() * _notifMessages.length)];
  const typeInfo = _notifTypes.find(t => t.label === template.type) || _notifTypes[0];
  const id = ++_notifIdCounter;
  return {
    id,
    icon: typeInfo.icon,
    color: typeInfo.color,
    msg: template.msg,
    ts: Date.now() - minsAgo * 60000,
    minsAgo,
  };
}

function _notifItemHtml(n) {
  return `
    <div class="notif-item" id="notif-${n.id}">
      <div class="notif-icon-wrap" style="background:${n.color}18;border-color:${n.color}40;color:${n.color}">
        <i class="${n.icon} text-[10px]"></i>
      </div>
      <div class="notif-body">
        <div class="notif-msg">${n.msg}</div>
        <div class="notif-time"><i class="fa-regular fa-clock"></i> ${_notifTimestamp(n.minsAgo)}</div>
      </div>
    </div>`;
}

function _renderNotifFeed() {
  const el = document.getElementById('notif-feed');
  if (!el) return;
  el.innerHTML = _notifFeed.map(n => _notifItemHtml(n)).join('');
}

function _addNewNotif() {
  const card = document.getElementById('notif-card');
  if (card && card.classList.contains('hidden')) {
    _scheduleNextNotif();
    return;
  }

  const n = _makeNotif(0);
  _notifFeed.unshift(n);
  if (_notifFeed.length > 25) _notifFeed.pop();

  const feed = document.getElementById('notif-feed');
  if (!feed) { _scheduleNextNotif(); return; }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = _notifItemHtml(n);
  const item = wrapper.firstElementChild;
  item.classList.add('notif-item-new');
  feed.insertBefore(item, feed.firstChild);

  while (feed.children.length > 25) feed.removeChild(feed.lastChild);

  _scheduleNextNotif();
}

function _scheduleNextNotif() {
  clearTimeout(_notifTimer);
  const delay = 15000 + Math.random() * 25000; // 15–40 seconds
  _notifTimer = setTimeout(_addNewNotif, delay);
}

function _tickNotifTimes() {
  _notifFeed.forEach(n => {
    n.minsAgo = Math.floor((Date.now() - n.ts) / 60000);
    const timeEl = document.querySelector(`#notif-${n.id} .notif-time`);
    if (timeEl) {
      timeEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${_notifTimestamp(n.minsAgo)}`;
    }
  });
}

function initNotifications() {
  const initialMins = [0, 0, 1, 3, 6, 10, 15, 22, 30];
  _notifFeed = initialMins.map(m => _makeNotif(m));
  _renderNotifFeed();
  _scheduleNextNotif();
  setInterval(_tickNotifTimes, 60000);
}

document.addEventListener('DOMContentLoaded', initNotifications);
