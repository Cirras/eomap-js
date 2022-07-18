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
  setRecentDocuments: (recentDocuments) => {
    ipcRenderer.send("set-recent-documents", recentDocuments);
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
  newWindow: () => {
    ipcRenderer.send("window:new");
  },
  minimize: () => {
    ipcRenderer.send("window:minimize");
  },
  restore: () => {
    ipcRenderer.send("window:restore");
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
  fs: {
    showOpenDialog: (options) => {
      return ipcRenderer.invoke(`fs:show-open-dialog`, options);
    },
    showSaveDialog: (options) => {
      return ipcRenderer.invoke(`fs:show-save-dialog`, options);
    },
    getHandleData: (path) => {
      return ipcRenderer.invoke(`fs:get-handle-data`, path);
    },
    getFileHandleData: (path, create) => {
      return ipcRenderer.invoke(`fs:get-file-handle-data`, path, create);
    },
    getDirectoryHandleData: (path, create) => {
      return ipcRenderer.invoke(`fs:get-directory-handle-data`, path, create);
    },
    readFile: (path) => {
      return ipcRenderer.invoke(`fs:read-file`, path);
    },
    writeFile: (path, data) => {
      return ipcRenderer.invoke(`fs:write-file`, path, data);
    },
  },
});
