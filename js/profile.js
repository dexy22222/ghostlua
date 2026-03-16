// ── Profile State ─────────────────────────────────────────────────────────────
let _ps = {
  steamId64:  null,
  name:       null,
  avatar:     null,
  isPublic:   false,
  currentTab: 'overview',
  inGameName: '',
  inGameAppId:'',
  hoursWeek:  '',
  gamesCount: undefined,
  totalHours: undefined,
  mostPlayed: null,
  games:      null,
  friends:    null,
  wishlist:   null,
};

window._lastProfileGames = null;

// ── Empty / placeholder state ─────────────────────────────────────────────────
function renderProfileEmpty() {
  const prof = document.getElementById('profile-section');
  if (!prof) return;
  prof.innerHTML = `
    <div class="text-center py-7 text-slate-600">
      <i class="fa-brands fa-steam text-[2.5rem] mb-3 block" style="color:#334155"></i>
      <p class="text-sm font-medium text-slate-500">Track your Steam profile</p>
      <p class="text-xs mt-1 text-slate-700">Enter your Steam URL or ID above, then press Enter</p>
    </div>`;
}

// ── Tab bar HTML ──────────────────────────────────────────────────────────────
function _renderTabBar(activeTab) {
  const tabs = [
    { id: 'overview', icon: 'fa-user',       label: 'Overview' },
    { id: 'games',    icon: 'fa-gamepad',     label: 'Games'    },
    { id: 'friends',  icon: 'fa-user-group',  label: 'Friends'  },
    { id: 'wishlist', icon: 'fa-bookmark',    label: 'Wishlist' },
  ];
  return `
    <div class="ptab-bar">
      ${tabs.map(t => `
        <button onclick="switchProfileTab('${t.id}')"
          class="ptab-btn ${activeTab === t.id ? 'ptab-active' : 'ptab-inactive'}" data-tab="${t.id}">
          <i class="fa-solid ${t.icon} text-[8px]"></i>${t.label}
        </button>`).join('')}
    </div>`;
}

