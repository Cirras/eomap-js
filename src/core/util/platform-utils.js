let _isElectron = false;
let _isMacintosh = false;
let _isWindows = false;

if (typeof process !== "undefined") {
  // Electron main process
  _isElectron = true;
  _isMacintosh = process.platform === "darwin";
  _isWindows = process.platform === "win32";
} else if (window._isElectron) {
  // Electron renderer process
  _isElectron = true;
  _isMacintosh = window.bridge.getPlatform() === "darwin";
  _isWindows = window.bridge.getPlatform() === "win32";
} else {
  // Web
  _isElectron = false;
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
  return _isElectron;
}
