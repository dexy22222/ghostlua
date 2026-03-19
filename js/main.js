// ── Game chart data ───────────────────────────────────────────────────────────
// AppIDs verified against Steam store (store.steampowered.com/app/APPID)
let topGames = [
  { rank: '#1',  name: 'Wallpaper Engine',            downloads: '1,429 downloads', appId: 431960,  size: '0.4 GB',   tags: ['Workshop'] },
  { rank: '#2',  name: 'Resident Evil 4',             downloads: '1,223 downloads', appId: 2050650, size: '67.5 GB',  tags: ['Online Fix'] },
  { rank: '#3',  name: 'Red Dead Redemption 2',       downloads: '768 downloads',   appId: 1174180, size: '120.5 GB', tags: ['Online Fix'] },
  { rank: '#4',  name: 'Geometry Dash',               downloads: '737 downloads',   appId: 322170,  size: '0.2 GB',   tags: [] },
  { rank: '#5',  name: 'Resident Evil 2',             downloads: '716 downloads',   appId: 883710,  size: '21.7 GB',  tags: ['Online Fix'] },
  { rank: '#6',  name: 'Grand Theft Auto V',          downloads: '570 downloads',   appId: 271590,  size: '95.2 GB',  tags: ['Online Fix'] },
  { rank: '#7',  name: "Marvel's Spider-Man 2",       downloads: '564 downloads',   appId: 2651280, size: '69.5 GB',  tags: [] },
  { rank: '#8',  name: 'Schedule I',                  downloads: '555 downloads',   appId: 3164500, size: '3.1 GB',   tags: [] },
  { rank: '#9',  name: 'Poppy Playtime - Chapter 4',  downloads: '505 downloads',   appId: 3008670, size: '12.4 GB',  tags: [] },
  { rank: '#10', name: "Baldur's Gate 3",             downloads: '489 downloads',   appId: 1086940, size: '150.0 GB', tags: [] },
  { rank: '#11', name: 'Hogwarts Legacy',             downloads: '452 downloads',   appId: 990080,  size: '85.0 GB',  tags: [] },
  { rank: '#12', name: 'Palworld',                    downloads: '431 downloads',   appId: 1623730, size: '20.0 GB',  tags: ['Online Fix'] },
  { rank: '#13', name: 'Cities: Skylines II',         downloads: '398 downloads',   appId: 949230,  size: '60.0 GB',  tags: ['Workshop'] },
  { rank: '#14', name: 'Black Myth: Wukong',          downloads: '376 downloads',   appId: 2358720, size: '130.0 GB', tags: [] },
  { rank: '#15', name: 'Cyberpunk 2077',              downloads: '361 downloads',   appId: 1091500, size: '70.0 GB',  tags: [] },
];

let trendingGames = [
  { rank: '#1', name: 'Slay the Spire 2',        downloads: '↑ Trending', appId: 2868840, size: '2.5 GB',   tags: ['Online Fix', 'Workshop'] },
  { rank: '#2', name: 'Elden Ring',               downloads: '↑ Trending', appId: 1245620, size: '60.0 GB',  tags: ['Online Fix'] },
  { rank: '#3', name: 'Hades II',                 downloads: '↑ Trending', appId: 1145350, size: '5.0 GB',   tags: [] },
  { rank: '#4', name: 'Rust',                     downloads: '↑ Trending', appId: 252490,  size: '12.0 GB',  tags: ['Online Fix'] },
  { rank: '#5', name: 'Sons of the Forest',       downloads: '↑ Trending', appId: 1326470, size: '20.0 GB',  tags: ['Online Fix'] },
  { rank: '#6', name: 'Black Myth: Wukong',       downloads: '↑ Trending', appId: 2358720, size: '130.0 GB', tags: [] },
  { rank: '#7', name: 'Manor Lords',              downloads: '↑ Trending', appId: 1363080, size: '16.0 GB',  tags: [] },
  { rank: '#8', name: 'Hollow Knight: Silksong',  downloads: '↑ Trending', appId: 1030300, size: '10.0 GB',  tags: [] },
  { rank: '#9', name: 'Dead by Daylight',         downloads: '↑ Trending', appId: 381210,  size: '50.0 GB',  tags: ['Online Fix'] },
  { rank: '#10', name: 'Satisfactory',            downloads: '↑ Trending', appId: 526870,  size: '15.0 GB',  tags: ['Online Fix'] },
];