// ── Switch tab ────────────────────────────────────────────────────────────────
function switchProfileTab(tab) {
  _ps.currentTab = tab;

  // Update button styles
  document.querySelectorAll('.ptab-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tab;
    btn.className = `ptab-btn ${isActive ? 'ptab-active' : 'ptab-inactive'}`;
  });

  const content = document.getElementById('ptab-content');
  if (!content) return;

  switch (tab) {
    case 'overview': _loadOverviewTab(content); break;
    case 'games':    _loadGamesTab(content);    break;
    case 'friends':  _loadFriendsTab(content);  break;
    case 'wishlist': _loadWishlistTab(content);  break;
  }
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function _loadOverviewTab(content) {
  let html = '';

  // In-game banner
  if (_ps.inGameName) {
    const ig = _ps.inGameAppId;
    html += `
      <div class="flex items-center gap-2.5 mb-3 px-2.5 py-2 rounded-xl bg-teal-500/[0.07] border border-teal-500/20">
        ${ig ? `<img src="${steamImg(ig)}" class="w-12 h-[22px] rounded-md object-cover flex-shrink-0 shadow" onerror="this.style.display='none'" />` : `<i class="fa-solid fa-gamepad text-teal-400/50 text-base flex-shrink-0"></i>`}
        <div class="flex-1 min-w-0">
          <div class="text-[8px] text-teal-400 font-bold uppercase tracking-widest">Currently In-Game</div>
          <div class="text-[11px] text-teal-200 truncate font-medium mt-0.5">${_ps.inGameName}</div>
        </div>
        ${ig ? `<button onclick="quickDownload(${ig},${_jqAttr(_ps.inGameName)},'','',[])"
          class="flex-shrink-0 text-[9px] px-2 py-1 bg-teal-600/20 text-teal-300 border border-teal-500/30 rounded-lg font-semibold hover:bg-teal-600/35 transition-colors">Get</button>` : ''}
      </div>`;
  }

  // Stats row
  const hrsStr = _ps.totalHours !== undefined
    ? (_ps.totalHours >= 1000 ? (_ps.totalHours / 1000).toFixed(1) + 'k' : Math.round(_ps.totalHours).toLocaleString())
    : null;

  if (_ps.gamesCount !== undefined || hrsStr || (_ps.hoursWeek && parseFloat(_ps.hoursWeek) > 0)) {
    html += `<div class="grid grid-cols-3 gap-1.5 mb-3">`;
    html += _ps.gamesCount !== undefined
      ? `<div class="text-center py-1.5 rounded-lg bg-white/[0.025] border border-white/[0.04]">
           <div class="text-sm font-bold text-slate-100">${_ps.gamesCount.toLocaleString()}</div>
           <div class="text-[8px] text-slate-600 uppercase tracking-wider mt-0.5">Games</div>
         </div>`
      : `<div></div>`;
    html += hrsStr
      ? `<div class="text-center py-1.5 rounded-lg bg-white/[0.025] border border-white/[0.04]">
           <div class="text-sm font-bold text-slate-100">${hrsStr}</div>
           <div class="text-[8px] text-slate-600 uppercase tracking-wider mt-0.5">Hours</div>
         </div>`
      : `<div></div>`;
    html += (_ps.hoursWeek && parseFloat(_ps.hoursWeek) > 0)
      ? `<div class="text-center py-1.5 rounded-lg bg-white/[0.025] border border-white/[0.04]">
           <div class="text-sm font-bold text-teal-400">${parseFloat(_ps.hoursWeek).toFixed(0)}</div>
           <div class="text-[8px] text-slate-600 uppercase tracking-wider mt-0.5">Hrs/2wk</div>
         </div>`
      : `<div></div>`;
    html += `</div>`;
  }

  // Most played
  const mp = _ps.mostPlayed || [];
  if (mp.length > 0) {
    html += `
      <div>
        <span class="text-[10px] font-bold uppercase tracking-widest text-slate-600 block mb-1.5">Most Played</span>
        <div class="space-y-0.5">
          ${mp.map(g => `
            <div class="flex items-center gap-2.5 py-1.5 px-1 hover:bg-white/[0.03] rounded-lg transition-colors group/mp">
              <div class="profile-game-img-wrap flex-shrink-0">
                <img src="${g.appId ? steamImg(g.appId) : g.logo}" loading="lazy" class="profile-game-img" onerror="_prFb(this)" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-[11px] font-medium text-slate-300 truncate">${g.name}</div>
                <div class="text-[9px] text-slate-700">${g.hours > 0 ? g.hours.toFixed(1) + ' hrs' : 'Not played'}</div>
              </div>
              ${g.appId ? `<button onclick="event.stopPropagation();quickDownload(${g.appId},${_jqAttr(g.name)},'','',[])"
                class="flex-shrink-0 text-[9px] px-2 py-0.5 bg-slate-800/60 text-slate-500 group-hover/mp:text-teal-400 group-hover/mp:bg-teal-600/15 group-hover/mp:border-teal-600/30 border border-slate-700/50 rounded-md transition-colors font-semibold">Get</button>` : ''}
            </div>`).join('')}
        </div>
      </div>`;
  }

  if (!html) {
    html = `<div class="text-center py-4 text-slate-600 text-xs">
      <i class="fa-solid fa-info-circle mr-1"></i>No overview data available
    </div>`;
  }

  content.innerHTML = html;
}

