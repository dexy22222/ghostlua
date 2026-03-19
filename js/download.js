// Download modal + SEO game pages + alerts funnel + batch downloads
window.currentDownloadGame = null;
window.selectedGames = new Set();

const _defaultSeo = {
  title: document.title,
  description: document.getElementById('meta-description')?.getAttribute('content') || '',
  ogTitle: document.getElementById('og-title')?.getAttribute('content') || '',
  ogDescription: document.getElementById('og-description')?.getAttribute('content') || '',
  ogUrl: document.getElementById('og-url')?.getAttribute('content') || '',
  canonical: document.getElementById('canonical-link')?.getAttribute('href') || '',
};

function _setMetaById(id, attr, value) {
  const el = document.getElementById(id);
  if (el && value != null) el.setAttribute(attr, value);
}

function _setGameSeo(appId, name) {
  const safeName = String(name || `Steam App ${appId}`);
  const url = new URL(location.href);
  url.searchParams.set('game', String(appId));
  const canonical = `https://ghostlua.com/?game=${encodeURIComponent(appId)}`;

  document.title = `${safeName} (AppID ${appId}) | GhostLua`;
  _setMetaById('meta-description', 'content', `${safeName} - Steam AppID ${appId}. Browse tags, size, and details on GhostLua.`);
  _setMetaById('og-title', 'content', `${safeName} | GhostLua`);
  _setMetaById('og-description', 'content', `Steam AppID ${appId}. Open game details and quick actions.`);
  _setMetaById('og-url', 'content', canonical);
  _setMetaById('canonical-link', 'href', canonical);

  history.replaceState({ ...(history.state || {}), game: appId }, '', url.toString());
}

function _resetSeo() {
  document.title = _defaultSeo.title;
  _setMetaById('meta-description', 'content', _defaultSeo.description);
  _setMetaById('og-title', 'content', _defaultSeo.ogTitle);
  _setMetaById('og-description', 'content', _defaultSeo.ogDescription);
  _setMetaById('og-url', 'content', _defaultSeo.ogUrl);
  _setMetaById('canonical-link', 'href', _defaultSeo.canonical || 'https://ghostlua.com/');

  const url = new URL(location.href);
  if (url.searchParams.has('game')) {
    url.searchParams.delete('game');
    history.replaceState(history.state || {}, '', url.toString());
  }
}

function _setAlertStatus(message, ok = false) {
  const el = document.getElementById('dl-alert-status');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden', 'ok', 'err');
  el.classList.add(ok ? 'ok' : 'err');
}

function _resetAlertBox() {
  const el = document.getElementById('dl-alert-status');
  if (el) {
    el.textContent = '';
    el.classList.add('hidden');
    el.classList.remove('ok', 'err');
  }
}