let recentlyAdded = [
  { name: 'Schedule I',                 appId: 3164500, addedDate: '2026-03-14', downloads: 555, tags: [] },
  { name: 'Poppy Playtime - Chapter 4', appId: 3008670, addedDate: '2026-03-12', downloads: 505, tags: [] },
  { name: 'Slay the Spire 2',           appId: 2868840, addedDate: '2026-03-10', downloads: 420, tags: ['Online Fix'] },
  { name: "Marvel's Spider-Man 2",      appId: 2651280, addedDate: '2026-03-08', downloads: 564, tags: [] },
  { name: 'Hades II',                   appId: 1145350, addedDate: '2026-03-05', downloads: 380, tags: [] },
  { name: 'Sons of the Forest',         appId: 1326470, addedDate: '2026-03-01', downloads: 312, tags: ['Online Fix'] },
  { name: 'Manor Lords',                appId: 1363080, addedDate: '2026-02-25', downloads: 287, tags: [] },
  { name: 'Black Myth: Wukong',         appId: 2358720, addedDate: '2026-02-20', downloads: 376, tags: [] },
  { name: 'Satisfactory',               appId: 526870,  addedDate: '2026-02-15', downloads: 245, tags: ['Online Fix'] },
  { name: 'Dead by Daylight',           appId: 381210,  addedDate: '2026-02-10', downloads: 198, tags: ['Online Fix'] },
];

// Expose to other modules
window.topGames      = topGames;
window.trendingGames = trendingGames;
window.recentlyAdded = recentlyAdded;

// ── State ─────────────────────────────────────────────────────────────────────
let topShowAll = false;
window.currentMode = 'individual';

// ── Rank styles ───────────────────────────────────────────────────────────────
const rankClasses = ['rank-1', 'rank-2', 'rank-3'];

// ── Render a single chart game item ───────────────────────────────────────────
function _renderChartItem(g, i) {
  const fallback = `if(this.dataset.tried){_thumbFb(this)}else{this.dataset.tried=1;this.src='https://steamcdn-a.akamaihd.net/steam/apps/${g.appId}/header.jpg'}`;
  return `
    <button class="chart-game-item group w-full text-left"
      onclick="quickDownload(${g.appId}, ${_jqAttr(g.name)}, ${_jqAttr(g.downloads)}, ${_jqAttr(g.size || '')}, ${_jqAttr(g.tags || [])})"
      style="animation-delay:${i * 40}ms">
      <span class="chart-rank-num ${rankClasses[i] || 'rank-other'}">${g.rank}</span>
      <div class="chart-thumb-wrap">
        <img src="${steamImg(g.appId)}" alt="${g.name}" loading="lazy" class="chart-thumb"
             onerror="${fallback}" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="chart-game-name truncate leading-snug">${g.name}</div>
        <div class="chart-game-meta">
          <span class="chart-game-dl">${g.downloads}</span>
          ${(g.tags || []).map(t => `<span class="game-tag game-tag-${t.toLowerCase().replace(/\s+/g, '-')}">${t}</span>`).join('')}
        </div>
      </div>
      <span class="flex items-center gap-1.5 flex-shrink-0">
        <span role="button" onclick="event.stopPropagation(); toggleFavorite(${g.appId}, ${_jqAttr(g.name)})"
          class="favorite-star-btn flex-shrink-0 ${isFavorite(g.appId) ? 'text-yellow-400' : 'text-slate-700 hover:text-yellow-400'} transition-colors"
          title="${isFavorite(g.appId) ? 'Remove from starred' : 'Star'}">
          <i class="fa-${isFavorite(g.appId) ? 'solid' : 'regular'} fa-star text-[10px]"></i>
        </span>
        <i class="fa-solid fa-chevron-right game-arrow text-[9px]"></i>
      </span>
    </button>`;
}

