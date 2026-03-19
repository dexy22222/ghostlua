// ── GhostLua Tier System ─────────────────────────────────────────────────────
// Free: 25/mo | Pro: 500/mo | Master: 2000/mo

const TIERS = {
  free:   { name: 'Free',   limit: 25,   price: 0,    color: '#737373', icon: 'fa-ghost' },
  pro:    { name: 'Pro',    limit: 500,  price: 4.99, color: '#3b82f6', icon: 'fa-bolt' },
  master: { name: 'Master', limit: 2000, price: 9.99, color: '#f59e0b', icon: 'fa-crown' },
};

const TIER_STORAGE_KEY = 'gl_tier';
const DL_COUNT_KEY = 'gl_downloads';

function _getMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getUserTier() {
  try {
    const raw = JSON.parse(localStorage.getItem(TIER_STORAGE_KEY) || 'null');
    if (raw && raw.tier && raw.expiresAt && Date.now() < raw.expiresAt) {
      return raw.tier;
    }
  } catch {}
  return 'free';
}

function setUserTier(tier, durationDays = 30) {
  localStorage.setItem(TIER_STORAGE_KEY, JSON.stringify({
    tier,
    activatedAt: Date.now(),
    expiresAt: Date.now() + durationDays * 86400000,
  }));
  _updateTierBadges();
}

function getDownloadCount() {
  try {
    const raw = JSON.parse(localStorage.getItem(DL_COUNT_KEY) || '{}');
    const month = _getMonthKey();
    return raw.month === month ? (raw.count || 0) : 0;
  } catch { return 0; }
}

function incrementDownloadCount() {
  const month = _getMonthKey();
  const current = getDownloadCount();
  localStorage.setItem(DL_COUNT_KEY, JSON.stringify({ month, count: current + 1 }));
  _updateTierBadges();
}

function getDownloadLimit() {
  const tier = getUserTier();
  return TIERS[tier]?.limit || 25;
}

function getRemainingDownloads() {
  return Math.max(0, getDownloadLimit() - getDownloadCount());
}

function canDownload() {
  return getDownloadCount() < getDownloadLimit();
}

function getTierInfo() {
  const tier = getUserTier();
  return {
    ...TIERS[tier],
    id: tier,
    used: getDownloadCount(),
    remaining: getRemainingDownloads(),
    percentage: Math.min(100, Math.round((getDownloadCount() / getDownloadLimit()) * 100)),
  };
}

// ── UI Updates ───────────────────────────────────────────────────────────────
function _updateTierBadges() {
  const info = getTierInfo();
  document.querySelectorAll('.tier-badge').forEach(el => {
    el.innerHTML = `<i class="fa-solid ${TIERS[info.id].icon} text-[9px]" style="color:${info.color}"></i>
      <span style="color:${info.color}">${info.name}</span>
      <span class="text-neutral-700">·</span>
      <span class="text-neutral-500">${info.remaining} left</span>`;
  });
  document.querySelectorAll('.tier-progress-bar').forEach(el => {
    el.style.width = info.percentage + '%';
    el.style.background = info.color;
  });
}

function showUpgradePrompt() {
  const tier = getUserTier();
  const nextTier = tier === 'free' ? 'pro' : 'master';
  const next = TIERS[nextTier];
  const modal = document.getElementById('generic-modal');
  if (!modal) return;
  document.getElementById('modal-title').textContent = 'Download Limit Reached';
  document.getElementById('modal-content').innerHTML = `
    <div class="text-center mb-4">
      <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-3">
        <i class="fa-solid fa-lock text-amber-400 text-xl"></i>
      </div>
      <p class="text-neutral-400 text-sm mb-1">You've used all <strong class="text-white">${getDownloadLimit()}</strong> downloads this month.</p>
      <p class="text-neutral-600 text-xs">Upgrade to continue downloading.</p>
    </div>
    <a href="pricing.html" class="block w-full py-3 rounded-xl text-center font-bold text-sm transition-all
      ${nextTier === 'pro' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-amber-500 hover:bg-amber-400 text-black'}">
      <i class="fa-solid ${next.icon} text-xs mr-1.5"></i>
      Upgrade to ${next.name} — $${next.price}/mo
    </a>
    <div class="mt-3 text-center">
      <a href="pricing.html" class="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">View all plans</a>
    </div>`;
  modal.classList.remove('hidden');
}

// Init on load
document.addEventListener('DOMContentLoaded', () => {
  _updateTierBadges();
});

// Expose
window.TIERS = TIERS;
window.getUserTier = getUserTier;
window.setUserTier = setUserTier;
window.getDownloadCount = getDownloadCount;
window.incrementDownloadCount = incrementDownloadCount;
window.canDownload = canDownload;
window.getRemainingDownloads = getRemainingDownloads;
window.getTierInfo = getTierInfo;
window.showUpgradePrompt = showUpgradePrompt;
