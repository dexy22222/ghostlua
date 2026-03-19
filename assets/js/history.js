// ── Download History ──────────────────────────────────────────────────────────
function saveToHistory(name, appId) {
  try {
    const h = JSON.parse(localStorage.getItem('gl_history') || '[]');
    h.unshift({ name, appId, date: new Date().toLocaleDateString() });
    localStorage.setItem('gl_history', JSON.stringify(h.slice(0, 50)));
  } catch {}
}

function toggleHistory() {
  const h = JSON.parse(localStorage.getItem('gl_history') || '[]');
  document.getElementById('modal-title').textContent = 'Download History';
  document.getElementById('modal-content').innerHTML = h.length
    ? h.map(e => `
        <div class="flex items-center gap-3 py-2.5 border-b border-slate-800/80 last:border-0">
          <img src="${steamImg(e.appId)}" loading="lazy"
               class="w-12 h-7 rounded object-cover bg-slate-800 flex-shrink-0"
               onerror="this.style.display='none'" />
          <div class="flex-1 min-w-0">
            <div class="text-sm text-slate-200 truncate">${e.name}</div>
            <div class="text-xs text-slate-500">${e.date}</div>
          </div>
          <button onclick="quickDownload(${e.appId}, ${_jqAttr(e.name)}, 'Re-download', '', [])"
            class="text-[11px] text-teal-400 hover:text-teal-300 flex-shrink-0 font-semibold">↓ Again</button>
        </div>`).join('')
    : '<p class="text-slate-500 text-sm">No downloads yet.</p>';
  document.getElementById('generic-modal').classList.remove('hidden');
}

// ── Favorites ─────────────────────────────────────────────────────────────────
function getFavorites() {
  try { return JSON.parse(localStorage.getItem('gl_favorites') || '[]'); } catch { return []; }
}
function isFavorite(appId) {
  return getFavorites().some(f => String(f.appId) === String(appId));
}
function toggleFavorite(appId, name) {
  const favs = getFavorites();
  const idx  = favs.findIndex(f => String(f.appId) === String(appId));
  if (idx >= 0) favs.splice(idx, 1);
  else          favs.unshift({ appId: String(appId), name });
  localStorage.setItem('gl_favorites', JSON.stringify(favs.slice(0, 100)));
  renderGames();
}

function showFavorites() {
  const favs = getFavorites();
  document.getElementById('modal-title').textContent = '⭐ Starred Games';
  document.getElementById('modal-content').innerHTML = favs.length
    ? favs.map(e => `
        <div class="flex items-center gap-3 py-2.5 border-b border-slate-800/80 last:border-0">
          <img src="${steamImg(e.appId)}" loading="lazy"
               class="w-12 h-7 rounded object-cover bg-slate-800 flex-shrink-0"
               onerror="this.style.display='none'" />
          <div class="flex-1 min-w-0">
            <div class="text-sm text-slate-200 truncate">${e.name}</div>
            <div class="text-xs text-slate-600 font-mono">AppID: ${e.appId}</div>
          </div>
          <button onclick="quickDownload(${e.appId}, ${_jqAttr(e.name)}, '', '', [])"
            class="text-[11px] text-teal-400 hover:text-teal-300 flex-shrink-0 font-semibold mr-2">↓ Get</button>
          <button onclick="toggleFavorite(${e.appId}, ${_jqAttr(e.name)}); showFavorites();"
            class="text-[11px] text-slate-600 hover:text-red-400 flex-shrink-0 transition-colors" title="Remove">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>`).join('')
    : `<div class="text-center py-6 text-slate-600">
        <i class="fa-regular fa-star text-slate-700 text-3xl block mb-2"></i>
        <p class="text-sm text-slate-500">No starred games yet.</p>
        <p class="text-xs mt-1">Click the ★ on any game to save it here.</p>
      </div>`;
  document.getElementById('generic-modal').classList.remove('hidden');
}
