(function () {
  const KEY = 'scimath-theme';
  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
  }
  // Default = light
  const saved = localStorage.getItem(KEY) || 'light';
  apply(saved);

  window.toggleTheme = function () {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    apply(cur === 'light' ? 'dark' : 'light');
  };

  function moonSVG() {
    return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }
  function sunSVG() {
    return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  }

  window.makeThemeToggle = function(extraStyle='') {
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.title = 'สลับธีม';
    if (extraStyle) btn.style.cssText = extraStyle;
    btn.onclick = window.toggleTheme;
    btn.innerHTML = `<span class="icon-moon">${moonSVG()}</span><span class="icon-sun">${sunSVG()}</span>`;
    return btn;
  };

  function inject() {
    if (document.getElementById('__theme-btn')) return;
    const slot =
      document.querySelector('.nav-inner .flex.items-center') ||
      document.querySelector('.nav-inner > div:last-child') ||
      document.querySelector('.topbar .flex.items-center.gap-3') ||
      document.querySelector('.top-bar > div:last-child');
    if (!slot) return;
    const btn = window.makeThemeToggle();
    btn.id = '__theme-btn';
    slot.prepend(btn);
  }
  document.addEventListener('DOMContentLoaded', () => { inject(); setTimeout(inject, 400); });
})();
