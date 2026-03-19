// ── Steam community fetch (uses Worker proxy, fallback to external CORS) ──────
async function _fetchWithCors(url) {
  // Primary: use our own Worker proxy (no CORS issues, fast)
  try {
    const res = await fetch(`/api/proxy/steam?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) return res;
  } catch (_) {}
  // Fallback: external CORS proxies
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
};

window._lastProfileGames = null;

// ── Empty state ────────────────────────────────────────────────────────────────
function renderProfileEmpty() {
  const prof = document.getElementById('profile-section');
  if (!prof) return;
  prof.innerHTML = `
    <div class="text-center py-10">
      <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4">
        <i class="fa-brands fa-steam text-2xl text-neutral-600"></i>
      </div>
      <p class="text-sm font-semibold text-neutral-400">View your Steam profile</p>
      <p class="text-xs mt-1.5 text-neutral-700">Enter your Steam URL, ID64, or custom URL above</p>
    </div>`;
}

// ── Tab bar ────────────────────────────────────────────────────────────────────
function _renderTabBar(activeTab) {
  const tabs = [
    { id: 'overview', icon: 'fa-user',       label: 'Overview' },
    { id: 'games',    icon: 'fa-gamepad',     label: 'Games'    },
    { id: 'friends',  icon: 'fa-user-group',  label: 'Friends'  },
  ];
  return `
    <div class="flex gap-1 p-1 rounded-xl bg-black/30 border border-white/[0.05] mt-4">
      ${tabs.map(t => `
        <button onclick="switchProfileTab('${t.id}')" data-tab="${t.id}"
          class="ptab-btn flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all
            ${activeTab === t.id
              ? 'bg-white/[0.08] text-white border border-white/[0.1] shadow'
              : 'text-neutral-600 hover:text-neutral-400'}">
          <i class="fa-solid ${t.icon} text-[9px]"></i>${t.label}
        </button>`).join('')}
    </div>`;
}

// ── Switch tab ─────────────────────────────────────────────────────────────────
function switchProfileTab(tab) {
  _ps.currentTab = tab;
  document.querySelectorAll('.ptab-btn').forEach(btn => {
    const active = btn.dataset.tab === tab;
    btn.className = btn.className
      .replace(/bg-white\/\[0\.08\]\s*text-white\s*border\s*border-white\/\[0\.1\]\s*shadow|text-neutral-600\s*hover:text-neutral-400/g, '')
      .trimEnd();
    btn.className += active
      ? ' bg-white/[0.08] text-white border border-white/[0.1] shadow'
      : ' text-neutral-600 hover:text-neutral-400';
  });
  const content = document.getElementById('ptab-content');
  if (!content) return;
  switch (tab) {
    case 'overview': _loadOverviewTab(content); break;
    case 'games':    _loadGamesTab(content);    break;
    case 'friends':  _loadFriendsTab(content);  break;
  }
}

// ── Overview Tab ───────────────────────────────────────────────────────────────
function _loadOverviewTab(content) {
  let html = '';

  // In-game banner (info only — no download button)
  if (_ps.inGameName) {
    const ig = _ps.inGameAppId;
    html += `
      <div class="flex items-center gap-3 mb-3 px-3 py-2.5 rounded-xl bg-teal-500/[0.07] border border-teal-500/20">
        ${ig ? `<img src="${steamImg(ig)}" class="w-14 h-[26px] rounded-md object-cover flex-shrink-0 shadow" onerror="this.style.display='none'" />` : `<i class="fa-solid fa-gamepad text-teal-400/50 text-base flex-shrink-0"></i>`}
        <div class="flex-1 min-w-0">
          <div class="text-[8px] text-teal-400 font-bold uppercase tracking-widest mb-0.5">Currently In-Game</div>
          <div class="text-[11px] text-teal-200 truncate font-semibold">${_ps.inGameName}</div>
        </div>
        <span class="flex-shrink-0 w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
      </div>`;
  }

  // Stats
  const hrsStr = _ps.totalHours !== undefined
    ? (_ps.totalHours >= 1000 ? (_ps.totalHours / 1000).toFixed(1) + 'k' : Math.round(_ps.totalHours).toLocaleString())
    : null;

  if (_ps.gamesCount !== undefined || hrsStr || (_ps.hoursWeek && parseFloat(_ps.hoursWeek) > 0)) {
    html += `<div class="grid grid-cols-3 gap-2 mb-3">`;
    html += _ps.gamesCount !== undefined
      ? `<div class="text-center py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
           <div class="text-base font-bold text-white">${_ps.gamesCount.toLocaleString()}</div>
           <div class="text-[9px] text-neutral-600 uppercase tracking-wider">Games</div>
         </div>` : `<div></div>`;
    html += hrsStr
      ? `<div class="text-center py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
           <div class="text-base font-bold text-white">${hrsStr}</div>
           <div class="text-[9px] text-neutral-600 uppercase tracking-wider">Hours</div>
         </div>` : `<div></div>`;
    html += (_ps.hoursWeek && parseFloat(_ps.hoursWeek) > 0)
      ? `<div class="text-center py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
           <div class="text-base font-bold text-teal-400">${parseFloat(_ps.hoursWeek).toFixed(0)}</div>
           <div class="text-[9px] text-neutral-600 uppercase tracking-wider">Hrs/2wk</div>
         </div>` : `<div></div>`;
    html += `</div>`;
  }

  // Most played (info only — no Get button)
  const mp = _ps.mostPlayed || [];
  if (mp.length > 0) {
    html += `
      <div class="mb-1">
        <span class="text-[9px] font-bold uppercase tracking-widest text-neutral-700 block mb-2">Most Played</span>
        <div class="space-y-0.5">
          ${mp.map(g => `
            <div class="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors">
              <div class="profile-game-img-wrap flex-shrink-0">
                <img src="${g.appId ? steamImg(g.appId) : g.logo}" loading="lazy" class="profile-game-img" onerror="_prFb(this)" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-[11px] font-medium text-neutral-300 truncate">${g.name}</div>
                <div class="text-[9px] text-neutral-700">${g.hours > 0 ? g.hours.toFixed(1) + ' hrs' : 'Not played'}</div>
              </div>
              ${g.appId ? `<a href="https://store.steampowered.com/app/${g.appId}" target="_blank" rel="noopener"
                class="flex-shrink-0 text-[9px] px-2 py-0.5 bg-white/[0.04] text-neutral-600 hover:text-neutral-400 border border-white/[0.06] rounded-md transition-colors">
                <i class="fa-brands fa-steam"></i>
              </a>` : ''}
            </div>`).join('')}
        </div>
      </div>`;
  }

  if (!html) {
    if (_ps.gamesLoading && _ps.isPublic) {
      html = `<div class="flex items-center justify-center gap-2 py-6 text-neutral-600 text-xs">
        <i class="fa-solid fa-spinner animate-spin text-teal-400/60"></i> Loading your games…
      </div>`;
    } else if (_ps.isPublic) {
      html = `<div class="text-center py-5 text-neutral-600 text-xs">
        <i class="fa-solid fa-info-circle mr-1 text-neutral-700"></i>
        Overview data is limited. Try the
        <button onclick="switchProfileTab('games')" class="text-teal-400 hover:text-teal-300 font-semibold underline">Games</button> tab.
      </div>`;
    } else {
      html = `<div class="text-center py-5 text-neutral-600 text-xs">
        <i class="fa-solid fa-lock mr-1 text-neutral-700"></i>Profile is private.
      </div>`;
    }
  }

  content.innerHTML = html;
}

// ── Games Tab ──────────────────────────────────────────────────────────────────
function _loadGamesTab(content) {
  if (_ps.games) { _renderGamesInTab(content, _ps.games); return; }
  if (!_ps.isPublic) {
    content.innerHTML = `<div class="text-center py-5 text-neutral-600 text-xs">
      <i class="fa-solid fa-lock mr-1"></i>Games list is private
    </div>`;
    return;
  }
  content.innerHTML = `<div class="flex items-center justify-center gap-2 py-8 text-neutral-600 text-xs">
    <i class="fa-solid fa-spinner animate-spin text-teal-400/60"></i> Loading games…
  </div>`;
  loadOwnedGames(_ps.steamId64).then(games => {
    _ps.games = games;
    _ps.gamesCount = games.length;
    _ps.totalHours = games.reduce((s, g) => s + g.hours, 0);
    window._lastProfileGames = games.slice(0, 200).map(g => ({ appId: g.appId, name: g.name }));
    _renderGamesInTab(content, games);
  }).catch(() => {
    content.innerHTML = `<div class="text-center py-5 text-neutral-600 text-xs">
      <i class="fa-solid fa-gamepad mr-1"></i>Games list unavailable or private
    </div>`;
  });
}

function _renderGamesInTab(content, games) {
  window._lastProfileGames = games.slice(0, 200).map(g => ({ appId: g.appId, name: g.name }));
  const totalHours = games.reduce((s, g) => s + g.hours, 0);
  const totalStr = totalHours >= 1000 ? (totalHours / 1000).toFixed(1) + 'k' : Math.round(totalHours).toLocaleString();
  content.innerHTML = `
    <div class="flex items-center justify-between mb-2.5">
      <span class="text-[10px] text-neutral-600">
        <span class="font-bold text-neutral-400">${games.length.toLocaleString()}</span> games ·
        <span class="font-bold text-neutral-400">${totalStr}</span> hrs
      </span>
    </div>
    <input type="text" placeholder="Search your library…"
      oninput="_filterProfileGames(this.value)"
      class="w-full mb-2 px-3 py-1.5 text-[11px] rounded-lg bg-black/30 border border-white/[0.06] text-neutral-300 placeholder-neutral-700 outline-none focus:border-white/[0.15] transition-colors" />
    <div id="ptab-games-list" class="profile-games-list space-y-0.5 max-h-[280px] overflow-y-auto pr-0.5">
      ${_gamesListHtml(games.slice(0, 150))}
    </div>
    ${games.length > 150 ? `<div class="text-center text-[10px] text-neutral-700 py-2">Showing top 150 of ${games.length.toLocaleString()}</div>` : ''}`;
}

function _gamesListHtml(games) {
  return games.map(g => `
    <div class="flex items-center gap-2.5 py-1.5 px-2 hover:bg-white/[0.03] rounded-lg transition-colors group/pg">
      <div class="profile-game-img-wrap flex-shrink-0">
        <img src="${steamImg(g.appId)}" loading="lazy" class="profile-game-img" onerror="_prFb(this)" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-[11px] font-medium text-neutral-300 truncate">${g.name}</div>
        <div class="text-[9px] text-neutral-700 flex items-center gap-1.5">
          <span>${g.hours > 0 ? g.hours.toFixed(1) + ' hrs' : 'Not played'}</span>
          ${g.lastPlayed ? `<span>·</span><span>${_fmtDate(g.lastPlayed)}</span>` : ''}
        </div>
      </div>
      <a href="https://store.steampowered.com/app/${g.appId}" target="_blank" rel="noopener"
        class="flex-shrink-0 opacity-0 group-hover/pg:opacity-100 text-[9px] px-2 py-0.5 bg-white/[0.04] text-neutral-600 hover:text-neutral-400 border border-white/[0.06] rounded-md transition-all">
        <i class="fa-brands fa-steam"></i>
      </a>
    </div>`).join('');
}

function _filterProfileGames(query) {
  if (!_ps.games) return;
  const q = query.toLowerCase().trim();
  const filtered = q ? _ps.games.filter(g => g.name.toLowerCase().includes(q)) : _ps.games.slice(0, 150);
  const el = document.getElementById('ptab-games-list');
  if (el) el.innerHTML = _gamesListHtml(filtered.slice(0, 150));
}

// ── Friends Tab ────────────────────────────────────────────────────────────────
async function _loadFriendsTab(content) {
  if (_ps.friends) { _renderFriendsInTab(content, _ps.friends); return; }
  content.innerHTML = `<div class="flex items-center justify-center gap-2 py-8 text-neutral-600 text-xs">
    <i class="fa-solid fa-spinner animate-spin text-teal-400/60"></i> Loading friends…
  </div>`;
  try {
    const steamApiFriends = await _loadFriendsViaSteamApi(_ps.steamId64);
    if (steamApiFriends?.length) {
      _ps.friends = steamApiFriends;
      _renderFriendsInTab(content, steamApiFriends);
      return;
    }
  } catch (_) {}
  // Fallback 2: XML friends endpoint
  try {
    const url = `https://steamcommunity.com/profiles/${_ps.steamId64}/friends/?xml=1`;
    const res  = await _fetchWithCors(url);
    if (res.ok) {
      const text = await res.text();
      const xml  = new DOMParser().parseFromString(text, 'text/xml');
      const friends = Array.from(xml.querySelectorAll('friends friend')).slice(0, 40).map(f => ({
        steamId64: f.querySelector('steamID64')?.textContent?.trim() || '',
        name:      f.querySelector('steamID')?.textContent?.trim()   || 'Unknown',
        avatar:    f.querySelector('avatarIcon')?.textContent?.trim() || '',
        state:     f.querySelector('onlineState')?.textContent?.trim() || 'offline',
      })).filter(f => f.steamId64);
      if (friends.length) {
        _ps.friends = friends;
        _renderFriendsInTab(content, friends);
        return;
      }
    }
  } catch (_) {}

  // Fallback 3: scrape HTML friends page via Worker proxy
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
    content.innerHTML = `<div class="text-center py-5 text-neutral-600 text-xs">
      <i class="fa-solid fa-user-slash mr-1"></i>${e.message || 'Friends list is private or unavailable'}
    </div>`;
  }
}