// ── Games Tab ─────────────────────────────────────────────────────────────────
function _loadGamesTab(content) {
  if (_ps.games) {
    _renderGamesInTab(content, _ps.games);
    return;
  }

  if (!_ps.isPublic) {
    content.innerHTML = `<div class="text-center py-5 text-slate-600 text-xs">
      <i class="fa-solid fa-lock mr-1 text-slate-700"></i>Games list is private
    </div>`;
    return;
  }

  content.innerHTML = `<div class="flex items-center justify-center gap-2 py-6 text-slate-600 text-xs">
    <i class="fa-solid fa-spinner animate-spin text-teal-400/60"></i> Loading games…
  </div>`;

  loadOwnedGames(_ps.steamId64).then(games => {
    _ps.games      = games;
    _ps.gamesCount = games.length;
    _ps.totalHours = games.reduce((s, g) => s + g.hours, 0);
    window._lastProfileGames = games.slice(0, 200).map(g => ({ appId: g.appId, name: g.name }));
    _renderGamesInTab(content, games);
  }).catch(() => {
    content.innerHTML = `<div class="text-center py-5 text-slate-600 text-xs">
      <i class="fa-solid fa-gamepad mr-1 text-slate-700"></i>Games list unavailable or private
    </div>`;
  });
}

function _renderGamesInTab(content, games) {
  window._lastProfileGames = games.slice(0, 200).map(g => ({ appId: g.appId, name: g.name }));
  const totalHours = games.reduce((s, g) => s + g.hours, 0);
  const totalStr   = totalHours >= 1000 ? (totalHours / 1000).toFixed(1) + 'k' : Math.round(totalHours).toLocaleString();

  content.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <span class="text-[10px] text-slate-600">
        <span class="font-bold text-slate-400">${games.length.toLocaleString()}</span> games ·
        <span class="font-bold text-slate-400">${totalStr}</span> hrs
      </span>
      <button onclick="downloadAllProfileLua(window._lastProfileGames)"
        class="text-[10px] px-2.5 py-1 bg-teal-600/10 text-teal-400 border border-teal-600/20 rounded-full hover:bg-teal-600/20 transition-colors font-semibold">
        <i class="fa-solid fa-download mr-1 text-[8px]"></i>DL All
      </button>
    </div>
    <input type="text" placeholder="Search your games…"
      oninput="_filterProfileGames(this.value)"
      class="w-full mb-2 px-3 py-1.5 text-[11px] rounded-lg bg-slate-900/60 border border-slate-800/60 text-slate-300 placeholder-slate-600 outline-none focus:border-cyan-600/40 transition-colors" />
    <div id="ptab-games-list" class="profile-games-list space-y-0.5 max-h-[280px] overflow-y-auto pr-0.5">
      ${_gamesListHtml(games.slice(0, 150))}
    </div>
    ${games.length > 150 ? `<div class="text-center text-[10px] text-slate-700 py-2">Showing top 150 of ${games.length.toLocaleString()}</div>` : ''}`;
}

function _gamesListHtml(games) {
  return games.map(g => `
    <div class="flex items-center gap-2.5 py-1.5 px-1 hover:bg-white/[0.03] rounded-lg transition-colors group/pg">
      <div class="profile-game-img-wrap flex-shrink-0">
        <img src="${steamImg(g.appId)}" loading="lazy" class="profile-game-img" onerror="_prFb(this)" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-[11px] font-medium text-slate-300 truncate">${g.name}</div>
        <div class="text-[9px] text-slate-700 flex items-center gap-1.5">
          <span>${g.hours > 0 ? g.hours.toFixed(1) + ' hrs' : 'Not played'}</span>
          ${g.lastPlayed ? `<span>·</span><span>${_fmtDate(g.lastPlayed)}</span>` : ''}
        </div>
      </div>
      <button onclick="event.stopPropagation();quickDownload(${g.appId},${_jqAttr(g.name)},'','',[])"
        class="flex-shrink-0 text-[9px] px-2 py-0.5 bg-slate-800/60 text-slate-500 group-hover/pg:text-teal-400 group-hover/pg:bg-teal-600/15 group-hover/pg:border-teal-600/30 border border-slate-700/50 rounded-md transition-colors font-semibold">Get</button>
    </div>`).join('');
}

function _filterProfileGames(query) {
  if (!_ps.games) return;
  const q       = query.toLowerCase().trim();
  const filtered = q ? _ps.games.filter(g => g.name.toLowerCase().includes(q)) : _ps.games.slice(0, 150);
  const el       = document.getElementById('ptab-games-list');
  if (el) el.innerHTML = _gamesListHtml(filtered.slice(0, 150));
}

// ── Friends Tab ───────────────────────────────────────────────────────────────
async function _loadFriendsTab(content) {
  if (_ps.friends) {
    _renderFriendsInTab(content, _ps.friends);
    return;
  }

  content.innerHTML = `<div class="flex items-center justify-center gap-2 py-6 text-slate-600 text-xs">
    <i class="fa-solid fa-spinner animate-spin text-teal-400/60"></i> Loading friends…
  </div>`;

  try {
    const url = `https://steamcommunity.com/profiles/${_ps.steamId64}/friends/?xml=1`;
    const res  = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error('Friends page unavailable');
    const text = await res.text();
    const xml  = new DOMParser().parseFromString(text, 'text/xml');

    const friends = Array.from(xml.querySelectorAll('friends friend')).slice(0, 40).map(f => ({
      steamId64: f.querySelector('steamID64')?.textContent?.trim() || '',
      name:      f.querySelector('steamID')?.textContent?.trim()   || 'Unknown',
      avatar:    f.querySelector('avatarIcon')?.textContent?.trim() || '',
      state:     f.querySelector('onlineState')?.textContent?.trim() || 'offline',
    })).filter(f => f.steamId64);

    if (!friends.length) throw new Error('No friends data — may be private');
    _ps.friends = friends;
    _renderFriendsInTab(content, friends);
  } catch (e) {
    content.innerHTML = `<div class="text-center py-5 text-slate-600 text-xs">
      <i class="fa-solid fa-user-slash mr-1 text-slate-700"></i>${e.message || 'Friends list is private or unavailable'}
    </div>`;
  }
}

