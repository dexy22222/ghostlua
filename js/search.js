// Search + filtering + funnel tracking
let searchTimeout = null;
let _lastSearchTrackTs = 0;

function _normalizeType(rawType) {
  const t = String(rawType || '').toLowerCase();
  if (t.includes('dlc')) return 'dlc';
  if (t.includes('tool') || t.includes('software') || t.includes('app')) return 'software';
  return 'game';
}

function _sizeToGb(sizeText) {
  if (!sizeText) return null;
  const m = String(sizeText).match(/([\d.]+)\s*GB/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function _matchesSizeFilter(g) {
  const sf = window._filters?.size || 'any';
  if (sf === 'any') return true;
  const gb = _sizeToGb(g.size);
  if (gb == null) return false;
  if (sf === 'small') return gb <= 10;
  if (sf === 'mid') return gb > 10 && gb <= 50;
  if (sf === 'large') return gb > 50;
  return true;
}

function _matchesTagFilter(g) {
  const tf = window._filters?.tag || 'any';
  if (tf === 'any') return true;
  return (g.tags || []).some(t => t.toLowerCase() === tf.toLowerCase());
}

function _matchesGenreFilter(g) {
  const gf = (window._filters?.genre || '').toLowerCase().trim();
  if (!gf) return true;
  return (g.name || '').toLowerCase().includes(gf) || (g.type || '').toLowerCase().includes(gf) || (g.tags || []).join(' ').toLowerCase().includes(gf);
}

function _matchesContentFilter(g) {
  const cf = window._filters?.content || 'any';
  if (cf === 'any') return true;
  return _normalizeType(g.type) === cf;
}

function _applyFilters(games) {
  return games.filter(g => _matchesContentFilter(g) && _matchesSizeFilter(g) && _matchesTagFilter(g) && _matchesGenreFilter(g));
}

function _scoreLocalGame(g, q) {
  const name = String(g.name || '').toLowerCase();
  if (!name) return 0;
  let score = 0;
  if (name === q) score += 160;
  if (name.startsWith(q)) score += 100;
  if (name.includes(q)) score += 60;
  const words = q.split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (name.includes(w)) score += 18;
  }
  const tagsText = (g.tags || []).join(' ').toLowerCase();
  if (tagsText.includes(q)) score += 16;
  return score;
}

function _searchLocalCatalog(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q || !window.allGames?.length) return [];

  const ranked = [];
  for (const g of window.allGames) {
    const score = _scoreLocalGame(g, q);
    if (!score) continue;
    ranked.push({
      ...g,
      type: _normalizeType(g.type),
      source: 'catalog',
      score,
      price: 'Catalog',
    });
  }

  ranked.sort((a, b) => b.score - a.score || String(a.name).localeCompare(String(b.name)));
  return ranked.slice(0, 24);
}

