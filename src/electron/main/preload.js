import { ipcRenderer, contextBridge } from "electron";
import os from "os";

contextBridge.exposeInMainWorld("isElectron", true);

contextBridge.exposeInMainWorld("bridge", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) =>
    ipcRenderer.on(channel, (_event, ...args) => func(args)),
  getTitlebarHeight: () => {
    if (process.platform === "darwin") {
      let osVersion = parseFloat(os.version());
      if (osVersion >= 20) {
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
