import { ipcRenderer, contextBridge } from "electron";
import os from "os";

contextBridge.exposeInMainWorld("_isElectron", true);

contextBridge.exposeInMainWorld("bridge", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) =>
    ipcRenderer.on(channel, (_event, ...args) => func(args)),
  getPlatform: () => os.platform(),
  getTitlebarHeight: () => {
    if (os.platform() === "darwin") {
      let release = parseFloat(os.release());
      if (release >= 20) {
        return 28;
      }
      return 20;
    }
    return 30;
  },
  setMenubarState(state) {
    ipcRenderer.send("set-menubar-state", state);
  },
  toggleDevTools: () => {
    ipcRenderer.send("toggle-developer-tools");
  },
  setTitle: (title) => {
    ipcRenderer.send("window:set-title", title);
  },
  minimize: () => {
    ipcRenderer.send("window:minimize");
  },
  maximize: () => {
    ipcRenderer.send("window:maximize");
  },
  unmaximize: () => {
    ipcRenderer.send("window:unmaximize");
  },
  requestClose: () => {
    ipcRenderer.send("window:close-request");
  },
  isMaximized: () => {
    return ipcRenderer.sendSync("window:maximized-query");
  },
});