function _renderFriendsInTab(content, friends) {
  const dotColor   = s => s === 'online' ? 'bg-emerald-400' : s === 'in-game' ? 'bg-teal-400' : 'bg-neutral-700';
  const stateLabel = s => s === 'in-game' ? 'In-Game' : s === 'online' ? 'Online' : 'Offline';
  const stateColor = s => s === 'online' ? 'text-emerald-400' : s === 'in-game' ? 'text-teal-400' : 'text-neutral-700';
  const sorted = [...friends].sort((a, b) => {
    const o = { 'online': 0, 'in-game': 1, 'offline': 2 };
    return (o[a.state] ?? 2) - (o[b.state] ?? 2);
  });
  const onlineCount = friends.filter(f => f.state === 'online' || f.state === 'in-game').length;
  content.innerHTML = `
    <div class="flex items-center gap-2 mb-2.5">
      <span class="text-[10px] text-neutral-600">
        <span class="font-bold text-neutral-400">${friends.length}</span> friends
      </span>
      <span class="flex items-center gap-1 text-[10px]">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        <span class="text-emerald-400 font-bold">${onlineCount}</span>
        <span class="text-neutral-700">online</span>
      </span>
    </div>
    <div class="space-y-0.5 max-h-[300px] overflow-y-auto profile-games-list">
      ${sorted.map(f => `
        <div class="flex items-center gap-2.5 py-1.5 px-2 hover:bg-white/[0.03] rounded-lg transition-colors">
          <div class="relative flex-shrink-0">
            <img src="${f.avatar}" alt="${f.name}" class="w-7 h-7 rounded-lg object-cover bg-neutral-900" onerror="this.style.opacity='0.1'" />
            <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${dotColor(f.state)} border-2 border-[#080808]"></span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[11px] font-medium text-neutral-300 truncate">${f.name}</div>
            <div class="text-[9px] ${stateColor(f.state)}">${stateLabel(f.state)}</div>
          </div>
          <a href="https://steamcommunity.com/profiles/${f.steamId64}" target="_blank" rel="noopener"
            class="text-[9px] px-2 py-0.5 bg-white/[0.04] text-neutral-600 hover:text-neutral-400 border border-white/[0.06] rounded-md transition-colors">
            <i class="fa-brands fa-steam"></i>
          </a>
        </div>`).join('')}
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
    location:    p.loccountrycode ? `Country: ${p.loccountrycode}` : '',
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
  };
  prof.innerHTML = `
    <div class="flex flex-col items-center justify-center gap-2.5 py-10">
      <div class="w-10 h-10 rounded-full border-2 border-teal-500/30 border-t-teal-400 animate-spin"></div>
      <span class="text-xs text-neutral-600">Looking up profile…</span>
    </div>`;

  try {
    const trimmed = input.trim().replace(/\/$/, '');
    let steamId64 = await _resolveSteamId(trimmed);
    if (!steamId64 && /^\d{17}$/.test(trimmed)) steamId64 = trimmed;

    let profileData = null;
    try { profileData = await _loadProfileViaSteamApi(steamId64); } catch (_) {}

    if (!profileData) {
      const mProfiles = trimmed.match(/steamcommunity\.com\/profiles\/(\d+)/i);
      const mId       = trimmed.match(/steamcommunity\.com\/id\/([^\/\?]+)/i);
      let xmlUrl = '';
      if (steamId64)   xmlUrl = `https://steamcommunity.com/profiles/${steamId64}/?xml=1`;
      else if (mProfiles) xmlUrl = `https://steamcommunity.com/profiles/${mProfiles[1]}/?xml=1`;
      else if (mId)    xmlUrl = `https://steamcommunity.com/id/${mId[1]}/?xml=1`;
      else if (!/^\d+$/.test(trimmed)) xmlUrl = `https://steamcommunity.com/id/${trimmed}/?xml=1`;
      if (!xmlUrl) throw new Error('Invalid Steam URL or ID');

      const res  = await _fetchWithCors(xmlUrl);
      const text = await res.text();
      const xml  = new DOMParser().parseFromString(text, 'text/xml');
      const err  = xml.querySelector('error');
      if (err) throw new Error(err.textContent || 'Profile not found');
      const get  = sel => xml.querySelector(sel)?.textContent?.trim() || '';
      profileData = {
        steamId64:   get('steamID64') || steamId64,
        name:        get('steamID'),
        avatar:      get('avatarFull') || get('avatarMedium') || '',
        isPublic:    get('visibilityState') === '3',
        hoursWeek:   get('hoursPlayed2Wk'),
        inGameName:  xml.querySelector('inGameInfo gameName')?.textContent?.trim() || '',
        inGameAppId: (xml.querySelector('inGameInfo gameLogo')?.textContent?.trim() || '').match(/\/apps\/(\d+)\//)?.[1] || '',
        realname:    get('realname'),
        state:       get('onlineState'),
        memberSince: get('memberSince'),
        location:    get('location'),
        vacBanned:   get('vacBanned') === '1',
        mostPlayed:  Array.from(xml.querySelectorAll('mostPlayedGame')).slice(0, 6).map(g => ({
          appId: (g.querySelector('gameLogo')?.textContent?.trim() || '').match(/\/apps\/(\d+)\//)?.[1] || null,
          name:  g.querySelector('gameName')?.textContent?.trim() || '',
          logo:  g.querySelector('gameLogo')?.textContent?.trim() || '',
          hours: parseFloat((g.querySelector('hoursOnRecord')?.textContent || '0').replace(/,/g, '')),
        })).filter(g => g.name),
      };
    }

    _ps.steamId64   = profileData.steamId64;
    _ps.name        = profileData.name;
    _ps.avatar      = profileData.avatar;
    _ps.isPublic    = profileData.isPublic;
    _ps.hoursWeek   = profileData.hoursWeek || '';
    _ps.inGameName  = profileData.inGameName || '';
    _ps.inGameAppId = profileData.inGameAppId || '';
    _ps.mostPlayed  = profileData.mostPlayed || [];

    const state = profileData.state;
    const pstate = typeof state === 'number' ? state : (state === 'online' ? 1 : state === 'in-game' ? 2 : 0);
    const dotColor   = pstate === 1 ? 'bg-emerald-400' : pstate === 2 ? 'bg-teal-400' : 'bg-neutral-700';
    const stateColor = pstate === 1 ? 'text-emerald-400' : pstate === 2 ? 'text-teal-400' : 'text-neutral-500';
    const stateLabel = pstate === 2 ? 'In-Game' : pstate === 1 ? 'Online' : 'Offline';

    prof.innerHTML = `
      ${profileData.vacBanned ? `
        <div class="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-red-900/20 border border-red-500/25">
          <i class="fa-solid fa-shield-halved text-red-400 text-[10px]"></i>
          <span class="text-[10px] text-red-400 font-semibold">VAC Banned Account</span>
        </div>` : ''}

      <!-- Profile header -->
      <div class="flex items-center gap-4 pb-4 border-b border-white/[0.05]">
        <div class="relative flex-shrink-0">
          <img src="${_ps.avatar}" alt="${_ps.name}"
            class="w-16 h-16 rounded-2xl object-cover bg-neutral-900 shadow-xl ring-1 ring-white/10"
            onerror="this.style.opacity='0.2'" />
          <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${dotColor} border-2 border-[#080808] shadow"></span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-base font-bold text-white truncate">${_ps.name}</span>
            <a href="https://steamcommunity.com/profiles/${_ps.steamId64}" target="_blank" rel="noopener"
              class="flex-shrink-0 inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 bg-white/[0.04] text-neutral-600 hover:text-neutral-300 border border-white/[0.06] rounded-md transition-colors">
              <i class="fa-brands fa-steam"></i> Steam
            </a>
          </div>
          ${profileData.realname ? `<div class="text-[10px] text-neutral-600 mt-0.5 truncate">${profileData.realname}</div>` : ''}
          <div class="flex items-center gap-1.5 mt-1">
            <span class="text-xs font-semibold ${stateColor}">${stateLabel}</span>
            ${profileData.location ? `<span class="text-neutral-700">·</span><span class="text-[10px] text-neutral-700">${profileData.location}</span>` : ''}
          </div>
          ${profileData.memberSince ? `<div class="text-[10px] text-neutral-700 mt-0.5">Member since ${profileData.memberSince}</div>` : ''}
        </div>
      </div>

      <!-- Tabs -->
      ${_renderTabBar('overview')}
      <div id="ptab-content" class="mt-3 min-h-[80px]"></div>`;

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
      <div class="text-center py-10">
        <i class="fa-solid fa-circle-exclamation text-amber-500 text-2xl mb-3 block"></i>
        <strong class="text-neutral-400 text-sm block mb-1">Profile not found</strong>
        <span class="text-xs text-neutral-700">${err.message || 'Check URL or ID and try again'}</span>
      </div>`;
  }
}
