// ── State ─────────────────────────────────────────────────────────────────────
window.currentDownloadGame = null;

// ── Entry point — called when user clicks a game ──────────────────────────────
// Lua files are generated 100% client-side from the AppID, so every Steam
// game is always available — no database check needed.
function quickDownload(appId, name, info, size, tags) {
  openDownloadModal(appId, name, info, size, tags);
  saveToHistory(name, appId);
  _prepare(appId, size, tags);
}

function _prepare(appId, size, tags) {
  // Brief "checking" animation for UX, then immediately go ready
  _setModalState('checking');
  setTimeout(() => {
    _updateModalMeta(appId, size || '', tags || []);
    _setModalState('ready');
  }, 420);
}

// ── Modal state machine ───────────────────────────────────────────────────────
// Uses style.display directly to avoid CSS specificity conflicts with #id rules.
function _setModalState(state) {
  const checkingEl = document.getElementById('dl-checking');
  const notFoundEl = document.getElementById('dl-not-found');
  const infoEl     = document.getElementById('dl-info');
  const statusEl   = document.getElementById('dl-status');
  const doneEl     = document.getElementById('dl-done');
  const btn        = document.getElementById('dl-btn');

  // Hide everything first via style to beat ID-selector CSS specificity
  [checkingEl, notFoundEl, infoEl, statusEl, doneEl].forEach(el => {
    if (el) el.style.display = 'none';
  });

  if (state === 'checking') {
    if (checkingEl) checkingEl.style.display = 'flex';
    if (btn) btn.style.display = 'none';
  } else if (state === 'not-found') {
    if (notFoundEl) notFoundEl.style.display = 'block';
    if (btn) btn.style.display = 'none';
  } else if (state === 'ready') {
    if (infoEl) infoEl.style.display = 'block';
    if (btn) {
      btn.style.display = 'flex'; // override static 'hidden' class
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-download text-xs"></i> Download .lua';
    }
  }
}

function _updateModalMeta(appId, size, tags) {
  const apEl = document.getElementById('dl-appid');
  if (apEl) {
    let meta = `AppID: ${appId}`;
    if (size) meta += ` · ${size}`;
    apEl.textContent = meta;
  }
  const tagsEl = document.getElementById('dl-tags');
  if (tagsEl) {
    const tagList = tags || [];
    const gameName = window.currentDownloadGame ? window.currentDownloadGame.name : '';
    tagsEl.innerHTML = tagList.map(t => {
      const cls = `dl-tag dl-tag-${t.toLowerCase().replace(/\s+/g, '-')}`;
      if (t === 'Online Fix') {
        const url = `https://online-fix.me/?s=${encodeURIComponent(gameName)}`;
        return `<a href="${url}" target="_blank" rel="noopener" class="${cls} dl-tag-link" title="Get Online Fix">🔗 ${t}</a>`;
      }
      return `<span class="${cls}">${t}</span>`;
    }).join('');
    tagsEl.style.display = tagList.length ? 'flex' : 'none';
  }
}

// ── Open / close modal ────────────────────────────────────────────────────────
function openDownloadModal(appId, name, info, size, tags) {
  window.currentDownloadGame = { appId, name, info };

  const img = document.getElementById('dl-img');
  // Try multiple Steam image CDN formats for best coverage
  img.src = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;
  img.onerror = function() {
    this.src = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;
    this.onerror = function() { this.style.opacity = '0.15'; };
  };
  img.style.opacity = '1';

  // Set SteamRip search link
  const srBtn = document.getElementById('dl-steamrip-btn');
  if (srBtn) srBtn.href = `https://steamrip.com/?s=${encodeURIComponent(name)}`;

  document.getElementById('dl-title').textContent = name;

  const dlCount = (info || '').replace(' downloads', '').replace('↑ Trending', '').trim();
  let meta = `AppID: ${appId}`;
  if (size) meta += ` · ${size}`;
  if (dlCount && /^\d/.test(dlCount)) meta += ` · ↓${dlCount}`;
  document.getElementById('dl-appid').textContent = meta;

  const tagsEl = document.getElementById('dl-tags');
  if (tagsEl) {
    const tagList = tags && tags.length ? tags : [];
    tagsEl.innerHTML = tagList.map(t => {
      const cls = `dl-tag dl-tag-${t.toLowerCase().replace(/\s+/g, '-')}`;
      if (t === 'Online Fix') {
        const url = `https://online-fix.me/?s=${encodeURIComponent(name)}`;
        return `<a href="${url}" target="_blank" rel="noopener" class="${cls} dl-tag-link" title="Get Online Fix">🔗 ${t}</a>`;
      }
      return `<span class="${cls}">${t}</span>`;
    }).join('');
    tagsEl.style.display = tagList.length ? 'flex' : 'none';
  }

  const steamLink = document.getElementById('dl-steam-link');
  if (steamLink) steamLink.href = `https://store.steampowered.com/app/${appId}`;

  document.getElementById('download-modal').classList.remove('hidden');
  document.getElementById('search-results').classList.add('hidden');
}

function hideDownloadModal() {
  document.getElementById('download-modal').classList.add('hidden');
  window.currentDownloadGame = null;
}

// ── User clicks the Download button inside the modal ─────────────────────────
function startDownload() {
  if (!window.currentDownloadGame) return;
  const { appId, name } = window.currentDownloadGame;
  generateAndDownloadLua(appId, name);
  _runProgressAnimation();
}

// ── Cosmetic progress animation ───────────────────────────────────────────────
function _runProgressAnimation() {
  const btn        = document.getElementById('dl-btn');
  const infoEl     = document.getElementById('dl-info');
  const statusEl   = document.getElementById('dl-status');
  const progressEl = document.getElementById('dl-progress');
  const statusIcon = document.getElementById('dl-status-icon');
  const statusText = document.getElementById('dl-status-text');
  const pctEl      = document.getElementById('dl-percent');

  if (btn)    btn.style.display  = 'none';
  if (infoEl) infoEl.style.display = 'none';
  statusEl.style.display = 'block';
  if (progressEl) progressEl.style.width = '0%';

  const steps = [
    [30,  250, 'Generating .lua file…'],
    [70,  350, 'Packaging…'],
    [100, 280, 'Done!'],
  ];

  function runStep(i) {
    if (i >= steps.length) {
      if (statusIcon) statusIcon.className = 'fa-solid fa-circle-check text-emerald-400';
      if (statusText) statusText.textContent = 'File downloaded!';
      if (pctEl)      pctEl.textContent = '100%';
      setTimeout(() => {
        statusEl.style.display = 'none';
        document.getElementById('dl-done').style.display = 'block';
      }, 300);
      return;
    }
    const [pct, delay, text] = steps[i];
    if (progressEl) progressEl.style.width = pct + '%';
    if (pctEl)      pctEl.textContent = pct + '%';
    if (statusText) statusText.textContent = text;
    setTimeout(() => runStep(i + 1), delay);
  }
  runStep(0);
}

// ── Lua generator ─────────────────────────────────────────────────────────────
function generateAndDownloadLua(appId, name) {
  const now = new Date().toISOString().split('T')[0];
  const lua = `-- Generated by OpenLua\n-- Game: ${name}\n-- AppID: ${appId}\n-- Date: ${now}\n\naddappid(${appId}, 1, "")\n`;
  const blob = new Blob([lua], { type: 'application/octet-stream' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.style.cssText = 'position:fixed;top:-200px;left:-200px;';
  a.href = url;
  a.setAttribute('download', appId + '.lua');
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (a.parentNode) document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 10000);
}