// ── Render a single recently-added item ───────────────────────────────────────
function _renderRecentItem(g, i) {
  const fallback = `if(this.dataset.tried){_thumbFb(this)}else{this.dataset.tried=1;this.src='https://steamcdn-a.akamaihd.net/steam/apps/${g.appId}/header.jpg'}`;
  const d = new Date(g.addedDate + 'T00:00:00');
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dlStr = g.downloads.toLocaleString() + ' downloads';
  return `
    <button class="chart-game-item group w-full text-left"
      onclick="quickDownload(${g.appId}, ${_jqAttr(g.name)}, ${_jqAttr(dlStr)}, '', ${_jqAttr(g.tags || [])})"
      style="animation-delay:${i * 40}ms">
      <div class="chart-thumb-wrap">
        <img src="${steamImg(g.appId)}" alt="${g.name}" loading="lazy" class="chart-thumb"
             onerror="${fallback}" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="chart-game-name truncate leading-snug">${g.name}</div>
        <div class="chart-game-meta">
          <span class="text-[9px] text-emerald-400/70 font-medium flex items-center gap-1">
            <i class="fa-solid fa-plus text-[7px]"></i>${dateStr}
          </span>
          ${(g.tags || []).map(t => `<span class="game-tag game-tag-${t.toLowerCase().replace(/\s+/g, '-')}">${t}</span>`).join('')}
        </div>
      </div>
      <span class="flex items-center gap-1.5 flex-shrink-0">
        <span role="button" onclick="event.stopPropagation(); toggleFavorite(${g.appId}, ${_jqAttr(g.name)})"
          class="favorite-star-btn flex-shrink-0 ${isFavorite(g.appId) ? 'text-yellow-400' : 'text-slate-700 hover:text-yellow-400'} transition-colors"
          title="${isFavorite(g.appId) ? 'Remove from starred' : 'Star'}">
          <i class="fa-${isFavorite(g.appId) ? 'solid' : 'regular'} fa-star text-[10px]"></i>
        </span>
        <i class="fa-solid fa-chevron-right game-arrow text-[9px]"></i>
      </span>
    </button>`;
}

// ── Render recently added list ────────────────────────────────────────────────
function renderRecentList() {
  const container = document.getElementById('recent-list');
  if (!container) return;
  container.innerHTML = recentlyAdded.map((g, i) => _renderRecentItem(g, i)).join('');
}

// ── Render top downloads list ─────────────────────────────────────────────────
function renderTopList() {
  const container = document.getElementById('top-downloads-list');
  if (!container) return;
  const visible = topShowAll ? topGames : topGames.slice(0, 3);
  container.innerHTML = visible.map((g, i) => _renderChartItem(g, i)).join('');
  _updateTopShowMoreBtn();
}

// ── Render trending list ──────────────────────────────────────────────────────
function renderTrendingList() {
  const container = document.getElementById('trending-list');
  if (!container) return;
  container.innerHTML = trendingGames.map((g, i) => _renderChartItem(g, i)).join('');
}

// ── Master render (called on init + live update) ──────────────────────────────
function renderGames() {
  renderTopList();
  renderTrendingList();
  renderRecentList();
}

// ── Show more (top downloads only) ───────────────────────────────────────────
function toggleTopShowMore() {
  topShowAll = !topShowAll;
  renderTopList();
}

function _updateTopShowMoreBtn() {
  const btn  = document.getElementById('top-show-more-btn');
  if (!btn) return;
  const rem  = topGames.length - 3;
  if (rem <= 0) { btn.style.display = 'none'; return; }
  btn.style.display = 'flex';
  document.getElementById('top-show-more-text').textContent =
    topShowAll ? 'Show less' : `Show ${rem} more`;
  document.getElementById('top-show-more-icon').className =
    topShowAll ? 'fa-solid fa-chevron-up text-[9px]' : 'fa-solid fa-chevron-down text-[9px]';
}

