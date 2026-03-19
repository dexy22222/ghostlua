// ── Steam community fetch (uses Worker proxy, fallback to external CORS) ──────
async function _fetchWithCors(url) {
  try {
    const res = await fetch(`/api/proxy/steam?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) return res;
  } catch (_) {}
  const proxies = [
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  ];
  let lastErr;
  for (const toProxy of proxies) {
    try {
      const res = await fetch(toProxy(url), { signal: AbortSignal.timeout(12000) });
      if (res.ok) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('Request failed');
}

// ── Profile State ──────────────────────────────────────────────────────────────
let _ps = {
  steamId64: null, name: null, avatar: null, isPublic: false,
  currentTab: 'overview', inGameName: '', inGameAppId: '',
  hoursWeek: '', gamesCount: undefined, totalHours: undefined,
  mostPlayed: null, games: null, friends: null, gamesLoading: false,
  realname: '', state: 0, memberSince: '', location: '', vacBanned: false,
  level: null, badgeCount: null, recentActivity: null,
};

window._lastProfileGames = null;

// ── Empty state ────────────────────────────────────────────────────────────────
function renderProfileEmpty() {
  const prof = document.getElementById('profile-section');
  if (!prof) return;
  prof.innerHTML = `
    <div class="profile-banner p-8 sm:p-10">
      <div class="relative z-10 flex flex-col items-center gap-4">
        <div class="w-20 h-20 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
          <i class="fa-brands fa-steam text-4xl text-neutral-700"></i>
        </div>
        <div class="text-center">
          <p class="text-sm font-semibold text-neutral-400">Enter a Steam ID to get started</p>
          <p class="text-xs mt-1.5 text-neutral-600">Supports Steam64 IDs, vanity URLs, and full profile links</p>
        </div>
      </div>
    </div>`;
}

// ── Steam-style Tab bar ──────────────────────────────────────────────────────
function _renderTabBar(activeTab) {
  const tabs = [
    { id: 'overview', icon: 'fa-user',       label: 'Overview' },
    { id: 'games',    icon: 'fa-gamepad',     label: 'Games'    },
    { id: 'friends',  icon: 'fa-user-group',  label: 'Friends'  },
  ];
  return `
    <div class="steam-tab-bar mt-4">
      ${tabs.map(t => `
        <button onclick="switchProfileTab('${t.id}')" data-tab="${t.id}"
          class="steam-tab ${activeTab === t.id ? 'active' : ''}">
          <i class="fa-solid ${t.icon} text-[9px]"></i>${t.label}
        </button>`).join('')}
    </div>`;
}

// ── Switch tab ─────────────────────────────────────────────────────────────────
function switchProfileTab(tab) {
  _ps.currentTab = tab;
  document.querySelectorAll('.steam-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  const content = document.getElementById('ptab-content');
  if (!content) return;
  switch (tab) {
    case 'overview': _loadOverviewTab(content); break;
    case 'games':    _loadGamesTab(content);    break;
    case 'friends':  _loadFriendsTab(content);  break;
  }
}

// ── Status helpers ──────────────────────────────────────────────────────────────
function _stateInfo(state) {
  const n = typeof state === 'number' ? state : (state === 'online' ? 1 : state === 'in-game' ? 2 : 0);
  if (n === 2) return { dot: 'bg-teal-400', color: 'text-teal-400', label: 'In-Game', ring: 'in-game', badge: 'activity-ingame' };
  if (n === 1) return { dot: 'bg-emerald-400', color: 'text-emerald-400', label: 'Online', ring: '', badge: 'activity-online' };
  return { dot: 'bg-neutral-700', color: 'text-neutral-500', label: 'Offline', ring: 'offline', badge: 'activity-offline' };
}

// ── Overview Tab ───────────────────────────────────────────────────────────────
function _loadOverviewTab(content) {
  let html = '';

  // In-game banner
  if (_ps.inGameName) {
    const ig = _ps.inGameAppId;
    html += `
      <div class="flex items-center gap-3 mb-4 px-3.5 py-3 rounded-xl bg-teal-500/[0.07] border border-teal-500/20 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-teal-500/[0.05] to-transparent pointer-events-none"></div>
        ${ig ? `<img src="${steamImg(ig)}" class="w-16 h-[30px] rounded-md object-cover flex-shrink-0 shadow relative z-10" onerror="this.style.display='none'" />` : `<i class="fa-solid fa-gamepad text-teal-400/50 text-lg flex-shrink-0 relative z-10"></i>`}
        <div class="flex-1 min-w-0 relative z-10">
          <div class="text-[8px] text-teal-400 font-bold uppercase tracking-widest mb-0.5 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>Currently In-Game
          </div>
          <div class="text-[12px] text-teal-200 truncate font-semibold">${_ps.inGameName}</div>
        </div>
      </div>`;
  }

  // Stats grid
  const hrsStr = _ps.totalHours !== undefined
    ? (_ps.totalHours >= 1000 ? (_ps.totalHours / 1000).toFixed(1) + 'k' : Math.round(_ps.totalHours).toLocaleString())
    : null;

  if (_ps.gamesCount !== undefined || hrsStr || (_ps.hoursWeek && parseFloat(_ps.hoursWeek) > 0)) {
    html += `<div class="grid grid-cols-3 gap-2 mb-4">`;
    html += _ps.gamesCount !== undefined
      ? `<div class="stat-card">
           <div class="text-lg font-extrabold text-white">${_ps.gamesCount.toLocaleString()}</div>
           <div class="text-[9px] text-neutral-600 uppercase tracking-wider font-semibold">Games Owned</div>
         </div>` : `<div class="stat-card"><div class="text-lg font-extrabold text-neutral-700">--</div><div class="text-[9px] text-neutral-700 uppercase tracking-wider">Games</div></div>`;
    html += hrsStr
      ? `<div class="stat-card">
           <div class="text-lg font-extrabold text-white">${hrsStr}</div>
           <div class="text-[9px] text-neutral-600 uppercase tracking-wider font-semibold">Total Hours</div>
         </div>` : `<div class="stat-card"><div class="text-lg font-extrabold text-neutral-700">--</div><div class="text-[9px] text-neutral-700 uppercase tracking-wider">Hours</div></div>`;
    html += (_ps.hoursWeek && parseFloat(_ps.hoursWeek) > 0)
      ? `<div class="stat-card">
           <div class="text-lg font-extrabold text-teal-400">${parseFloat(_ps.hoursWeek).toFixed(0)}</div>
           <div class="text-[9px] text-neutral-600 uppercase tracking-wider font-semibold">Hrs / 2 Weeks</div>
         </div>` : `<div class="stat-card"><div class="text-lg font-extrabold text-neutral-700">--</div><div class="text-[9px] text-neutral-700 uppercase tracking-wider">Recent</div></div>`;
    html += `</div>`;
  }

  // Most played with Steam-style game cards
  const mp = _ps.mostPlayed || [];
  if (mp.length > 0) {
    const maxHours = Math.max(...mp.map(g => g.hours), 1);
    html += `
      <div class="mb-1">
        <div class="flex items-center justify-between mb-2.5">
          <span class="text-[9px] font-bold uppercase tracking-widest text-neutral-700">Most Played</span>
          <button onclick="switchProfileTab('games')" class="text-[9px] text-blue-400/60 hover:text-blue-400 font-semibold transition-colors">View All</button>
        </div>
        <div class="space-y-0.5">
          ${mp.map(g => `
            <div class="steam-game-card">
              <img src="${g.appId ? steamImg(g.appId) : g.logo}" loading="lazy" class="game-thumb" onerror="_prFb(this)" />
              <div class="flex-1 min-w-0">
                <div class="text-[11px] font-semibold text-neutral-200 truncate">${g.name}</div>
                <div class="text-[9px] text-neutral-600">${g.hours > 0 ? g.hours.toFixed(1) + ' hrs on record' : 'Not played'}</div>
                <div class="playtime-bar"><div class="playtime-fill" style="width:${Math.round((g.hours / maxHours) * 100)}%"></div></div>
              </div>
              ${g.appId ? `<a href="https://store.steampowered.com/app/${g.appId}" target="_blank" rel="noopener"
                class="flex-shrink-0 text-[9px] px-2.5 py-1 bg-white/[0.04] text-neutral-600 hover:text-neutral-300 hover:bg-white/[0.08] border border-white/[0.06] rounded-md transition-all">
                <i class="fa-brands fa-steam"></i>
              </a>` : ''}
            </div>`).join('')}
        </div>
      </div>`;
  }

  if (!html) {
    if (_ps.gamesLoading && _ps.isPublic) {
      html = `<div class="flex flex-col items-center justify-center gap-2 py-8">
        <div class="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin"></div>
        <span class="text-xs text-neutral-600">Loading profile data...</span>
      </div>`;
    } else if (_ps.isPublic) {
      html = `<div class="text-center py-6 text-neutral-600 text-xs">
        <i class="fa-solid fa-info-circle mr-1 text-neutral-700"></i>
        Overview data is limited. Try the
        <button onclick="switchProfileTab('games')" class="text-blue-400 hover:text-blue-300 font-semibold underline">Games</button> tab.
      </div>`;
    } else {
      html = `<div class="text-center py-6">
        <i class="fa-solid fa-lock text-neutral-700 text-2xl mb-2 block"></i>
        <span class="text-neutral-600 text-xs">This profile is private</span>
      </div>`;
    }
  }

  content.innerHTML = html;
}

// ── Games Tab ──────────────────────────────────────────────────────────────────
function _loadGamesTab(content) {
  if (_ps.games) { _renderGamesInTab(content, _ps.games); return; }
  if (!_ps.isPublic) {
    content.innerHTML = `<div class="text-center py-6">
      <i class="fa-solid fa-lock text-neutral-700 text-xl mb-2 block"></i>
      <span class="text-neutral-600 text-xs">Games list is private</span>
    </div>`;
    return;
  }
  content.innerHTML = `<div class="flex flex-col items-center justify-center gap-2 py-8">
    <div class="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin"></div>
    <span class="text-xs text-neutral-600">Loading games library...</span>
  </div>`;
  loadOwnedGames(_ps.steamId64).then(games => {
    _ps.games = games;
    _ps.gamesCount = games.length;
    _ps.totalHours = games.reduce((s, g) => s + g.hours, 0);
    window._lastProfileGames = games.slice(0, 200).map(g => ({ appId: g.appId, name: g.name }));
    _renderGamesInTab(content, games);
  }).catch(() => {
    content.innerHTML = `<div class="text-center py-6">
      <i class="fa-solid fa-gamepad text-neutral-700 text-xl mb-2 block"></i>
      <span class="text-neutral-600 text-xs">Games list unavailable or private</span>
    </div>`;
  });
}

function _renderGamesInTab(content, games) {
  window._lastProfileGames = games.slice(0, 200).map(g => ({ appId: g.appId, name: g.name }));
  const totalHours = games.reduce((s, g) => s + g.hours, 0);
  const totalStr = totalHours >= 1000 ? (totalHours / 1000).toFixed(1) + 'k' : Math.round(totalHours).toLocaleString();
  const maxHours = Math.max(...games.slice(0, 150).map(g => g.hours), 1);
  content.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-3">
        <span class="text-[10px] text-neutral-500">
          <span class="font-bold text-neutral-300">${games.length.toLocaleString()}</span> games
        </span>
        <span class="text-neutral-800">|</span>
        <span class="text-[10px] text-neutral-500">
          <span class="font-bold text-neutral-300">${totalStr}</span> total hrs
        </span>
      </div>
    </div>
    <div class="relative mb-3">
      <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-neutral-700 text-[10px] pointer-events-none"></i>
      <input type="text" placeholder="Search library..."
        oninput="_filterProfileGames(this.value)"
        class="w-full pl-8 pr-3 py-2 text-[11px] rounded-lg bg-black/40 border border-white/[0.06] text-neutral-300 placeholder-neutral-700 outline-none focus:border-blue-500/30 transition-all" />
    </div>
    <div id="ptab-games-list" class="space-y-0.5 max-h-[320px] overflow-y-auto steam-scroll pr-0.5">
      ${_gamesListHtml(games.slice(0, 150), maxHours)}
    </div>
    ${games.length > 150 ? `<div class="text-center text-[10px] text-neutral-700 py-2 mt-1">Showing top 150 of ${games.length.toLocaleString()}</div>` : ''}`;
}

function _gamesListHtml(games, maxHours) {
  maxHours = maxHours || Math.max(...games.map(g => g.hours), 1);
  return games.map(g => `
    <div class="steam-game-card group/pg">
      <img src="${steamImg(g.appId)}" loading="lazy" class="game-thumb" onerror="_prFb(this)" />
      <div class="flex-1 min-w-0">
        <div class="text-[11px] font-semibold text-neutral-200 truncate">${g.name}</div>
        <div class="text-[9px] text-neutral-600 flex items-center gap-1.5">
          <span>${g.hours > 0 ? g.hours.toFixed(1) + ' hrs' : 'Not played'}</span>
          ${g.lastPlayed ? `<span class="text-neutral-800">·</span><span>${_fmtDate(g.lastPlayed)}</span>` : ''}
        </div>
        <div class="playtime-bar"><div class="playtime-fill" style="width:${Math.round((g.hours / maxHours) * 100)}%"></div></div>
      </div>
      <a href="https://store.steampowered.com/app/${g.appId}" target="_blank" rel="noopener"
        class="flex-shrink-0 opacity-0 group-hover/pg:opacity-100 text-[9px] px-2.5 py-1 bg-white/[0.04] text-neutral-600 hover:text-neutral-300 hover:bg-white/[0.08] border border-white/[0.06] rounded-md transition-all">
        <i class="fa-brands fa-steam"></i>
      </a>
    </div>`).join('');
}

function _filterProfileGames(query) {
  if (!_ps.games) return;
  const q = query.toLowerCase().trim();
  const filtered = q ? _ps.games.filter(g => g.name.toLowerCase().includes(q)) : _ps.games.slice(0, 150);
  const maxHours = Math.max(...filtered.slice(0, 150).map(g => g.hours), 1);
  const el = document.getElementById('ptab-games-list');
  if (el) el.innerHTML = _gamesListHtml(filtered.slice(0, 150), maxHours);
}

// ── Friends Tab ────────────────────────────────────────────────────────────────
async function _loadFriendsTab(content) {
  if (_ps.friends) { _renderFriendsInTab(content, _ps.friends); return; }
  content.innerHTML = `<div class="flex flex-col items-center justify-center gap-2 py-8">
    <div class="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin"></div>
    <span class="text-xs text-neutral-600">Loading friends...</span>
  </div>`;
  try {
    const steamApiFriends = await _loadFriendsViaSteamApi(_ps.steamId64);
    if (steamApiFriends?.length) {
      _ps.friends = steamApiFriends;
      _renderFriendsInTab(content, steamApiFriends);
      return;
    }
  } catch (_) {}
  try {
    const url = `https://steamcommunity.com/profiles/${_ps.steamId64}/friends/?xml=1`;
    const res = await _fetchWithCors(url);
    if (res.ok) {
      const text = await res.text();
      const xml = new DOMParser().parseFromString(text, 'text/xml');
      const friends = Array.from(xml.querySelectorAll('friends friend')).slice(0, 40).map(f => ({
        steamId64: f.querySelector('steamID64')?.textContent?.trim() || '',
        name: f.querySelector('steamID')?.textContent?.trim() || 'Unknown',
        avatar: f.querySelector('avatarIcon')?.textContent?.trim() || '',
        state: f.querySelector('onlineState')?.textContent?.trim() || 'offline',
      })).filter(f => f.steamId64);
      if (friends.length) {
        _ps.friends = friends;
        _renderFriendsInTab(content, friends);
        return;
      }
    }
  } catch (_) {}
  try {
    const url = `https://steamcommunity.com/profiles/${_ps.steamId64}/friends/`;
    const res = await _fetchWithCors(url);
    if (!res.ok) throw new Error('Friends page unavailable');
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const blocks = doc.querySelectorAll('.friend_block_v2, [data-steamid]');
    const friends = [];
    blocks.forEach(block => {
      const sid = block.getAttribute('data-steamid') || '';
      if (!sid || !/^\d{17}$/.test(sid)) return;
      const nameEl = block.querySelector('.friend_block_content .friend_block_persona_name, .friend_block_content');
      const name = nameEl?.textContent?.trim()?.split('\n')[0]?.trim() || 'Unknown';
      const avatarEl = block.querySelector('.player_avatar img, .playerAvatar img');
      const avatar = avatarEl?.getAttribute('src') || '';
      const stateEl = block.querySelector('.friend_small_text, .friend_block_content');
      const stateText = (stateEl?.textContent || '').toLowerCase();
      const state = stateText.includes('in-game') ? 'in-game' : stateText.includes('online') ? 'online' : 'offline';
      friends.push({ steamId64: sid, name, avatar, state });
    });
    if (!friends.length) throw new Error('Friends list is private or empty');
    _ps.friends = friends.slice(0, 40);
    _renderFriendsInTab(content, _ps.friends);
  } catch (e) {
    content.innerHTML = `<div class="text-center py-6">
      <i class="fa-solid fa-user-slash text-neutral-700 text-xl mb-2 block"></i>
      <span class="text-neutral-600 text-xs">${e.message || 'Friends list is private or unavailable'}</span>
    </div>`;
  }
}

function _renderFriendsInTab(content, friends) {
  const si = s => _stateInfo(s);
  const sorted = [...friends].sort((a, b) => {
    const o = { 'online': 0, 'in-game': 1, 'offline': 2 };
    return (o[a.state] ?? 2) - (o[b.state] ?? 2);
  });
  const onlineCount = friends.filter(f => f.state === 'online' || f.state === 'in-game').length;
  content.innerHTML = `
    <div class="flex items-center gap-3 mb-3">
      <span class="text-[10px] text-neutral-500">
        <span class="font-bold text-neutral-300">${friends.length}</span> friends
      </span>
      <span class="flex items-center gap-1 text-[10px]">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        <span class="text-emerald-400 font-bold">${onlineCount}</span>
        <span class="text-neutral-700">online</span>
      </span>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-[320px] overflow-y-auto steam-scroll">
      ${sorted.map(f => {
        const info = si(f.state);
        return `
        <div class="friend-card">
          <div class="relative flex-shrink-0">
            <img src="${f.avatar}" alt="${f.name}" class="w-9 h-9 rounded-lg object-cover bg-neutral-900 shadow" onerror="this.style.opacity='0.1'" />
            <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${info.dot} border-2 border-[#0a0a0a]"></span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[11px] font-semibold text-neutral-300 truncate">${f.name}</div>
            <span class="activity-badge ${info.badge}">
              <span class="w-1 h-1 rounded-full ${info.dot}"></span>${info.label}
            </span>
          </div>
          <a href="https://steamcommunity.com/profiles/${f.steamId64}" target="_blank" rel="noopener"
            class="flex-shrink-0 text-[9px] px-2 py-1 bg-white/[0.04] text-neutral-600 hover:text-neutral-300 hover:bg-white/[0.08] border border-white/[0.06] rounded-md transition-all">
            <i class="fa-solid fa-arrow-up-right-from-square text-[7px]"></i>
          </a>
        </div>`;
      }).join('')}
    </div>`;
}

// ── Steam API helpers ──────────────────────────────────────────────────────────
async function _steamApi(path, params = {}) {
  const url = new URL(path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

async function _resolveSteamId(input) {
  const trimmed = input.trim().replace(/\/$/, '');
  const mProfiles = trimmed.match(/steamcommunity\.com\/profiles\/(\d+)/i);
  const mId = trimmed.match(/steamcommunity\.com\/id\/([^\/\?]+)/i);
  if (mProfiles) return mProfiles[1];
  if (/^\d{17}$/.test(trimmed)) return trimmed;
  if (mId || !/^\d+$/.test(trimmed)) {
    try {
      const vanity = mId ? mId[1] : trimmed;
      const data = await _steamApi('/api/steam/resolve', { vanity });
      if (data?.response?.steamid) return data.response.steamid;
    } catch (_) {}
  }
  return null;
}

async function _loadProfileViaSteamApi(steamId64) {
  const data = await _steamApi('/api/steam/summary', { steamids: steamId64 });
  const players = data?.response?.players;
  if (!players?.length) return null;
  const p = players[0];
  return {
    steamId64,
    name:        p.personaname || 'Unknown',
    avatar:      p.avatarfull || p.avatarmedium || '',
    isPublic:    true,
    hoursWeek:   '',
    inGameName:  p.gameextrainfo || '',
    inGameAppId: p.gameid || '',
    realname:    p.realname || '',
    state:       p.personastate,
    memberSince: '',
    location:    p.loccountrycode ? p.loccountrycode : '',
    vacBanned:   false,
    mostPlayed:  [],
  };
}

async function _loadGamesViaSteamApi(steamId64) {
  const data = await _steamApi('/api/steam/games', { steamid: steamId64 });
  const list = data?.response?.games;
  if (!list?.length) return null;
  return list.map(g => ({
    appId: String(g.appid),
    name: g.name || '',
    hours: (g.playtime_forever || 0) / 60,
    hoursRecent: (g.playtime_2weeks || 0) / 60,
    lastPlayed: g.rtime_last_played ? new Date(g.rtime_last_played * 1000) : null,
  })).filter(g => g.appId && g.name).sort((a, b) => b.hours - a.hours);
}

async function _loadFriendsViaSteamApi(steamId64) {
  const data = await _steamApi('/api/steam/friends', { steamid: steamId64 });
  const list = data?.friendslist?.friends;
  if (!list?.length) return null;
  const ids = list.slice(0, 40).map(f => f.steamid).join(',');
  const summaries = await _steamApi('/api/steam/summary', { steamids: ids });
  const players = summaries?.response?.players || [];
  const byId = Object.fromEntries(players.map(p => [p.steamid, p]));
  return list.map(f => {
    const p = byId[f.steamid];
    const s = p?.personastate;
    const state = s === 0 ? 'offline' : s === 1 ? 'online' : s === 2 ? 'in-game' : 'offline';
    return { steamId64: f.steamid, name: p?.personaname || 'Unknown', avatar: p?.avatarfull || '', state };
  });
}

// ── Owned games loader ─────────────────────────────────────────────────────────
async function loadOwnedGames(steamId64) {
  try {
    const games = await _loadGamesViaSteamApi(steamId64);
    if (games?.length) return games;
  } catch (_) {}
  const url = `https://steamcommunity.com/profiles/${steamId64}/games/?tab=all`;
  const res = await _fetchWithCors(url);
  if (!res.ok) throw new Error('Games page unavailable');
  const html = await res.text();
  const marker = 'var rgGames = [';
  const startIdx = html.indexOf(marker);
  if (startIdx === -1) throw new Error('Game data not found — profile may be private');
  let depth = 0, i = startIdx + marker.length - 1;
  for (; i < html.length; i++) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']') { depth--; if (depth === 0) break; }
  }
  const raw = JSON.parse(html.slice(startIdx + marker.length - 1, i + 1));
  return raw.map(g => ({
    appId: String(g.appid),
    name: g.name || '',
    hours: g.hours_forever ? parseFloat(String(g.hours_forever).replace(/,/g, '')) : 0,
    hoursRecent: g.hours ? parseFloat(String(g.hours).replace(/,/g, '')) : 0,
    lastPlayed: g.last_played ? new Date(g.last_played * 1000) : null,
  })).filter(g => g.appId && g.name).sort((a, b) => b.hours - a.hours);
}

// ── Copy Steam ID ──────────────────────────────────────────────────────────────
function _copySteamId(id) {
  navigator.clipboard.writeText(id).then(() => {
    const btn = document.getElementById('copy-sid-btn');
    if (!btn) return;
    btn.innerHTML = '<i class="fa-solid fa-check text-emerald-400 text-[8px]"></i> Copied!';
    setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy text-[8px]"></i> Copy ID'; }, 1500);
  }).catch(() => {});
}

// ── Main profile lookup ────────────────────────────────────────────────────────
async function lookupProfile(input) {
  const prof = document.getElementById('profile-section');
  if (!prof) return;
  prof.classList.remove('hidden');
  _ps = {
    steamId64: null, name: null, avatar: null, isPublic: false,
    currentTab: 'overview', inGameName: '', inGameAppId: '',
    hoursWeek: '', gamesCount: undefined, totalHours: undefined,
    mostPlayed: null, games: null, friends: null, gamesLoading: false,
    realname: '', state: 0, memberSince: '', location: '', vacBanned: false,
    level: null, badgeCount: null, recentActivity: null,
  };

  // Loading state with shimmer
  prof.innerHTML = `
    <div class="profile-banner p-6 sm:p-8">
      <div class="relative z-10 flex items-center gap-4">
        <div class="w-20 h-20 rounded-2xl shimmer flex-shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="h-5 w-40 rounded-lg shimmer"></div>
          <div class="h-3 w-24 rounded shimmer"></div>
          <div class="h-3 w-32 rounded shimmer"></div>
        </div>
      </div>
      <div class="relative z-10 grid grid-cols-3 gap-2 mt-6">
        <div class="h-16 rounded-xl shimmer"></div>
        <div class="h-16 rounded-xl shimmer"></div>
        <div class="h-16 rounded-xl shimmer"></div>
      </div>
    </div>`;

  try {
    const trimmed = input.trim().replace(/\/$/, '');
    let steamId64 = await _resolveSteamId(trimmed);
    if (!steamId64 && /^\d{17}$/.test(trimmed)) steamId64 = trimmed;

    let profileData = null;
    try { profileData = await _loadProfileViaSteamApi(steamId64); } catch (_) {}

    if (!profileData) {
      const mProfiles = trimmed.match(/steamcommunity\.com\/profiles\/(\d+)/i);
      const mId = trimmed.match(/steamcommunity\.com\/id\/([^\/\?]+)/i);
      let xmlUrl = '';
      if (steamId64) xmlUrl = `https://steamcommunity.com/profiles/${steamId64}/?xml=1`;
      else if (mProfiles) xmlUrl = `https://steamcommunity.com/profiles/${mProfiles[1]}/?xml=1`;
      else if (mId) xmlUrl = `https://steamcommunity.com/id/${mId[1]}/?xml=1`;
      else if (!/^\d+$/.test(trimmed)) xmlUrl = `https://steamcommunity.com/id/${trimmed}/?xml=1`;
      if (!xmlUrl) throw new Error('Invalid Steam URL or ID');

      const res = await _fetchWithCors(xmlUrl);
      const text = await res.text();
      const xml = new DOMParser().parseFromString(text, 'text/xml');
      const err = xml.querySelector('error');
      if (err) throw new Error(err.textContent || 'Profile not found');
      const get = sel => xml.querySelector(sel)?.textContent?.trim() || '';
      profileData = {
        steamId64: get('steamID64') || steamId64,
        name: get('steamID'),
        avatar: get('avatarFull') || get('avatarMedium') || '',
        isPublic: get('visibilityState') === '3',
        hoursWeek: get('hoursPlayed2Wk'),
        inGameName: xml.querySelector('inGameInfo gameName')?.textContent?.trim() || '',
        inGameAppId: (xml.querySelector('inGameInfo gameLogo')?.textContent?.trim() || '').match(/\/apps\/(\d+)\//)?.[1] || '',
        realname: get('realname'),
        state: get('onlineState'),
        memberSince: get('memberSince'),
        location: get('location'),
        vacBanned: get('vacBanned') === '1',
        mostPlayed: Array.from(xml.querySelectorAll('mostPlayedGame')).slice(0, 6).map(g => ({
          appId: (g.querySelector('gameLogo')?.textContent?.trim() || '').match(/\/apps\/(\d+)\//)?.[1] || null,
          name: g.querySelector('gameName')?.textContent?.trim() || '',
          logo: g.querySelector('gameLogo')?.textContent?.trim() || '',
          hours: parseFloat((g.querySelector('hoursOnRecord')?.textContent || '0').replace(/,/g, '')),
        })).filter(g => g.name),
      };
    }

    _ps.steamId64 = profileData.steamId64;
    _ps.name = profileData.name;
    _ps.avatar = profileData.avatar;
    _ps.isPublic = profileData.isPublic;
    _ps.hoursWeek = profileData.hoursWeek || '';
    _ps.inGameName = profileData.inGameName || '';
    _ps.inGameAppId = profileData.inGameAppId || '';
    _ps.mostPlayed = profileData.mostPlayed || [];
    _ps.realname = profileData.realname || '';
    _ps.memberSince = profileData.memberSince || '';
    _ps.location = profileData.location || '';
    _ps.vacBanned = profileData.vacBanned || false;

    const info = _stateInfo(profileData.state);

    // Save to recent lookups
    if (typeof _saveRecentLookup === 'function') {
      _saveRecentLookup(_ps.steamId64, _ps.name, _ps.avatar);
    }

    // Render the Steam-style profile
    prof.innerHTML = `
      <!-- Banner -->
      <div class="profile-banner">
        <div class="relative z-10 p-5 sm:p-6 pb-4">
          ${profileData.vacBanned ? `
            <div class="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg bg-red-900/30 border border-red-500/25 w-fit">
              <i class="fa-solid fa-shield-halved text-red-400 text-[10px]"></i>
              <span class="text-[10px] text-red-400 font-bold uppercase tracking-wider">VAC Banned</span>
            </div>` : ''}

          <!-- Profile header -->
          <div class="flex items-start gap-4">
            <div class="avatar-ring ${info.ring} flex-shrink-0">
              <img src="${_ps.avatar}" alt="${_ps.name}"
                class="w-[72px] h-[72px] rounded-[13px] object-cover bg-neutral-900"
                onerror="this.style.opacity='0.2'" />
            </div>
            <div class="flex-1 min-w-0 pt-1">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <span class="text-lg font-extrabold text-white truncate">${_ps.name}</span>
                <span class="activity-badge ${info.badge}">
                  <span class="w-1 h-1 rounded-full ${info.dot}"></span>${info.label}
                </span>
              </div>
              ${_ps.realname ? `<div class="text-[11px] text-neutral-400 mb-1 truncate">${_ps.realname}</div>` : ''}
              <div class="flex items-center gap-2 flex-wrap text-[10px]">
                <button id="copy-sid-btn" onclick="_copySteamId('${_ps.steamId64}')"
                  class="flex items-center gap-1 px-2 py-0.5 bg-black/30 text-neutral-500 hover:text-neutral-300 border border-white/[0.06] rounded-md transition-colors cursor-pointer">
                  <i class="fa-regular fa-copy text-[8px]"></i> Copy ID
                </button>
                <a href="https://steamcommunity.com/profiles/${_ps.steamId64}" target="_blank" rel="noopener"
                  class="flex items-center gap-1 px-2 py-0.5 bg-black/30 text-neutral-500 hover:text-neutral-300 border border-white/[0.06] rounded-md transition-colors">
                  <i class="fa-brands fa-steam text-[9px]"></i> Steam Profile
                </a>
                ${_ps.location ? `<span class="flex items-center gap-1 text-neutral-600"><i class="fa-solid fa-location-dot text-[8px]"></i>${_ps.location}</span>` : ''}
                ${_ps.memberSince ? `<span class="flex items-center gap-1 text-neutral-600"><i class="fa-solid fa-calendar text-[8px]"></i>Since ${_ps.memberSince}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs + Content -->
      <div class="mt-3">
        ${_renderTabBar('overview')}
        <div id="ptab-content" class="mt-3 min-h-[100px]"></div>
      </div>`;

    const ptabContent = document.getElementById('ptab-content');
    if (ptabContent) _loadOverviewTab(ptabContent);

    // Load games in background for stats
    if (_ps.isPublic && !_ps.games) {
      _ps.gamesLoading = true;
      loadOwnedGames(_ps.steamId64).then(games => {
        _ps.games = games;
        _ps.gamesCount = games.length;
        _ps.totalHours = games.reduce((s, g) => s + g.hours, 0);
        _ps.gamesLoading = false;
        _ps.mostPlayed = games.slice(0, 6).map(g => ({
          appId: g.appId, name: g.name, hours: g.hours, logo: '',
        }));
        window._lastProfileGames = games.slice(0, 200).map(g => ({ appId: g.appId, name: g.name }));
        if (_ps.currentTab === 'overview') {
          const c = document.getElementById('ptab-content');
          if (c) _loadOverviewTab(c);
        }
      }).catch(() => {
        _ps.gamesLoading = false;
      });
    }

  } catch (err) {
    prof.innerHTML = `
      <div class="profile-banner p-8">
        <div class="relative z-10 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
            <i class="fa-solid fa-circle-exclamation text-red-400 text-2xl"></i>
          </div>
          <h3 class="text-sm font-bold text-neutral-300 mb-1">Profile not found</h3>
          <p class="text-xs text-neutral-600">${err.message || 'Check the URL or ID and try again'}</p>
          <button onclick="document.getElementById('profile-input').focus()" class="mt-3 px-4 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-neutral-400 hover:text-white text-xs font-semibold transition-colors">
            Try Again
          </button>
        </div>
      </div>`;
  }
}
