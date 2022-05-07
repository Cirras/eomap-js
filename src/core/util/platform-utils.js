let _isMacintosh = false;
let _isWindows = false;

if (isElectron()) {
  _isMacintosh = window.bridge.getPlatform() === "darwin";
  _isWindows = window.bridge.getPlatform() === "win32";
} else {
  _isMacintosh = navigator.userAgent.indexOf("Macintosh") >= 0;
  _isWindows = navigator.userAgent.indexOf("Windows") >= 0;
}

export function isMac() {
  return _isMacintosh;
}

export function isWindows() {
  return _isWindows;
}

export function isElectron() {
  return !!window._isElectron;
}
