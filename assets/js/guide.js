// ── Page content definitions ───────────────────────────────────────────────
const pages = {

  intro: {
    breadcrumbs: [{ label: 'Introduction', id: null }],
    title: 'Introduction',
    next: { id: 'beginners', label: "Beginner's Guide" },
    render: () => `
      <h1>Welcome to the <span class="gradient-text">GhostLua</span> Usage Guide!</h1>
      <p>This guide covers everything you need to know to use GhostLua and SteamTools.</p>
      <div class="card-grid">
        <a class="doc-card" onclick="navigate('faq')">
          <div class="doc-card-icon"><i class="fa-regular fa-file-lines"></i></div>
          <div class="doc-card-title">Frequently Asked Questions</div>
          <div class="doc-card-desc">Answers to common questions</div>
        </a>
        <a class="doc-card" onclick="navigate('beginners')">
          <div class="doc-card-icon"><i class="fa-regular fa-file-lines"></i></div>
          <div class="doc-card-title">Beginner's Guide</div>
          <div class="doc-card-desc">Get started with GhostLua and SteamTools</div>
        </a>
        <a class="doc-card" onclick="navigate('bypasses')">
          <div class="doc-card-icon"><i class="fa-regular fa-file-lines"></i></div>
          <div class="doc-card-title">Bypasses &amp; Fixes</div>
          <div class="doc-card-desc">Special installation steps for certain games</div>
        </a>
      </div>
    `
  },

  beginners: {
    breadcrumbs: [{ label: "Beginner's Guide", id: null }],
    title: "Beginner's Guide",
    prev: { id: 'intro', label: 'Introduction' },
    next: { id: 'installing', label: 'Installing SteamTools' },
    render: () => `
      <h1>Beginner's Guide</h1>
      <p>This guide will teach you the basics of GhostLua and SteamTools.</p>
      <h2>Pages</h2>
      <div class="card-grid">
        <a class="doc-card" onclick="navigate('installing')">
          <div class="doc-card-icon"><i class="fa-regular fa-file-lines"></i></div>
          <div class="doc-card-title">Installing SteamTools</div>
        </a>
        <a class="doc-card" onclick="navigate('downloading')">
          <div class="doc-card-icon"><i class="fa-regular fa-file-lines"></i></div>
          <div class="doc-card-title">Downloading a game</div>
        </a>
        <a class="doc-card" onclick="navigate('removing')">
          <div class="doc-card-icon"><i class="fa-regular fa-file-lines"></i></div>
          <div class="doc-card-title">Removing a game</div>
        </a>
      </div>
      <p>Click on the <strong>Next</strong> button below to get started.</p>
    `
  },

  installing: {
    breadcrumbs: [{ label: "Beginner's Guide", id: 'beginners' }, { label: 'Installing SteamTools', id: null }],
    title: 'Installing SteamTools',
    prev: { id: 'beginners', label: "Beginner's Guide" },
    next: { id: 'downloading', label: 'Downloading a game' },
    render: () => `
      <h1>Installing SteamTools</h1>
      <p>This page explains the process of installing SteamTools. It does the magic to make the game(s) appear in your library.</p>

      <h2>Windows</h2>
      <div class="step"><div class="step-num">1</div><div class="step-body">
        <div class="step-title">Download the installer, run it, and click <strong>Next → Install → Finish</strong>.</div>
      </div></div>

      <h2>Linux</h2>
      <div class="admonition warning">
        <div class="admonition-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <div class="admonition-content">
          <div class="admonition-title">Warning</div>
          <p>SteamTools isn't officially supported on Linux. We can't help with any issues you have while using it on Linux.</p>
        </div>
      </div>

      <div class="step"><div class="step-num">1</div><div class="step-body">
        <div class="step-title">Install PortProton <em>(Only available via Flatpak)</em></div>
      </div></div>
      <div class="step"><div class="step-num">2</div><div class="step-body">
        <div class="step-title">Open PortProton and wait for it to finish installing</div>
      </div></div>
      <div class="step"><div class="step-num">3</div><div class="step-body">
        <div class="step-title">Find <strong>"Steam (UNSTABLE)"</strong> in the AUTOINSTALLS tab and click on it</div>
        <div class="admonition note" style="margin-top:0.6rem">
          <div class="admonition-icon"><i class="fa-solid fa-circle-info"></i></div>
          <div class="admonition-content">
            <div class="admonition-title">Note</div>
            <p>The PortProton window may disappear entirely for a minute, just give it a moment.</p>
          </div>
        </div>
      </div></div>
      <div class="step"><div class="step-num">4</div><div class="step-body">
        <div class="step-title">Once the "Choices" window pops up, just click <strong>CREATE SHORTCUT</strong></div>
      </div></div>
      <div class="step"><div class="step-num">5</div><div class="step-body">
        <div class="step-title">On the second popup, click <strong>LAUNCH</strong>. Wait until the Steam login window pops up</div>
      </div></div>
      <div class="step"><div class="step-num">6</div><div class="step-body">
        <div class="step-title">Login with your Steam account</div>
      </div></div>
      <div class="step"><div class="step-num">7</div><div class="step-body">
        <div class="step-title">Download the SteamTools installer</div>
      </div></div>
      <div class="step"><div class="step-num">8</div><div class="step-body">
        <div class="step-title">Right-click the installer, click <strong>Open With…</strong> and select <strong>PortProton</strong></div>
      </div></div>
      <div class="step"><div class="step-num">9</div><div class="step-body">
        <div class="step-title">In the popup, select <strong>LAUNCH</strong></div>
      </div></div>
      <div class="step"><div class="step-num">10</div><div class="step-body">
        <div class="step-title">Go through all of the installation steps (just click Next, you don't have to change anything)</div>
      </div></div>

      <div class="admonition note">
        <div class="admonition-icon"><i class="fa-solid fa-circle-info"></i></div>
        <div class="admonition-content">
          <div class="admonition-title">Note</div>
          <p>When you exit SteamTools for the first time, a "Choices" window will open. Just click <strong>CREATE SHORTCUT</strong>.</p>
        </div>
      </div>
      <div class="admonition important">
        <div class="admonition-icon"><i class="fa-solid fa-circle-exclamation"></i></div>
        <div class="admonition-content">
          <div class="admonition-title">Important</div>
          <p>To launch Steam or SteamTools, use the PortProton app. (If SteamTools doesn't appear as an option, relaunch the app)</p>
        </div>
      </div>
    `
  },

  downloading: {
    breadcrumbs: [{ label: "Beginner's Guide", id: 'beginners' }, { label: 'Downloading a game', id: null }],
    title: 'Downloading a game',
    prev: { id: 'installing', label: 'Installing SteamTools' },
    next: { id: 'removing', label: 'Removing a game' },
    render: () => `
      <h1>Downloading a game</h1>

      <h2>1. Download the lua file</h2>
      <div class="step"><div class="step-num">1</div><div class="step-body">
        <div class="step-title">Open <a href="index.html">GhostLua</a></div>
      </div></div>
      <div class="step"><div class="step-num">2</div><div class="step-body">
        <div class="step-title">Search for the game you want to add to your Steam Library for free</div>
      </div></div>
      <div class="step"><div class="step-num">3</div><div class="step-body">
        <div class="step-title">Click <strong>Download</strong> and follow the steps shown</div>
      </div></div>

      <h2>2. Open SteamTools and add the game</h2>
      <div class="step"><div class="step-num">1</div><div class="step-body">
        <div class="step-title">If you haven't already, open SteamTools — a gray floating Steam icon should appear.</div>
        <details class="mt-2" style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:8px;padding:0.6rem 0.85rem;font-size:14px;cursor:pointer;">
          <summary style="font-weight:500;color:var(--text);">If the floating icon did not appear</summary>
          <p style="margin-top:0.5rem;color:var(--text-muted);">A white Steam icon should've appeared in your tray. Right click it, and select <strong>Display Floating Window</strong>. Can't see it? Make sure to check the <em>Hidden icons</em> menu too.</p>
        </details>
      </div></div>
      <div class="step"><div class="step-num">2</div><div class="step-body">
        <div class="step-title">Drag the <code>.lua</code> file you've downloaded onto the floating Steam icon.</div>
      </div></div>
      <div class="step"><div class="step-num">3</div><div class="step-body">
        <div class="step-title">Restart Steam through SteamTools by right-clicking the floating Steam icon and selecting <strong>Restart Steam</strong>.</div>
      </div></div>

      <div class="congrats-box">
        <h3>🎉 Congrats!</h3>
        <p>If you've followed all of the steps correctly, you should now have the game in your Steam Library, available to download for free.</p>
      </div>

      <div class="admonition tip">
        <div class="admonition-icon"><i class="fa-solid fa-lightbulb"></i></div>
        <div class="admonition-content">
          <div class="admonition-title">Having issues?</div>
          <p>Check out the <a onclick="navigate('faq')">FAQ &amp; Troubleshooting section</a>.</p>
        </div>
      </div>
    `
  },

  removing: {
    breadcrumbs: [{ label: "Beginner's Guide", id: 'beginners' }, { label: 'Removing a game', id: null }],
    title: 'Removing a game',
    prev: { id: 'downloading', label: 'Downloading a game' },
    next: { id: 'bypasses', label: 'Bypasses/Fixes' },
    render: () => `
      <h1>Removing a game</h1>
      <p>This page explains the process of using our Game Remover. All our Game Remover does is delete the lua file from your Steam directory, effectively removing it from your library.</p>
      <p>If you wish to delete the file manually rather than using our Game Remover, go to <code>C:\\Program Files (x86)\\Steam\\config\\stplug-in</code>, delete the lua file for your game and restart Steam through SteamTools.</p>

      <h2>1. Download and run the Game Remover</h2>
      <div class="admonition note">
        <div class="admonition-icon"><i class="fa-solid fa-circle-info"></i></div>
        <div class="admonition-content">
          <div class="admonition-title">Note</div>
          <p>The Game Remover is open-source! Check it out on <a href="https://github.com" target="_blank">GitHub</a>.</p>
        </div>
      </div>

      <h2>2. Select your Steam directory</h2>
      <div class="step"><div class="step-num">1</div><div class="step-body">
        <div class="step-title">Click the <strong>Browse</strong> button in the Game Remover</div>
      </div></div>
      <div class="step"><div class="step-num">2</div><div class="step-body">
        <div class="step-title">In most cases, the tool will automatically navigate to your Steam directory. If it did, simply click <strong>Select Folder</strong>.</div>
        <details class="mt-2" style="background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:8px;padding:0.6rem 0.85rem;font-size:14px;cursor:pointer;">
          <summary style="font-weight:500;color:var(--text);">If the Steam directory wasn't selected automatically</summary>
          <p style="margin-top:0.5rem;color:var(--text-muted);">Manually navigate to your Steam installation folder, or copy and paste this path into the address bar at the top of the File Explorer window:</p>
          <pre><code>C:\\Program Files (x86)\\Steam\\config\\stplug-in</code></pre>
        </details>
      </div></div>

      <h2>3. Retrieve the AppID</h2>
      <div class="step"><div class="step-num">1</div><div class="step-body">
        <div class="step-title">Open the Steam Store search and search for the game you want to remove</div>
      </div></div>
      <div class="step"><div class="step-num">2</div><div class="step-body">
        <div class="step-title">Click on the game in the search results</div>
      </div></div>
      <div class="step"><div class="step-num">3</div><div class="step-body">
        <div class="step-title">Copy the AppID from the URL</div>
        <div class="admonition info" style="margin-top:0.6rem">
          <div class="admonition-icon"><i class="fa-solid fa-circle-info"></i></div>
          <div class="admonition-content">
            <div class="admonition-title">Info</div>
            <p>The AppID is the number that appears after <code>/app/</code> in the URL. For example: in <code>https://store.steampowered.com/app/70/HalfLife/</code>, the AppID is <strong>70</strong>.</p>
          </div>
        </div>
      </div></div>

      <h2>4. Remove the game from your library</h2>
      <div class="step"><div class="step-num">1</div><div class="step-body">
        <div class="step-title">Paste the AppID in the <strong>"Enter game ID"</strong> field</div>
      </div></div>
      <div class="step"><div class="step-num">2</div><div class="step-body">
        <div class="step-title">Click on the <strong>Delete Game</strong> button</div>
      </div></div>
      <div class="step"><div class="step-num">3</div><div class="step-body">
        <div class="step-title">Restart Steam through SteamTools</div>
      </div></div>

      <div class="congrats-box">
        <h3>🎉 Congrats!</h3>
        <p>If you've followed all of the steps correctly, you should have removed the game from your Steam Library.</p>
      </div>
    `
  },

  bypasses: {
    breadcrumbs: [{ label: 'Bypasses/Fixes', id: null }],
    title: 'Bypasses/Fixes',
    prev: { id: 'removing', label: 'Removing a game' },
    next: { id: 'fc26', label: 'EA SPORTS FC™ 26' },
    render: () => `
      <h1>Bypasses/Fixes</h1>
      <div class="admonition important">
        <div class="admonition-icon"><i class="fa-solid fa-circle-exclamation"></i></div>
        <div class="admonition-content">
          <div class="admonition-title">Bypasses are now integrated into the website</div>
          <p>When you download a game that requires a bypass, you'll automatically be prompted to download it. This section only contains bypasses that require special installation steps.</p>
        </div>
      </div>
      <p>This section contains bypasses/online fixes which require custom installation steps.</p>
      <div class="card-grid">
        <a class="doc-card" onclick="navigate('fc26')">
          <div class="doc-card-icon"><i class="fa-regular fa-file-lines"></i></div>
          <div class="doc-card-title">EA SPORTS FC™ 26</div>
        </a>
        <a class="doc-card" onclick="navigate('arc-raiders')">
          <div class="doc-card-icon"><i class="fa-regular fa-file-lines"></i></div>
          <div class="doc-card-title">ARC Raiders</div>
        </a>
        <a class="doc-card" onclick="navigate('among-us')">
          <div class="doc-card-icon"><i class="fa-regular fa-file-lines"></i></div>
          <div class="doc-card-title">Among Us</div>
        </a>
      </div>
    `
  },

  fc26: {
    breadcrumbs: [{ label: 'Bypasses/Fixes', id: 'bypasses' }, { label: 'EA SPORTS FC™ 26', id: null }],
    title: 'EA SPORTS FC™ 26',
    prev: { id: 'bypasses', label: 'Bypasses/Fixes' },
    next: { id: 'arc-raiders', label: 'ARC Raiders' },
    render: () => `
      <h1>EA SPORTS FC™ 26</h1>

      <h2>1. Patch the game's files</h2>
      <div class="step"><div class="step-num">1</div><div class="step-body">
        <div class="step-title">Install the EA SPORTS FC™ 26 SHOWCASE</div>
      </div></div>
      <div class="step"><div class="step-num">2</div><div class="step-body">
        <div class="step-title">Run the game at least once from Steam</div>
      </div></div>
      <div class="step"><div class="step-num">3</div><div class="step-body">
        <div class="step-title">Right-click the FC 26 Showcase in your Steam Library, then click <strong>Manage → Browse local files</strong></div>
      </div></div>
      <div class="step"><div class="step-num">4</div><div class="step-body">
        <div class="step-title">Download the patch files</div>
      </div></div>
      <div class="step"><div class="step-num">5</div><div class="step-body">
        <div class="step-title">Extract the contents of the <code>.rar</code> file into the game folder. The password for the archive is <code>openlua.cloud</code></div>
      </div></div>
      <div class="step"><div class="step-num">6</div><div class="step-body">
        <div class="step-title">If prompted, click <strong>Replace the file in the destination</strong> (this may appear multiple times)</div>
      </div></div>
      <div class="step"><div class="step-num">7</div><div class="step-body">
        <div class="step-title">Delete <code>FC26_Showcase.exe</code> and rename <code>FC26_Showcase fixed.exe</code> to <code>FC26_Showcase.exe</code></div>
      </div></div>
      <div class="step"><div class="step-num">8</div><div class="step-body">
        <div class="step-title">Open the <code>Bypass.bat</code> file and select the second option, press enter to close after it's done</div>
      </div></div>

      <h2>2. Generate the Denuvo token</h2>
      <div class="step"><div class="step-num">1</div><div class="step-body">
        <div class="step-title">Open <code>EA.Denuvo.Token.Dumper.exe</code></div>
        <div class="admonition note" style="margin-top:0.6rem">
          <div class="admonition-icon"><i class="fa-solid fa-circle-info"></i></div>
          <div class="admonition-content">
            <div class="admonition-title">Note</div>
            <p>Make sure <strong>"FC26 showcase version"</strong> is checked and <strong>"Add DenuvoToken to anadius.cfg even if it exists"</strong> is unchecked.</p>
          </div>
        </div>
      </div></div>
      <div class="step"><div class="step-num">2</div><div class="step-body">
        <div class="step-title">Press <strong>Start</strong>, copy your token</div>
      </div></div>
      <div class="step"><div class="step-num">3</div><div class="step-body">
        <div class="step-title">Open <code>anadius.cfg</code> in the game folder, paste your token, save and exit</div>
        <div class="admonition danger" style="margin-top:0.6rem">
          <div class="admonition-icon"><i class="fa-solid fa-skull"></i></div>
          <div class="admonition-content">
            <div class="admonition-title">Danger</div>
            <p>Make sure you do <strong>not</strong> erase the quotes around the token!</p>
          </div>
        </div>
      </div></div>

      <div class="congrats-box">
        <h3>🎉 Congrats!</h3>
        <p>If you've followed all of the steps correctly, you should now be able to play EA SPORTS FC™ 26.</p>
      </div>

      <div class="admonition note">
        <div class="admonition-icon"><i class="fa-solid fa-circle-info"></i></div>
        <div class="admonition-content">
          <div class="admonition-title">Note</div>
          <p>Online functionality will not work.</p>
        </div>
      </div>
      <div class="admonition important">
        <div class="admonition-icon"><i class="fa-solid fa-circle-exclamation"></i></div>
        <div class="admonition-content">
          <div class="admonition-title">Important</div>
          <p>Always launch the game from <code>FC26_Showcase.exe</code>, not through your Steam Library or the EA app.</p>
        </div>
      </div>
    `
  },

  'arc-raiders': {
    breadcrumbs: [{ label: 'Bypasses/Fixes', id: 'bypasses' }, { label: 'ARC Raiders', id: null }],
    title: 'ARC Raiders',
    prev: { id: 'fc26', label: 'EA SPORTS FC™ 26' },
    next: { id: 'among-us', label: 'Among Us' },
    render: () => `
      <h1>ARC Raiders</h1>
      <div class="admonition danger">
        <div class="admonition-icon"><i class="fa-solid fa-skull"></i></div>
        <div class="admonition-content">
          <div class="admonition-title">Patched</div>
          <p>The bypass has been patched.</p>
        </div>
      </div>
    `
  },

  'among-us': {
    breadcrumbs: [{ label: 'Bypasses/Fixes', id: 'bypasses' }, { label: 'Among Us', id: null }],
    title: 'Among Us',
    prev: { id: 'arc-raiders', label: 'ARC Raiders' },
    next: { id: 'faq', label: 'FAQ' },
    render: () => `
      <h1>Among Us</h1>
      <div class="admonition note">
        <div class="admonition-icon"><i class="fa-solid fa-circle-info"></i></div>
        <div class="admonition-content">
          <div class="admonition-title">Note</div>
          <p>You don't have to install the game on Steam.</p>
        </div>
      </div>
      <div class="admonition info">
        <div class="admonition-icon"><i class="fa-solid fa-circle-info"></i></div>
        <div class="admonition-content">
          <div class="admonition-title">Info</div>
          <p>This fix uses official servers, with people who legitimately bought the game. Your friends who bought the game legitimately do <strong>not</strong> need to install this to play with you.</p>
        </div>
      </div>

      <h2>1. Download the game</h2>
      <div class="step"><div class="step-num">1</div><div class="step-body">
        <div class="step-title">Download the game files</div>
      </div></div>
      <div class="step"><div class="step-num">2</div><div class="step-body">
        <div class="step-title">Extract the contents of the <code>.rar</code> file into a folder. The password for the archive is <code>openlua.cloud</code></div>
      </div></div>

      <h2>2. Authenticate with itch.io</h2>
      <div class="step"><div class="step-num">1</div><div class="step-body">
        <div class="step-title">Visit the <a href="https://itch.io/register" target="_blank">itch.io Registration page</a> and create a new account. You can skip this step if you already have one.</div>
        <div class="admonition warning" style="margin-top:0.6rem">
          <div class="admonition-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
          <div class="admonition-content">
            <div class="admonition-title">Warning</div>
            <p>Make sure to confirm your email address.</p>
          </div>
        </div>
      </div></div>
      <div class="step"><div class="step-num">2</div><div class="step-body">
        <div class="step-title">Launch the game using <code>Among Us.exe</code> and log into your itch.io account in-game.</div>
      </div></div>

      <div class="congrats-box">
        <h3>🎉 Congrats!</h3>
        <p>If you've followed all of the steps correctly, you should now be able to play Among Us.</p>
      </div>
    `
  },

  faq: {
    breadcrumbs: [{ label: 'Frequently Asked Questions', id: null }],
    title: 'Frequently Asked Questions',
    prev: { id: 'among-us', label: 'Among Us' },
    render: () => `
      <h1>Frequently Asked Questions</h1>

      <div class="faq-section-title">General</div>
      ${faqItem("What's SteamTools?", "It's a tool developed by Chinese hackers used for injecting lua files into Steam.")}
      ${faqItem("What are the lua files for?", "These files contain depot keys for the game/app and DLCs. The depot keys are needed for the Steam client to decrypt the files it downloads from the Steam content servers. Depot keys on Steam are unique cryptographic, 256-bit AES encryption keys used by Steam's content delivery network (CDN) to secure and decrypt specific, individual files (depots) belonging to a game or application.")}
      ${faqItem("Can my Steam account get banned?", "No. Games and DLCs added with SteamTools are completely client-side, and are not visible to Steam servers.")}
      ${faqItem("Does Steam Cloud work?", "Yes, but it's pretty buggy — doesn't always work and is known to lose saves.")}
      ${faqItem("Can I play multiplayer/online games?", "Yes, but you need to install online fixes for the multiplayer games you want to play. You'll be prompted to download them when you download multiplayer games from the website.")}
      ${faqItem("Can I play online with my friends who bought the game?", "Yes, but your friends have to install the same online fix as you did.")}
      ${faqItem("Why are my friends getting an invite to play Spacewar?", "That's completely normal.")}
      ${faqItem("Does the workshop work?", `Yes, the workshop works just like with any of your purchased games/applications. <div class="admonition note" style="margin-top:0.5rem"><div class="admonition-icon"><i class="fa-solid fa-circle-info"></i></div><div class="admonition-content"><div class="admonition-title">Note</div><p>The workshop only works for games marked with the Workshop badge on the website.</p></div></div>`)}
      ${faqItem("Where are the games downloaded from?", "The game files are downloaded directly from official Steam content servers — the same place Steam downloads them from normally.")}
      ${faqItem("How do I open a Steam game's folder?", "Right-click the game in your Steam Library, then click <strong>Manage → Browse local files</strong>.")}
      ${faqItem("Can I download and play VR games using this?", "Yes.")}

      <div class="faq-section-title">Generator (GhostLua)</div>
      ${faqItem("Why is there no zip file? Why is it just a single .lua file?", "That's completely normal, it's supposed to be like that. Just drag and drop that single file onto SteamTools.")}
      ${faqItem("What does DRM/Restrictions detected mean?", "That means that the game contains extra security measures, and there's no bypass for it available.")}

      <div class="faq-section-title">Troubleshooting</div>
      ${faqItem('Why are games added via SteamTools not appearing or showing as "PURCHASE"? / Steam won\'t open', `Your SteamTools version is outdated. To update SteamTools, join our <a href="https://discord.gg/ghostlua" target="_blank">Discord</a> and get the latest fix command from the #help channel.
      <div class="admonition note" style="margin-top:0.5rem"><div class="admonition-icon"><i class="fa-solid fa-circle-info"></i></div><div class="admonition-content"><div class="admonition-title">Note</div><p>If the fix doesn't work, try using a VPN and running it again.</p></div></div>`)}
      ${faqItem('Why is my download on Steam not starting or failing with "NO INTERNET CONNECTION" or "UNKNOWN ERROR"?', "Keep retrying until it works. If you've been retrying for a while and it's still not working, check the current SteamTools server status.")}
      ${faqItem("How do I stop Windows Defender from deleting my bypass/fix files?", `
        <ol>
          <li>If you use any other antiviruses — uninstall them. Windows Defender is enough.</li>
          <li>Open <strong>Windows Defender</strong> (Windows Security on Windows 11)</li>
          <li>Go to <strong>Virus &amp; Threat protection</strong></li>
          <li>Click <strong>Manage settings</strong> under Virus &amp; Threat protection settings</li>
          <li>Scroll down and click <strong>Add or remove exclusions</strong></li>
          <li>Accept the UAC prompt</li>
          <li>Click <strong>Add an exclusion → Folder</strong></li>
          <li>Select your game folder</li>
        </ol>
      `)}
      ${faqItem('How do I fix the "Content Configuration Unavailable" error?', 'Go to <code>C:\\Program Files (x86)\\Steam\\appcache</code> and delete the <code>appinfo.vdf</code> file.')}
    `
  }
};

function faqItem(q, a) {
  return `
    <div class="faq-item">
      <button class="faq-q" onclick="toggleFaq(this)">
        <span>${q}</span>
        <i class="fa-solid fa-chevron-down fa-xs faq-chevron"></i>
      </button>
      <div class="faq-a">${a}</div>
    </div>
  `;
}

function toggleFaq(btn) {
  const ans = btn.nextElementSibling;
  const isOpen = ans.classList.contains('open');
  btn.classList.toggle('open', !isOpen);
  ans.classList.toggle('open', !isOpen);
}

// ── Navigation ─────────────────────────────────────────────────────────────
const pageOrder = ['intro','beginners','installing','downloading','removing','bypasses','fc26','arc-raiders','among-us','faq'];

function navigate(pageId, pushState = true) {
  const page = pages[pageId];
  if (!page) return;

  // Update active sidebar link
  document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.menu-link[href="#${pageId}"]`);
  if (activeLink) activeLink.classList.add('active');

  // Auto-expand parent categories
  if (['installing','downloading','removing'].includes(pageId)) expandCategory('beginners');
  if (['fc26','arc-raiders','among-us'].includes(pageId)) expandCategory('bypasses');

  // Breadcrumbs
  const breadcrumbHtml = `
    <nav class="breadcrumbs">
      <a href="#intro" onclick="navigate('intro')"><i class="fa-solid fa-house fa-xs"></i></a>
      ${page.breadcrumbs.map((b, i) => `
        <span class="sep">›</span>
        ${b.id
          ? `<a href="#${b.id}" onclick="navigate('${b.id}')">${b.label}</a>`
          : `<span class="current">${b.label}</span>`
        }
      `).join('')}
    </nav>
  `;

  // Prev/Next
  const navHtml = (page.prev || page.next) ? `
    <div class="doc-nav">
      ${page.prev ? `
        <button class="doc-nav-btn prev" onclick="navigate('${page.prev.id}')">
          <span class="doc-nav-label">← Previous</span>
          <span class="doc-nav-title">${page.prev.label}</span>
        </button>` : ''}
      ${page.next ? `
        <button class="doc-nav-btn" onclick="navigate('${page.next.id}')">
          <span class="doc-nav-label">Next →</span>
          <span class="doc-nav-title">${page.next.label}</span>
        </button>` : ''}
    </div>
  ` : '';

  document.getElementById('doc-content').innerHTML =
    breadcrumbHtml + page.render() +
    navHtml;

  document.title = pageId === 'intro'
    ? 'GhostLua Usage Guide'
    : `${page.title} | GhostLua Usage Guide`;

  if (pushState) history.pushState({ pageId }, '', `#${pageId}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeSidebar();
}

// ── Category toggles ───────────────────────────────────────────────────────
function toggleCategory(name) {
  const sub = document.getElementById(`sub-${name}`);
  const caret = document.querySelector(`#cat-${name} .menu-caret`);
  const isOpen = !sub.classList.contains('hidden');
  sub.classList.toggle('hidden', isOpen);
  caret.classList.toggle('open', !isOpen);
}

function expandCategory(name) {
  const sub = document.getElementById(`sub-${name}`);
  const caret = document.querySelector(`#cat-${name} .menu-caret`);
  if (sub && sub.classList.contains('hidden')) {
    sub.classList.remove('hidden');
    caret.classList.add('open');
  }
}

// ── Sidebar (mobile) ───────────────────────────────────────────────────────
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const bd = document.getElementById('sidebar-backdrop');
  const isOpen = sb.classList.contains('open');
  sb.classList.toggle('open', !isOpen);
  bd.classList.toggle('hidden', isOpen);
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-backdrop').classList.add('hidden');
}

// ── Init ───────────────────────────────────────────────────────────────────
window.addEventListener('popstate', e => {
  const id = (e.state && e.state.pageId) || location.hash.slice(1) || 'intro';
  navigate(id, false);
});

document.addEventListener('DOMContentLoaded', () => {
  const hash = location.hash.slice(1);
  navigate(hash && pages[hash] ? hash : 'intro', false);
});