function _renderFriendsInTab(content, friends) {
  const dotColor   = s => s === 'online' ? 'bg-emerald-400' : s === 'in-game' ? 'bg-teal-400' : 'bg-slate-600';
  const stateLabel = s => s === 'in-game' ? 'In-Game' : s === 'online' ? 'Online' : 'Offline';
  const stateColor = s => s === 'online' ? 'text-emerald-400' : s === 'in-game' ? 'text-teal-400' : 'text-slate-600';

  // Sort: online + in-game first
  const sorted = [...friends].sort((a, b) => {
    const order = { 'online': 0, 'in-game': 1, 'offline': 2 };
    return (order[a.state] ?? 2) - (order[b.state] ?? 2);
  });
  const onlineCount = friends.filter(f => f.state === 'online' || f.state === 'in-game').length;

  content.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <span class="text-[10px] text-slate-600">
        <span class="font-bold text-slate-400">${friends.length}</span> friends ·
        <span class="font-bold text-emerald-400">${onlineCount}</span> online
      </span>
    </div>
    <div class="space-y-0.5 max-h-[300px] overflow-y-auto profile-games-list">
      ${sorted.map(f => `
        <div class="flex items-center gap-2.5 py-1.5 px-1 hover:bg-white/[0.03] rounded-lg transition-colors group/fr">
          <div class="relative flex-shrink-0">
            <img src="${f.avatar}" alt="${f.name}"
              class="w-7 h-7 rounded-lg object-cover bg-slate-800"
              onerror="this.src='';this.style.opacity='0.1'" />
            <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${dotColor(f.state)} border border-[#0a0f1c]"></span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[11px] font-medium text-slate-300 truncate">${f.name}</div>
            <div class="text-[9px] ${stateColor(f.state)}">${stateLabel(f.state)}</div>
          </div>
          <a href="https://steamcommunity.com/profiles/${f.steamId64}" target="_blank" rel="noopener"
            class="flex-shrink-0 text-[9px] px-2 py-0.5 bg-slate-800/60 text-slate-500 group-hover/fr:text-cyan-400 group-hover/fr:bg-cyan-600/10 group-hover/fr:border-cyan-600/20 border border-slate-700/50 rounded-md transition-colors font-semibold">
            <i class="fa-brands fa-steam text-[9px]"></i>
          </a>
        </div>`).join('')}
    </div>`;
}

// ── Wishlist Tab ──────────────────────────────────────────────────────────────
async function _loadWishlistTab(content) {
  if (_ps.wishlist) {
    _renderWishlistInTab(content, _ps.wishlist);
    return;
  }

  content.innerHTML = `<div class="flex items-center justify-center gap-2 py-6 text-slate-600 text-xs">
    <i class="fa-solid fa-spinner animate-spin text-teal-400/60"></i> Loading wishlist…
  </div>`;

  try {
    const url = `https://store.steampowered.com/wishlist/profiles/${_ps.steamId64}/wishlistdata/?p=0`;
    const res  = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error('Wishlist unavailable');
    const data = await res.json();

    const items = Object.entries(data).map(([appId, g]) => ({
      appId,
      name:     g.name || appId,
      priority: g.priority ?? 999,
      added:    g.added ? new Date(g.added * 1000) : null,
    })).sort((a, b) => a.priority - b.priority).slice(0, 40);

    if (!items.length) throw new Error('Wishlist is empty or private');
    _ps.wishlist = items;
    _renderWishlistInTab(content, items);
  } catch (e) {
    content.innerHTML = `<div class="text-center py-5 text-slate-600 text-xs">
      <i class="fa-solid fa-bookmark mr-1 text-slate-700"></i>${e.message || 'Wishlist is private or empty'}
    </div>`;
  }
}

