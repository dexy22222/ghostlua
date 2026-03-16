// ── First-Time Welcome Overlay ────────────────────────────────────────────────
(function () {
  const SEEN_KEY = 'gl_welcomed';
  let currentStep = 0;
  const totalSteps = 3;

  function show() {
    const el = document.getElementById('welcome-overlay');
    if (el) el.classList.remove('hidden');
  }

  function hide() {
    const el = document.getElementById('welcome-overlay');
    if (el) el.classList.add('hidden');
  }

  function goToStep(n) {
    currentStep = n;
    document.querySelectorAll('.welcome-step').forEach(el => {
      el.classList.toggle('hidden', parseInt(el.dataset.step) !== n);
    });
    document.querySelectorAll('.welcome-dot').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.step) === n);
    });
  }

  window.welcomeNext = function () {
    if (currentStep < totalSteps - 1) goToStep(currentStep + 1);
  };

  window.welcomeBack = function () {
    if (currentStep > 0) goToStep(currentStep - 1);
  };

  window.welcomeDone = function () {
    localStorage.setItem(SEEN_KEY, '1');
    hide();
  };

  // Show for first-time visitors only
  document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem(SEEN_KEY)) {
      setTimeout(show, 400); // slight delay so page renders first
    }
  });
})();