/** Generate a .lua file for a single appId */
function _generateLuaFile(appId, label, gameName, isMainGame) {
  const now = new Date().toISOString().split('T')[0];
  const safeName = gameName ? String(gameName).trim().slice(0, 200) : `Steam App ${appId}`;

  const lines = [];
  lines.push('-- ═══════════════════════════════════════════════════════════');
  lines.push(`-- GhostLua`);
  lines.push('-- ═══════════════════════════════════════════════════════════');
  lines.push(`-- Game:       ${safeName}`);
  lines.push(`-- Type:       ${isMainGame ? 'Main Game' : 'DLC'}`);
  lines.push(`-- AppID:      ${appId}`);
  lines.push(`-- Generated:  ${now}`);
  lines.push(`-- Source:     ghostlua.com`);
  lines.push('--');
  lines.push('-- Usage: Drag this file onto the floating SteamTools icon,');
  lines.push('--        then right-click → Restart Steam.');
  lines.push('-- ═══════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`addappid(${appId}, 1, "")`);
  lines.push('');
  return lines.join('\n');
}

/** Generate the README.txt that goes inside the zip folder */
function _generateReadme(gameName, appId, dlcCount) {
  const now = new Date().toISOString().split('T')[0];
  const lines = [];
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push(`  GhostLua — ${gameName}`);
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`  Game:      ${gameName}`);
  lines.push(`  AppID:     ${appId}`);
  lines.push(`  DLCs:      ${dlcCount}`);
  lines.push(`  Generated: ${now}`);
  lines.push(`  Total lua files: ${1 + dlcCount}`);
  lines.push('');
  lines.push('─── HOW TO USE ────────────────────────────────────────────');
  lines.push('');
  lines.push('  1. Install SteamTools (download from ghostlua.com guide)');
  lines.push('  2. Open SteamTools — a floating Steam icon appears');
  lines.push('  3. Select ALL the .lua files in this folder');
  lines.push('  4. Drag them onto the floating SteamTools icon');
  lines.push('  5. Right-click the SteamTools icon → Restart Steam');
  lines.push('  6. Open your Steam Library — the game should be there!');
  lines.push('');
  lines.push('─── TROUBLESHOOTING ───────────────────────────────────────');
  lines.push('');
  lines.push('  Game not appearing?');
  lines.push('    → Make sure SteamTools is running (check system tray)');
  lines.push('    → Try restarting Steam again');
  lines.push('    → Run this in PowerShell as admin:');
  lines.push('      irm -useb cdn.openlua.cloud/fix-st.ps1 | iex');
  lines.push('');
  lines.push('  Need help?');
  lines.push('    → Guide: ghostlua.com/guide.html');
  lines.push('    → Discord: discord.gg/ghostlua');
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push(`  Generated by GhostLua — ghostlua.com`);
  lines.push('═══════════════════════════════════════════════════════════');
  lines.push('');
  return lines.join('\r\n');
}

/** Make a safe folder name from a game name */
function _safeFolderName(name, appId) {
  const safe = String(name || '').replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
  return safe ? `${safe} [${appId}]` : `Steam App ${appId}`;
}

// Entry point - called when user clicks a game
function quickDownload(appId, name, info, size, tags) {
  openDownloadModal(appId, name, info, size, tags);
  saveToHistory(name, appId);
  _prepare(appId, size, tags);
}

function _prepare(appId, size, tags) {
  _setModalState('checking');
  setTimeout(() => {
    _updateModalMeta(appId, size || '', tags || []);
    _setModalState('ready');
  }, 420);
}

function _setModalState(state) {
  const checkingEl = document.getElementById('dl-checking');
  const notFoundEl = document.getElementById('dl-not-found');
  const infoEl = document.getElementById('dl-info');
  const statusEl = document.getElementById('dl-status');
  const doneEl = document.getElementById('dl-done');
  const btn = document.getElementById('dl-btn');

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
      btn.style.display = 'flex';
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-download text-xs"></i> Download';
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
        return `<a href="${url}" target="_blank" rel="noopener" class="${cls} dl-tag-link" title="Get Online Fix">${t}</a>`;
      }
      return `<span class="${cls}">${t}</span>`;
    }).join('');
    tagsEl.style.display = tagList.length ? 'flex' : 'none';
  }
}