function _renderWishlistInTab(content, items) {
  content.innerHTML = `
    <div class="mb-2">
      <span class="text-[10px] text-slate-600">
        <span class="font-bold text-slate-400">${items.length}</span> wishlist items
      </span>
    </div>
    <div class="space-y-0.5 max-h-[300px] overflow-y-auto profile-games-list">
      ${items.map((g, i) => `
        <div class="flex items-center gap-2.5 py-1.5 px-1 hover:bg-white/[0.03] rounded-lg transition-colors group/wl">
          <div class="profile-game-img-wrap flex-shrink-0">
            <img src="${steamImg(g.appId)}" loading="lazy" class="profile-game-img" onerror="_prFb(this)" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[11px] font-medium text-slate-300 truncate">${g.name}</div>
            <div class="text-[9px] text-slate-700">#${i + 1}${g.added ? ` · Added ${_fmtDate(g.added)}` : ''}</div>
          </div>
          <button onclick="event.stopPropagation();quickDownload(${g.appId},${_jqAttr(g.name)},'','',[])"
            class="flex-shrink-0 text-[9px] px-2 py-0.5 bg-slate-800/60 text-slate-500 group-hover/wl:text-teal-400 group-hover/wl:bg-teal-600/15 group-hover/wl:border-teal-600/30 border border-slate-700/50 rounded-md transition-colors font-semibold">Get</button>
        </div>`).join('')}
    </div>`;
}

// ── Owned games loader (shared) ───────────────────────────────────────────────
async function loadOwnedGames(steamId64) {
  const url  = `https://steamcommunity.com/profiles/${steamId64}/games/?tab=all`;
  const res  = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error('Games page unavailable');
  const html = await res.text();

  const marker   = 'var rgGames = [';
  const startIdx = html.indexOf(marker);
  if (startIdx === -1) throw new Error('Game data not found — profile may be private');

  let depth = 0, i = startIdx + marker.length - 1;
  for (; i < html.length; i++) {
    if      (html[i] === '[') depth++;
    else if (html[i] === ']') { depth--; if (depth === 0) break; }
  }

  const raw   = JSON.parse(html.slice(startIdx + marker.length - 1, i + 1));
  const games = raw.map(g => ({
    appId:      String(g.appid),
    name:       g.name || '',
    hours:      g.hours_forever ? parseFloat(String(g.hours_forever).replace(/,/g, '')) : 0,
    hoursRecent:g.hours         ? parseFloat(String(g.hours).replace(/,/g, ''))         : 0,
    lastPlayed: g.last_played   ? new Date(g.last_played * 1000)                        : null,
  })).filter(g => g.appId && g.name).sort((a, b) => b.hours - a.hours);

  if (!games.length) throw new Error('No games found');
  return games;
}

