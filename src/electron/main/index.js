import { app, BrowserWindow, ipcMain, session } from "electron";
import path from "path";
import { createWindow } from "./window/create";

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
  const mainWindow = createWindow("main", {
    width: 1024,
    height: 768,
    backgroundColor: "#1a1a1a",
    show: false,
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

  mainWindow.on("close", (event) => {
    event.preventDefault();
    mainWindow.webContents.send("close-requested");
  });

  ipcMain.once("window:close", (_event) => {
    mainWindow.emit("pre-destroy");
    mainWindow.destroy();
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
