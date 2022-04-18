import { ipcRenderer, contextBridge } from "electron";

contextBridge.exposeInMainWorld("bridge", {
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) =>
    ipcRenderer.on(channel, (_event, ...args) => func(args)),
});