// ── Main profile lookup ───────────────────────────────────────────────────────
async function lookupProfile(input) {
  const prof = document.getElementById('profile-section');
  if (!prof) return;
  prof.classList.remove('hidden');

  // Reset state
  _ps = {
    steamId64: null, name: null, avatar: null, isPublic: false,
    currentTab: 'overview', inGameName: '', inGameAppId: '',
    hoursWeek: '', gamesCount: undefined, totalHours: undefined,
    mostPlayed: null, games: null, friends: null, wishlist: null,
  };

  prof.innerHTML = `
    <div class="text-center py-7 flex flex-col items-center gap-2 text-slate-500 text-sm">
      <i class="fa-solid fa-spinner animate-spin text-teal-400 text-lg"></i>
      Looking up profile…
    </div>`;

  try {
    const trimmed = input.trim().replace(/\/$/, '');
    let xmlUrl = '';
    const mProfiles = trimmed.match(/steamcommunity\.com\/profiles\/(\d+)/i);
    const mId       = trimmed.match(/steamcommunity\.com\/id\/([^\/\?]+)/i);
    if (mProfiles)                     xmlUrl = `https://steamcommunity.com/profiles/${mProfiles[1]}/?xml=1`;
    else if (mId)                      xmlUrl = `https://steamcommunity.com/id/${mId[1]}/?xml=1`;
    else if (/^\d{17}$/.test(trimmed)) xmlUrl = `https://steamcommunity.com/profiles/${trimmed}/?xml=1`;
    else                               xmlUrl = `https://steamcommunity.com/id/${trimmed}/?xml=1`;

    const res  = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(xmlUrl)}`);
    const text = await res.text();
    const xml  = new DOMParser().parseFromString(text, 'text/xml');

    const err = xml.querySelector('error');
    if (err) throw new Error(err.textContent || 'Profile not found');

    const get = sel => xml.querySelector(sel)?.textContent?.trim() || '';

    _ps.steamId64   = get('steamID64');
    _ps.name        = get('steamID');
    _ps.avatar      = get('avatarFull') || get('avatarMedium') || '';
    _ps.isPublic    = get('visibilityState') === '3';
    _ps.hoursWeek   = get('hoursPlayed2Wk');
    _ps.inGameName  = xml.querySelector('inGameInfo gameName')?.textContent?.trim() || '';
    const inGameLogo = xml.querySelector('inGameInfo gameLogo')?.textContent?.trim() || '';
    _ps.inGameAppId = inGameLogo.match(/\/apps\/(\d+)\//)?.[1] || '';

    const realname    = get('realname');
    const state       = get('onlineState');
    const memberSince = get('memberSince');
    const location    = get('location');
    const vacBanned   = get('vacBanned') === '1';

    _ps.mostPlayed = Array.from(xml.querySelectorAll('mostPlayedGame')).slice(0, 6).map(g => {
      const logo      = g.querySelector('gameLogo')?.textContent?.trim() || '';
      const appIdMatch = logo.match(/\/apps\/(\d+)\//);
      return {
        appId: appIdMatch ? appIdMatch[1] : null,
        name:  g.querySelector('gameName')?.textContent?.trim() || '',
        logo,
        hours: parseFloat((g.querySelector('hoursOnRecord')?.textContent || '0').replace(/,/g, '')),
      };
    }).filter(g => g.name);

    const dotColor   = state === 'online' ? 'bg-emerald-400' : state === 'in-game' ? 'bg-teal-400' : 'bg-slate-600';
    const stateColor = state === 'online' ? 'text-emerald-400' : state === 'in-game' ? 'text-teal-400' : 'text-slate-500';
    const stateLabel = state === 'in-game' ? 'In-Game' : state === 'online' ? 'Online' : 'Offline';

    prof.innerHTML = `
      ${vacBanned ? `
      <div class="flex items-center gap-2 mb-2.5 px-2.5 py-1.5 rounded-lg bg-red-900/20 border border-red-500/25">
        <i class="fa-solid fa-shield-halved text-red-400 text-[10px]"></i>
        <span class="text-[10px] text-red-400 font-semibold">VAC Banned Account</span>
      </div>` : ''}
      <div class="flex items-start gap-3.5 mb-3">
        <div class="relative flex-shrink-0">
          <img src="${_ps.avatar}" alt="${_ps.name}"
               class="w-[60px] h-[60px] rounded-xl object-cover bg-slate-800 shadow-lg"
               onerror="this.style.opacity='0.2'" />
          <span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${dotColor} border-2 border-[#0a0f1c]"></span>
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5 flex-wrap">
            <div class="text-[15px] font-bold text-white truncate">${_ps.name}</div>
            <a href="https://steamcommunity.com/profiles/${_ps.steamId64}" target="_blank"
               class="flex-shrink-0 text-[8px] px-1.5 py-0.5 bg-slate-800/70 text-slate-600 hover:text-teal-400 border border-slate-700/40 rounded transition-colors" title="Open on Steam">
              <i class="fa-brands fa-steam"></i>
            </a>
          </div>
          ${realname    ? `<div class="text-[10px] text-slate-500 truncate -mt-0.5">${realname}</div>` : ''}
          <div class="text-xs ${stateColor} font-medium mt-0.5">${stateLabel}</div>
          ${location    ? `<div class="text-[10px] text-slate-600 mt-0.5"><i class="fa-solid fa-location-dot text-[9px] mr-1"></i>${location}</div>` : ''}
          ${memberSince ? `<div class="text-[10px] text-slate-600 mt-0.5">Member since ${memberSince}</div>` : ''}
          ${_ps.hoursWeek && parseFloat(_ps.hoursWeek) > 0 ? `<div class="text-[9px] text-teal-500/70 mt-0.5"><i class="fa-solid fa-clock text-[8px] mr-1"></i>${_ps.hoursWeek} hrs past 2 weeks</div>` : ''}
        </div>
      </div>
      ${_renderTabBar('overview')}
      <div id="ptab-content" class="mt-3"></div>`;

    // Load overview immediately
    const ptabContent = document.getElementById('ptab-content');
    if (ptabContent) _loadOverviewTab(ptabContent);

    // Kick off game loading in background to populate stats
    if (_ps.isPublic && !_ps.games) {
      loadOwnedGames(_ps.steamId64).then(games => {
        _ps.games      = games;
        _ps.gamesCount = games.length;
        _ps.totalHours = games.reduce((s, g) => s + g.hours, 0);
        window._lastProfileGames = games.slice(0, 200).map(g => ({ appId: g.appId, name: g.name }));
        // Refresh overview stats if user is still on it
        if (_ps.currentTab === 'overview') {
          const c = document.getElementById('ptab-content');
          if (c) _loadOverviewTab(c);
        }
      }).catch(() => {});
    }

  } catch (err) {
    prof.innerHTML = `
      <div class="text-center py-7 text-slate-500 text-sm">
        <i class="fa-solid fa-circle-exclamation text-amber-500 text-xl mb-2 block"></i>
        <strong class="text-slate-400 block mb-1">Profile not found</strong>
        <span class="text-xs text-slate-600">${err.message || 'Check URL or ID and try again'}</span>
      </div>`;
  }
}

// ── Download all as bundle ────────────────────────────────────────────────────
function downloadAllProfileLua(games) {
  if (!games || !games.length) return;
  const now   = new Date().toISOString().split('T')[0];
  const lines = games.map(g => `addappid(${g.appId}, 1, "") -- ${g.name}`).join('\n');
  const lua   = `-- Generated by GhostLua\n-- Profile Bundle — ${games.length} games\n-- Date: ${now}\n\n${lines}\n`;
  const blob  = new Blob([lua], { type: 'text/plain' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href = url; a.download = 'profile_bundle.lua';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
