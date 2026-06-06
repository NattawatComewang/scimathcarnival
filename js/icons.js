// icons.js — safe lucide initializer
(function () {
  function init() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // 1. ทันทีถ้า lucide พร้อมแล้ว
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 2. MutationObserver — สร้าง icon ทุกครั้งที่ DOM เปลี่ยน
  // debounce เพื่อไม่ให้เรียกถี่เกิน
  let timer;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(init, 60);
  });

  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true });
  });

  // 3. expose ให้เรียกจากที่อื่นได้
  window.__initIcons = init;
})();
