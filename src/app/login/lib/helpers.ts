export function isInAppBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Line\/|Instagram|FBAN|FBAV|Twitter|MicroMessenger|WhatsApp|Snapchat/i.test(ua);
}

export function isLineBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /Line\//i.test(navigator.userAgent);
}
