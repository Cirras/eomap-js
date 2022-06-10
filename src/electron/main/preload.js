import { ipcRenderer, contextBridge } from "electron";
import os from "os";

contextBridge.exposeInMainWorld("_isElectron", true);

contextBridge.exposeInMainWorld("bridge", {
  receive: (channel, func) =>
    ipcRenderer.on(channel, (_event, ...args) => func(args)),
  getPlatform: () => os.platform(),
  getRelease: () => os.release(),
  setMenubarState(state) {
    ipcRenderer.send("set-menubar-state", state);
  },
  toggleDevTools: () => {
    ipcRenderer.send("toggle-developer-tools");
  },
  setTitle: (title) => {
    ipcRenderer.send("window:set-title", title);
  },
  setDocumentEdited: (documentEdited) => {
    ipcRenderer.send("window:set-document-edited", documentEdited);
  },
  setClosable: (closable) => {
    ipcRenderer.send("window:set-closable", closable);
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
  close: () => {
    ipcRenderer.send("window:close");
  },
  toggleFullScreen: () => {
    ipcRenderer.send("window:toggle-full-screen");
  },
  isMaximized: () => {
    return ipcRenderer.sendSync("window:maximized-query");
  },
  isFullScreen: () => {
    return ipcRenderer.sendSync("window:full-screen-query");
  },
});
