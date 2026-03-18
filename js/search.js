// ── Steam Search ──────────────────────────────────────────────────────────────
let searchTimeout = null;

async function searchSteam(query) {
  // 1. Try server-side proxy (works locally with server.js + Steam API key)
  try {
    const res = await fetch(`/api/steam/search?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.items?.length) {
        return data.items.slice(0, 10).map(item => ({
          name:  item.name,
          appId: item.id,
          type:  item.type || 'game',
          price: item.price?.final_formatted || 'Free',
        }));
      }
    }
  } catch (_) {}

  // 2. Fallback: direct store search via allorigins (Cloudflare deployment)
  const storeUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`;
  const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(storeUrl)}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error('Search unavailable');
  const data = await res.json();
  return (data.items || []).slice(0, 10).map(item => ({
    name:  item.name,
    appId: item.id,
    type:  item.type || 'game',
    price: item.price?.final_formatted || 'Free',
  }));
}

function onSearchInput(val) {
  if (window.currentMode === 'profile') return;
  clearTimeout(searchTimeout);
  const results = document.getElementById('search-results');
  if (!val.trim()) { results.classList.add('hidden'); return; }

  results.classList.remove('hidden');
  results.innerHTML = `
    <div class="px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
      <i class="fa-solid fa-spinner animate-spin text-teal-400 text-[10px]"></i> Searching Steam…
    </div>`;

  searchTimeout = setTimeout(async () => {
    try {
      let games = await searchSteam(val);
      // Apply genre filter (client-side on type field)
      const gf = (window._filters?.genre || '').toLowerCase();
      if (gf) games = games.filter(g => (g.type || '').toLowerCase().includes(gf) || g.name.toLowerCase().includes(gf));
      if (!games.length) {
        results.innerHTML = `
          <div class="px-4 py-4 text-xs text-slate-500 text-center">
            No results for <strong class="text-slate-400">"${val}"</strong>
          </div>`;
        return;
      }
      results.innerHTML = games.map(g => `
        <div class="search-result-item"
             onclick="quickDownload(${g.appId}, ${_jqAttr(g.name)}, ${_jqAttr(g.price)}, '', [])">
          <div class="search-result-img-wrap">
            <img src="${steamImg(g.appId)}" class="search-result-img" alt="" loading="lazy"
                 onerror="_srFb(this)" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="search-result-name truncate">${g.name}</div>
            <div class="text-[10px] text-slate-600 mt-0.5 capitalize">${g.type} · ${g.price}</div>
          </div>
          <button class="dl-pill-btn"
                  onclick="event.stopPropagation(); quickDownload(${g.appId}, ${_jqAttr(g.name)}, ${_jqAttr(g.price)}, '', [])">
            <i class="fa-solid fa-download" style="font-size:9px;margin-right:3px;"></i>Get
          </button>
        </div>
      `).join('');
    } catch {
      results.innerHTML = `
        <div class="px-4 py-3 text-xs text-slate-500 text-center">
          <i class="fa-solid fa-circle-exclamation text-amber-500/70 mr-1.5"></i>
          Search unavailable —
          <button onclick="doSearch()" class="text-teal-400 hover:underline">retry</button>
        </div>`;
    }
  }, 350);
}

function doSearch() {
  const val = document.getElementById('search-input').value.trim();
  if (!val) return;
  if (window.currentMode === 'profile') { lookupProfile(val); return; }
  onSearchInput(val);
}

// ── Filter panel state ────────────────────────────────────────────────────────
window._filters = { reviews: 'any', rating: 'any', meta: 'any', genre: '' };

function toggleFilter() {
  const panel = document.getElementById('filter-panel');
  const btn   = document.getElementById('filter-toggle-btn');
  if (!panel) return;
  const isHidden = panel.classList.contains('hidden');
  panel.classList.toggle('hidden', !isHidden);
  if (btn) btn.classList.toggle('text-cyan-400', isHidden);
}

function setFilter(type, val, el) {
  window._filters[type] = val;
  // Update active chip styling
  const group = document.getElementById('filter-' + type);
  if (group) group.querySelectorAll('.filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.val === val);
  });
  applyFiltersToResults();
}

function resetFilters() {
  window._filters = { reviews: 'any', rating: 'any', meta: 'any', genre: '' };
  document.querySelectorAll('.filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.val === 'any');
  });
  const gi = document.getElementById('filter-genre');
  if (gi) gi.value = '';
  applyFiltersToResults();
}

function applyFiltersToResults() {
  const genre = (document.getElementById('filter-genre')?.value || '').toLowerCase().trim();
  window._filters.genre = genre;
  // Re-trigger search if there's a query in the input
  const val = document.getElementById('search-input')?.value.trim();
  if (val) onSearchInput(val);
}

function randomGame() {
  const all = [...(window.topGames || []), ...(window.trendingGames || [])];
  if (!all.length) return;
  const g = all[Math.floor(Math.random() * all.length)];
  quickDownload(g.appId, g.name, g.downloads, g.size || '', g.tags || []);
}

// Close search results on outside click
document.addEventListener('click', e => {
  const results = document.getElementById('search-results');
  const input   = document.getElementById('search-input');
  if (results && !results.contains(e.target) && e.target !== input) {
    results.classList.add('hidden');
  }
});

// ── Placeholder cycling ───────────────────────────────────────────────────────
const placeholders = [
  'Try: Slay the Spire 2', 'Try: Elden Ring', 'Try: Cyberpunk 2077',
  'Try: Hollow Knight', "Try: Baldur's Gate 3", 'Try: Resident Evil 4',
  'Try: Black Desert', 'Try: Palworld', 'Try: Hogwarts Legacy',
];
let phIdx = 0;

function cyclePlaceholder() {
  if (window.currentMode !== 'individual') return;
  phIdx = (phIdx + 1) % placeholders.length;
  const input = document.getElementById('search-input');
  if (input && !input.value) input.placeholder = placeholders[phIdx];
}
