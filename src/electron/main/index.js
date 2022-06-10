import { app, BrowserWindow, ipcMain, Menu, session } from "electron";
import path from "path";
import { createWindow } from "./window/create";

let mainWindow = null;

const createMenuItemConstructorOptions = (state) => {
  let result = {
    type: state.type,
    enabled: state.enabled,
  };

  if (result.type === "normal" || result.type === "checkbox") {
    result.label = state.label;
    result.role = state.role;
    result.accelerator = state.accelerator;
    result.registerAccelerator = state.registerAccelerator;
    if (state.eventType) {
      let eventType = JSON.stringify(state.eventType);
      let eventDetail = JSON.stringify(state.eventDetail);
      result.click = (_menuItem, browserWindow, _event) => {
        browserWindow.webContents.executeJavaScript(
          `emitNativeMenuEvent(${eventType}, ${eventDetail});`,
          true
        );
      };
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
};

const createMenubarTemplate = (state) => {
  return state.items.map(createMenuItemConstructorOptions);
};

const setupCSP = () => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [`script-src 'self'`],
      },
    });
  });
};

const setupWindow = () => {
  mainWindow = createWindow("main", {
    width: 1024,
    height: 768,
    backgroundColor: "#1a1a1a",
    show: false,
    frame: process.platform === "darwin",
    titleBarStyle: "hidden",
    webPreferences: {
      v8CacheOptions: "bypassHeatCheck",
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const mode = process.env.NODE_ENV || "development";

  if (mode === "development") {
    mainWindow.loadURL("http://localhost:9000");
  } else if (app.isPackaged) {
    mainWindow.loadFile("dist/electron/index.html");
  } else {
    mainWindow.loadFile("index.html");
  }

  mainWindow.once("ready-to-show", (_event) => {
    mainWindow.show();
  });

  mainWindow.on("maximize", (_event) => {
    mainWindow.webContents.send("window:maximized");
  });

  mainWindow.on("unmaximize", (_event) => {
    mainWindow.webContents.send("window:unmaximized");
  });

  mainWindow.on("close", (event) => {
    event.preventDefault();
    mainWindow.webContents.send("window:close-request");
  });

  ipcMain.on("set-menubar-state", (_event, state) => {
    let template = createMenubarTemplate(state);
    let menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  });

  ipcMain.on("toggle-developer-tools", (_event) => {
    mainWindow.webContents.toggleDevTools();
  });

  ipcMain.on("window:set-title", (_event, title) => {
    mainWindow.setTitle(title);
  });

  ipcMain.on("window:close-request", (_event) => {
    mainWindow.webContents.send("window:close-request");
  });

  ipcMain.on("window:minimize", (_event) => {
    mainWindow.minimize();
  });

  ipcMain.on("window:maximize", (_event) => {
    mainWindow.maximize();
  });

  ipcMain.on("window:unmaximize", (_event) => {
    mainWindow.unmaximize();
  });

  ipcMain.on("window:maximized-query", (event) => {
    event.returnValue = mainWindow.isMaximized();
  });

  ipcMain.once("window:close", (_event) => {
    mainWindow.emit("pre-destroy");
    mainWindow.destroy();
    mainWindow = null;
  });
};

app.on("ready", () => {
  setupCSP();
  setupWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", (_event) => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", (_event) => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    setupWindow();
  }
});

// See: https://github.com/electron/electron/issues/28422
app.commandLine.appendSwitch("enable-experimental-web-platform-features");

Menu.setApplicationMenu(null);