function openDownloadModal(appId, name, info, size, tags) {
  window.currentDownloadGame = { appId, name, info };

  const img = document.getElementById('dl-img');
  img.src = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;
  img.onerror = function() {
    this.src = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`;
    this.onerror = function() { this.style.opacity = '0.15'; };
  };
  img.style.opacity = '1';

  const srBtn = document.getElementById('dl-steamrip-btn');
  if (srBtn) srBtn.href = `https://steamrip.com/?s=${encodeURIComponent(name)}`;

  document.getElementById('dl-title').textContent = name;

  const dlCount = (info || '').replace(' downloads', '').replace('Trending', '').trim();
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
        return `<a href="${url}" target="_blank" rel="noopener" class="${cls} dl-tag-link" title="Get Online Fix">${t}</a>`;
      }
      return `<span class="${cls}">${t}</span>`;
    }).join('');
    tagsEl.style.display = tagList.length ? 'flex' : 'none';
  }

  const steamLink = document.getElementById('dl-steam-link');
  if (steamLink) steamLink.href = `https://store.steampowered.com/app/${appId}`;

  document.getElementById('download-modal').classList.remove('hidden');
  document.getElementById('search-results').classList.add('hidden');

  // Show tier usage bar
  const tierBar = document.getElementById('dl-tier-bar');
  if (tierBar && typeof getTierInfo === 'function') {
    tierBar.classList.remove('hidden');
    if (typeof _updateTierBadges === 'function') _updateTierBadges();
  }

  _resetAlertBox();
  _setGameSeo(appId, name);
  window.trackEvent?.('game_opened', { appId, has_tags: !!(tags && tags.length) });
}

function hideDownloadModal() {
  document.getElementById('download-modal').classList.add('hidden');
  window.currentDownloadGame = null;
  _resetSeo();
}

async function subscribeGameAlert(ev) {
  ev?.preventDefault?.();
  if (!window.currentDownloadGame) return;

  const emailEl = document.getElementById('dl-alert-email');
  const btnEl = document.getElementById('dl-alert-btn');
  const email = String(emailEl?.value || '').trim().toLowerCase();
  const appId = window.currentDownloadGame.appId;
  const gameName = window.currentDownloadGame.name;

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    _setAlertStatus('Enter a valid email address.');
    return;
  }

  try {
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.textContent = 'Saving...';
    }

    const res = await fetch('/api/alerts/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, appId, gameName }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) throw new Error(data.error || 'Unable to save alert');

    _setAlertStatus(data.existing ? 'You\'re already subscribed for this game.' : 'Subscribed! We\'ll email you when this game is updated.', true);
    if (emailEl) emailEl.disabled = true;
    window.trackEvent?.('alert_subscribed', { appId, existing: !!data.existing });
  } catch (err) {
    _setAlertStatus(err.message || 'Failed to save alert.');
    window.trackEvent?.('alert_subscribe_error', { appId });
  } finally {
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.textContent = 'Notify Me';
    }
  }
}