// ── Chart tab switching ───────────────────────────────────────────────────────
let currentTab = 'top';
let showAll    = false;

function switchTab(tab) {
  currentTab = tab;
  const tabs = ['top', 'trending', 'recent'];
  tabs.forEach(t => {
    const pane = document.getElementById(`chart-tab-${t}`);
    const btn  = document.getElementById(`tab-btn-${t}`);
    if (pane) pane.classList.toggle('hidden', t !== tab);
    if (btn) {
      btn.classList.toggle('chart-tab-active',   t === tab);
      btn.classList.toggle('chart-tab-inactive', t !== tab);
    }
  });
}

function toggleShowMore()  { toggleTopShowMore(); }

// ── Mode switching ────────────────────────────────────────────────────────────
function switchMode(mode) {
  window.currentMode = mode;
  const isInd = mode === 'individual';
  const base  = 'flex-1 py-2.5 px-3 text-sm font-semibold rounded-lg transition-all duration-200 ';
  document.getElementById('mode-individual').className = base + (isInd ? 'mode-tab-active' : 'mode-tab-inactive');
  document.getElementById('mode-profile').className    = base + (!isInd ? 'mode-tab-active' : 'mode-tab-inactive');

  const input = document.getElementById('search-input');
  const tip   = document.getElementById('search-tip');
  const prof  = document.getElementById('profile-section');

  if (isInd) {
    input.placeholder = placeholders[phIdx];
    if (tip)  tip.classList.remove('hidden');
    if (prof) prof.classList.add('hidden');
    document.getElementById('search-results').classList.add('hidden');
  } else {
    input.placeholder = 'Steam URL, Steam64 ID, or username…';
    if (tip)  tip.classList.add('hidden');
    if (prof) { prof.classList.remove('hidden'); renderProfileEmpty(); }
    document.getElementById('search-results').classList.add('hidden');
  }
}

// ── Live chart ticker ─────────────────────────────────────────────────────────
let _liveLastUpdated = Date.now();

function _tickLiveLabel() {
  const el = document.getElementById('live-updated');
  if (!el) return;
  const sec = Math.floor((Date.now() - _liveLastUpdated) / 1000);
  if (sec < 15)      el.textContent = 'just now';
  else if (sec < 60) el.textContent = `${sec}s ago`;
  else               el.textContent = `${Math.floor(sec / 60)}m ago`;
}

function _updateChartLive() {
  topGames.forEach(g => {
    const base  = parseInt(String(g.downloads).replace(/,/g, '').replace(' downloads', '')) || 0;
    const delta = Math.floor(Math.random() * 4);
    g.downloads = (base + delta).toLocaleString() + ' downloads';
  });
  _liveLastUpdated = Date.now();
  renderTopList();
  renderTrendingList();
  const el = document.getElementById('live-updated');
  if (el) el.textContent = 'just now';
}

// ── Load full game database ───────────────────────────────────────────────────
function _updateStatCount(count) {
  const statEl = document.getElementById('stat-games');
  if (statEl) statEl.textContent = count.toLocaleString();
}

async function _loadGameDatabase() {
  const el = document.getElementById('db-count');
  try {
    const res  = await fetch('/data/games.json');
    const data = await res.json();
    window.allGames = data;
    if (el) el.textContent = `${data.length.toLocaleString()} games`;
    _updateStatCount(data.length);
    window.openGameFromQuery?.();
  } catch {
    try {
      const res  = await fetch('/data/stats.json');
      const data = await res.json();
      if (el && data.totalGames) el.textContent = `${data.totalGames.toLocaleString()} games`;
      if (data.totalGames) _updateStatCount(data.totalGames);
      window.openGameFromQuery?.();
    } catch {
      if (el) {
        el.textContent = 'catalog unavailable';
        el.classList.add('db-count-err');
      }
      window.openGameFromQuery?.();
    }
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderGames();
  window.openGameFromQuery?.();
  _loadGameDatabase();
  setInterval(cyclePlaceholder,  3500);
  setInterval(_updateChartLive, 60000);
  setInterval(_tickLiveLabel,   10000);
});