async function _searchSteamRemote(query) {
  try {
    const res = await fetch(`/api/steam/search?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      return (data.items || []).slice(0, 10).map(item => ({
        name: item.name,
        appId: item.id,
        type: _normalizeType(item.type || 'game'),
        price: item.price?.final_formatted || 'Free',
        size: '',
        tags: [],
        source: 'steam',
      }));
    }
  } catch (_) {}

  const storeUrl = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=US`;
  const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(storeUrl)}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error('Search unavailable');

  const data = await res.json();
  return (data.items || []).slice(0, 10).map(item => ({
    name: item.name,
    appId: item.id,
    type: _normalizeType(item.type || 'game'),
    price: item.price?.final_formatted || 'Free',
    size: '',
    tags: [],
    source: 'steam',
  }));
}

async function searchSteam(query) {
  const local = _searchLocalCatalog(query);
  if (local.length >= 10) return local.slice(0, 10);

  let remote = [];
  try {
    remote = await _searchSteamRemote(query);
  } catch (_) {}

  const seen = new Set();
  const merged = [];
  for (const g of [...local, ...remote]) {
    const k = String(g.appId);
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(g);
    if (merged.length >= 14) break;
  }
  return merged;
}

function _resultMetaText(g) {
  const parts = [];
  if (g.type) parts.push(_normalizeType(g.type));
  if (g.size) parts.push(g.size);
  else if (g.price) parts.push(g.price);
  if (g.source === 'catalog') parts.push('Catalog');
  return parts.join(' · ');
}

function _renderResult(g) {
  const info = g.price || g.downloads || 'Catalog';
  return `
    <div class="search-result-item"
         onclick="quickDownload(${g.appId}, ${_jqAttr(g.name)}, ${_jqAttr(info)}, ${_jqAttr(g.size || '')}, ${_jqAttr(g.tags || [])})">
      <div class="search-result-img-wrap">
        <img src="${steamImg(g.appId)}" class="search-result-img" alt="" loading="lazy"
             onerror="_srFb(this)" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="search-result-name truncate">${g.name}</div>
        <div class="search-result-meta-row">${_resultMetaText(g)}</div>
        <div class="search-result-tags">${(g.tags || []).slice(0, 2).map(t => `<span class="game-tag game-tag-${String(t).toLowerCase().replace(/\s+/g, '-')}">${t}</span>`).join('')}</div>
      </div>
      <button class="dl-pill-btn"
              onclick="event.stopPropagation(); quickDownload(${g.appId}, ${_jqAttr(g.name)}, ${_jqAttr(info)}, ${_jqAttr(g.size || '')}, ${_jqAttr(g.tags || [])})">
        <i class="fa-solid fa-download" style="font-size:9px;margin-right:3px;"></i>Get
      </button>
    </div>
  `;
}

function onSearchInput(val) {
  if (window.currentMode === 'profile') return;
  clearTimeout(searchTimeout);

  const q = String(val || '').trim();
  const results = document.getElementById('search-results');
  if (!q) {
    results.classList.add('hidden');
    return;
  }

  const now = Date.now();
  if (now - _lastSearchTrackTs > 1800) {
    window.trackEvent?.('search_input', { query_length: q.length });
    _lastSearchTrackTs = now;
  }

  results.classList.remove('hidden');
  results.innerHTML = `
    <div class="px-4 py-3 text-xs text-neutral-500 flex items-center gap-2">
      <i class="fa-solid fa-spinner animate-spin text-neutral-400 text-[10px]"></i> Searching Steam...
    </div>`;

  searchTimeout = setTimeout(async () => {
    try {
      let games = await searchSteam(q);
      games = _applyFilters(games);

      if (!games.length) {
        results.innerHTML = `
          <div class="px-4 py-4 text-xs text-neutral-500 text-center">
            No results for <strong class="text-neutral-400">"${q}"</strong>
          </div>`;
        window.trackEvent?.('search_results', { query_length: q.length, count: 0 });
        return;
      }

      results.innerHTML = games.map(_renderResult).join('');
      const fromCatalog = games.filter(g => g.source === 'catalog').length;
      window.trackEvent?.('search_results', {
        query_length: q.length,
        count: games.length,
        catalog_hits: fromCatalog,
      });
    } catch {
      results.innerHTML = `
        <div class="px-4 py-3 text-xs text-neutral-500 text-center">
          <i class="fa-solid fa-circle-exclamation text-neutral-400 mr-1.5"></i>
          Search unavailable -
          <button onclick="doSearch()" class="text-neutral-300 hover:underline">retry</button>
        </div>`;
      window.trackEvent?.('search_error', { query_length: q.length });
    }
  }, 180);
}

function doSearch() {
  const val = document.getElementById('search-input').value.trim();
  if (!val) return;
  if (window.currentMode === 'profile') {
    lookupProfile(val);
    return;
  }
  onSearchInput(val);
}

// Filter panel state
window._filters = { content: 'any', size: 'any', tag: 'any', genre: '' };

function toggleFilter() {
  const panel = document.getElementById('filter-panel');
  const btn = document.getElementById('filter-toggle-btn');
  if (!panel) return;
  const isHidden = panel.classList.contains('hidden');
  panel.classList.toggle('hidden', !isHidden);
  if (btn) btn.classList.toggle('text-neutral-300', isHidden);
}

function setFilter(type, val) {
  window._filters[type] = val;
  const group = document.getElementById('filter-' + type);
  if (group) {
    group.querySelectorAll('.filter-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.val === val);
    });
  }
  window.trackEvent?.('filter_changed', { type, value: val });
  applyFiltersToResults();
}

function resetFilters() {
  window._filters = { content: 'any', size: 'any', tag: 'any', genre: '' };
  document.querySelectorAll('.filter-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.val === 'any');
  });
  const gi = document.getElementById('filter-genre');
  if (gi) gi.value = '';
  window.trackEvent?.('filters_reset', {});
  applyFiltersToResults();
}

function applyFiltersToResults() {
  const genre = (document.getElementById('filter-genre')?.value || '').toLowerCase().trim();
  window._filters.genre = genre;
  const val = document.getElementById('search-input')?.value.trim();
  if (val) onSearchInput(val);
}

function randomGame() {
  const all = window.allGames?.length
    ? window.allGames
    : [...(window.topGames || []), ...(window.trendingGames || [])];
  if (!all.length) return;

  const g = all[Math.floor(Math.random() * all.length)];
  window.trackEvent?.('random_game', { appId: g.appId, source_size: all.length });
  quickDownload(g.appId, g.name, g.downloads || 'Trending', g.size || '', g.tags || []);
}

// Close search results on outside click or Escape
document.addEventListener('click', e => {
  const results = document.getElementById('search-results');
  const input = document.getElementById('search-input');
  if (results && !results.contains(e.target) && e.target !== input) {
    results.classList.add('hidden');
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('search-results')?.classList.add('hidden');
    document.getElementById('search-input')?.blur();
  }
});

// Placeholder cycling
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