/** Download a zip containing a folder with individual .lua files for game + each DLC */
async function startDownload() {
  if (!window.currentDownloadGame) return;

  // Tier limit check
  if (typeof canDownload === 'function' && !canDownload()) {
    showUpgradePrompt();
    return;
  }

  const { appId, name } = window.currentDownloadGame;
  window.trackEvent?.('download_started', { appId });

  const btn = document.getElementById('dl-btn');
  const infoEl = document.getElementById('dl-info');
  const statusEl = document.getElementById('dl-status');
  const progressEl = document.getElementById('dl-progress');
  const statusIcon = document.getElementById('dl-status-icon');
  const statusText = document.getElementById('dl-status-text');
  const pctEl = document.getElementById('dl-percent');

  if (btn) btn.style.display = 'none';
  if (infoEl) infoEl.style.display = 'none';
  if (statusEl) statusEl.style.display = 'block';

  function setProgress(pct, text) {
    if (progressEl) progressEl.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
    if (statusText) statusText.textContent = text;
  }

  try {
    setProgress(10, 'Fetching DLC list from Steam...');

    // Fetch DLC list from our Worker endpoint
    let dlcIds = [];
    try {
      const res = await fetch(`/api/steam/appdetails?appid=${appId}`, {
        signal: AbortSignal.timeout(7000),
      });
      if (res.ok) {
        const data = await res.json();
        dlcIds = Array.isArray(data.dlc) ? data.dlc : [];
      }
    } catch (_) {
      // Fallback: try allorigins proxy directly
      try {
        const storeUrl = `https://store.steampowered.com/api/appdetails/?appids=${appId}&filters=dlc`;
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(storeUrl)}`, {
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          const raw = await res.json();
          dlcIds = raw?.[String(appId)]?.data?.dlc || [];
        }
      } catch (_) {}
    }

    const totalFiles = 1 + dlcIds.length;
    setProgress(30, `Found ${dlcIds.length} DLC(s). Generating ${totalFiles} lua files...`);

    // Build a zip with a named folder containing individual .lua files
    const folderName = _safeFolderName(name, appId);
    const zip = new JSZip();
    const folder = zip.folder(folderName);

    // Main game .lua
    folder.file(`${appId}.lua`, _generateLuaFile(appId, name, name, true));

    // Each DLC gets its own .lua
    for (let i = 0; i < dlcIds.length; i++) {
      folder.file(`${dlcIds[i]}.lua`, _generateLuaFile(dlcIds[i], `DLC ${i + 1}`, name, false));
      if (i % 50 === 0 && i > 0) {
        const pct = 30 + Math.floor((i / dlcIds.length) * 30);
        setProgress(pct, `Generating lua files (${i + 1}/${dlcIds.length} DLCs)...`);
      }
    }

    // Add README with instructions
    folder.file('README.txt', _generateReadme(name, appId, dlcIds.length));

    setProgress(65, 'Compressing...');
    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });

    setProgress(90, 'Starting download...');
    await new Promise(r => setTimeout(r, 120));

    // Trigger download
    const dlUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.style.cssText = 'position:fixed;top:-200px;left:-200px;';
    a.href = dlUrl;
    a.setAttribute('download', `${folderName}.zip`);
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { if (a.parentNode) document.body.removeChild(a); URL.revokeObjectURL(dlUrl); }, 10000);

    setProgress(100, `Done! ${totalFiles} lua file${totalFiles !== 1 ? 's' : ''} + README in folder.`);
    if (statusIcon) statusIcon.className = 'fa-solid fa-circle-check text-emerald-400';
    setTimeout(() => {
      if (statusEl) statusEl.style.display = 'none';
      const doneEl = document.getElementById('dl-done');
      if (doneEl) doneEl.style.display = 'block';
    }, 400);

    // Track download against tier limit
    if (typeof incrementDownloadCount === 'function') incrementDownloadCount();

    window.trackEvent?.('download_completed', { appId, dlc_count: dlcIds.length });
  } catch (err) {
    setProgress(0, 'Download failed. Try again.');
    if (statusIcon) statusIcon.className = 'fa-solid fa-circle-xmark text-red-400';
    setTimeout(() => {
      if (statusEl) statusEl.style.display = 'none';
      if (btn) btn.style.display = 'flex';
      if (infoEl) infoEl.style.display = 'block';
    }, 1500);
  }
}

/** Batch download — multiple games as separate .lua files in a zip (requires Pro/Master) */
async function downloadBatchZip() {
  if (window.selectedGames.size === 0) {
    alert('No games selected for batch download');
    return;
  }

  // Batch downloads require Pro or Master
  if (typeof canBatchDownload === 'function' && !canBatchDownload()) {
    if (typeof showUpgradePrompt === 'function') showUpgradePrompt('batch');
    return;
  }

  const appIds = Array.from(window.selectedGames);

  let btn;
  let headerBtn;
  let originalBatchText = 'Download Selected';
  let originalHeaderText = 'Download Selected (0)';

  try {
    btn = document.getElementById('batch-download-btn');
    headerBtn = document.getElementById('header-batch-btn');
    originalBatchText = btn ? btn.textContent : originalBatchText;
    originalHeaderText = headerBtn ? headerBtn.textContent : originalHeaderText;

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner animate-spin text-xs"></i> Generating lua files...';
    }
    if (headerBtn) {
      headerBtn.disabled = true;
      headerBtn.innerHTML = '<i class="fa-solid fa-spinner animate-spin text-xs"></i> Generating...';
    }

    // Fetch details + DLCs for each game, then generate lua files
    const gameData = await Promise.all(
      appIds.map(async (appId) => {
        let gameName = `Steam App ${appId}`;
        let dlcIds = [];
        try {
          const response = await fetch(`/api/steam/appdetails?appid=${appId}`, {
            signal: AbortSignal.timeout(10000),
          });
          const data = await response.json();
          gameName = data.name || gameName;
          dlcIds = Array.isArray(data.dlc) ? data.dlc : [];
        } catch (error) {
          console.error(`Failed to fetch details for AppID ${appId}:`, error);
        }
        return { appId, name: gameName, dlcIds };
      })
    );

    const zip = new JSZip();
    const now = new Date().toISOString().split('T')[0];

    for (const { appId, name: gameName, dlcIds } of gameData) {
      const folderName = _safeFolderName(gameName, appId);
      const folder = zip.folder(folderName);
      folder.file(`${appId}.lua`, _generateLuaFile(appId, gameName, gameName, true));
      for (let i = 0; i < dlcIds.length; i++) {
        folder.file(`${dlcIds[i]}.lua`, _generateLuaFile(dlcIds[i], `DLC ${i + 1}`, gameName, false));
      }
      folder.file('README.txt', _generateReadme(gameName, appId, dlcIds.length));
    }

    // Generate and download zip
    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.style.cssText = 'position:fixed;top:-200px;left:-200px;';
    a.href = url;
    a.setAttribute('download', `ghostlua-batch-${now}.zip`);
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 10000);

    window.trackEvent?.('batch_download_completed', { count: appIds.length });
  } catch (error) {
    console.error('Batch download failed:', error);
    alert('Batch download failed. Please try again.');
    window.trackEvent?.('batch_download_error', { count: appIds.length });
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalBatchText;
    }
    if (headerBtn) {
      headerBtn.disabled = false;
      headerBtn.textContent = originalHeaderText;
    }
    updateBatchDownloadButton();
  }
}

function toggleGameSelection(appId) {
  if (window.selectedGames.has(appId)) {
    window.selectedGames.delete(appId);
  } else {
    window.selectedGames.add(appId);
  }
  updateBatchDownloadButton();
}

function updateBatchDownloadButton() {
  const btn = document.getElementById('batch-download-btn');
  const headerBtn = document.getElementById('header-batch-btn');
  const count = window.selectedGames.size;

  if (btn) {
    btn.textContent = count > 0 ? `Download Selected (${count})` : 'Download Selected';
    btn.disabled = count === 0;
    btn.classList.toggle('opacity-50', count === 0);
    btn.classList.toggle('cursor-not-allowed', count === 0);
  }

  if (headerBtn) {
    headerBtn.textContent = count > 0 ? `Download Selected (${count})` : 'Download Selected (0)';
    headerBtn.disabled = count === 0;
    headerBtn.classList.toggle('opacity-50', count === 0);
    headerBtn.classList.toggle('cursor-not-allowed', count === 0);
  }
}

function clearSelection() {
  window.selectedGames.clear();
  document.querySelectorAll('.game-checkbox').forEach(cb => cb.checked = false);
  updateBatchDownloadButton();
}

function openGameFromQuery() {
  const url = new URL(location.href);
  const gameParam = url.searchParams.get('game');
  if (!gameParam) return;
  const appId = Number(gameParam);
  if (!Number.isFinite(appId)) return;

  const pool = [
    ...(window.allGames || []),
    ...(window.topGames || []),
    ...(window.trendingGames || []),
  ];
  const g = pool.find(x => Number(x.appId) === appId);
  if (!g) return;

  quickDownload(g.appId, g.name || `Steam App ${g.appId}`, g.downloads || 'Catalog', g.size || '', g.tags || []);
  window.trackEvent?.('seo_game_landing', { appId: g.appId });
}

window.subscribeGameAlert = subscribeGameAlert;
window.openGameFromQuery = openGameFromQuery;
window.downloadBatchZip = downloadBatchZip;
window.toggleGameSelection = toggleGameSelection;
window.clearSelection = clearSelection;
