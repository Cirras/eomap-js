import { app, BrowserWindow, ipcMain, Menu, session } from "electron";
import path from "path";
import { WindowState } from "./window/window-state";
import { removeFirst } from "../../core/util/array-utils";
import { MenuEvent } from "../../core/controllers/menubar-controller";
import { isMac } from "../../core/util/platform-utils";

let windows = [];

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  main();
}

function getLastActiveWindow() {
  return windows[windows.length - 1] || null;
}

function createMenuItemClick(state) {
  let eventType = JSON.stringify(state.eventType);
  let eventDetail = JSON.stringify(state.eventDetail);
  return (_menuItem, _browserWindow, event) => {
    if (event.isAutoRepeat) {
      return;
    }
    let window = getLastActiveWindow();
    if (!window) {
      window = newWindow();
      if (state.eventType === MenuEvent.NewWindow) {
        return;
      }
    }
    window.webContents.executeJavaScript(
      `emitNativeMenuEvent(${eventType}, ${eventDetail});`,
      true
    );
    if (window.isMinimized()) {
      window.restore();
    }
  };
}

function createMenuItemConstructorOptions(state) {
  let result = {
    type: state.type,
    enabled: state.enabled,
  };

  if (result.type === "normal" || result.type === "checkbox") {
    result.label = state.label;
    result.role = state.role;
    if (state.keybinding) {
      result.accelerator = state.keybinding.electronLabel.string;
    }
    if (state.eventType) {
      result.click = createMenuItemClick(state);
    }
  }

  if (result.type === "checkbox") {
    result.checked = state.checked;
  }

  if (result.type === "submenu") {
    result.role = state.role;
    result.label = state.label;
    if (state.menu) {
      result.submenu = state.menu.items.map(createMenuItemConstructorOptions);
    }
  }

  return result;
}

function createMenubarTemplate(state) {
  return state.items.map(createMenuItemConstructorOptions);
}

function getWindowStateFilePath() {
  return path.join(app.getPath("userData"), "window-state.json");
}

function setupCSP() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [`script-src 'self'`],
      },
    });
  });
}

function setupIPC() {
  ipcMain.on("set-menubar-state", (event, state) => {
    let window = BrowserWindow.fromWebContents(event.sender);
    if (window.isFocused()) {
      let template = createMenubarTemplate(state);
      let menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
    }
  });

  ipcMain.on("toggle-developer-tools", (event) => {
    event.sender.toggleDevTools();
  });

  ipcMain.on("window:set-title", (event, title) => {
    let window = BrowserWindow.fromWebContents(event.sender);
    window.setTitle(title);
  });

  ipcMain.on("window:set-document-edited", (event, documentEdited) => {
    let window = BrowserWindow.fromWebContents(event.sender);
    window.setDocumentEdited(documentEdited);
  });

  ipcMain.on("window:set-closable", (event, closable) => {
    let window = BrowserWindow.fromWebContents(event.sender);
    window?.setClosable(closable);
  });

  ipcMain.on("window:new", (_event) => {
    newWindow();
  });

  ipcMain.on("window:minimize", (event) => {
    let window = BrowserWindow.fromWebContents(event.sender);
    window.minimize();
  });

  ipcMain.on("window:restore", (event) => {
    let window = BrowserWindow.fromWebContents(event.sender);
    if (window.isMinimized()) {
      window.restore();
    }
  });

  ipcMain.on("window:maximize", (event) => {
    let window = BrowserWindow.fromWebContents(event.sender);
    window.maximize();
  });

  ipcMain.on("window:unmaximize", (event) => {
    let window = BrowserWindow.fromWebContents(event.sender);
    window.unmaximize();
  });

  ipcMain.on("window:close-request", (event) => {
    event.sender.send("window:close-request");
  });

  ipcMain.on("window:close", (event) => {
    let window = BrowserWindow.fromWebContents(event.sender);
    if (windows.length === 1) {
      let state = WindowState.fromWindow(window);
      state.write(getWindowStateFilePath());
    }
    window.destroy();
    removeFirst(windows, window);
  });

  ipcMain.on("window:toggle-full-screen", (event) => {
    let window = BrowserWindow.fromWebContents(event.sender);
    window.setFullScreen(!window.isFullScreen());
  });

  ipcMain.on("window:maximized-query", (event) => {
    let window = BrowserWindow.fromWebContents(event.sender);
    event.returnValue = window.isMaximized();
  });

  ipcMain.on("window:full-screen-query", (event) => {
    let window = BrowserWindow.fromWebContents(event.sender);
    event.returnValue = window.isFullScreen();
  });
}

function newWindow() {
  const options = {
    width: 1024,
    height: 768,
    backgroundColor: "#1a1a1a",
    show: false,
    frame: isMac(),
    titleBarStyle: "hidden",
    webPreferences: {
      v8CacheOptions: "bypassHeatCheck",
      preload: path.join(__dirname, "preload.js"),
    },
  };

  let state = null;
  let maximize = false;

  if (getLastActiveWindow()) {
    state = WindowState.cascade(getLastActiveWindow());
  } else {
    state = WindowState.read(getWindowStateFilePath());
  }

  if (state && state.isVisibleOnAnyDisplay()) {
    options.x = state.x;
    options.y = state.y;
    options.width = state.width;
    options.height = state.height;
    maximize = state.maximized;
  }

  const window = new BrowserWindow(options);
  const mode = process.env.NODE_ENV || "development";

  if (mode === "development") {
    window.loadURL("http://localhost:9000");
  } else if (app.isPackaged) {
    window.loadFile("dist/electron/index.html");
  } else {
    window.loadFile("index.html");
  }

  window.once("ready-to-show", (_event) => {
    if (maximize) {
      window.maximize();
    }
    window.show();
  });

  window.on("minimize", (_event) => {
    window.webContents.send("window:minimized");
  });

  window.on("restore", (_event) => {
    window.webContents.send("window:restored");
  });

  window.on("maximize", (_event) => {
    window.webContents.send("window:maximized");
  });

  window.on("unmaximize", (_event) => {
    window.webContents.send("window:unmaximized");
  });

  window.on("enter-full-screen", (_event) => {
    window.webContents.send("window:enter-full-screen");
  });

  window.on("leave-full-screen", (_event) => {
    window.webContents.send("window:leave-full-screen");
  });

  window.on("close", (event) => {
    event.preventDefault();
    window.webContents.send("window:close-request");
  });

  window.on("focus", (_event) => {
    removeFirst(windows, window);
    windows.push(window);
    window.webContents.send("window:focus");
  });

  windows.push(window);

  return window;
}

function main() {
  app.on("ready", () => {
    setupCSP();
    setupIPC();
    newWindow();
  });

  app.on(
    "second-instance",
    (_event, _commandLine, _workingDirectory, _additionalData) => {
      newWindow();
    }
  );

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on("window-all-closed", (_event) => {
    if (!isMac()) {
      app.quit();
    }
  });

  app.on("activate", (_event) => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      newWindow();
    }
  });

  // See: https://github.com/electron/electron/issues/28422
  app.commandLine.appendSwitch("enable-experimental-web-platform-features");

  Menu.setApplicationMenu(null);
}
