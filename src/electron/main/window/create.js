import { app, BrowserWindow, screen } from "electron";
import path from "path";
import fs from "fs";

function getStateFilePath(name) {
  return path.join(app.getPath("userData"), `window-state-${name}.json`);
}

function restoreWindowState(name) {
  const statePath = getStateFilePath(name);
  try {
    return JSON.parse(fs.readFileSync(statePath));
  } catch (e) {
    console.error("Failed to restore window state", e);
    return null;
  }
}

function saveWindowState(name, window) {
  const statePath = getStateFilePath(name);

  const bounds = window.getNormalBounds();
  const state = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    maximized: window.isMaximized(),
  };

  try {
    fs.writeFileSync(statePath, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save window state", e);
  }
}

function isValidState(state) {
  return (
    state &&
    Number.isInteger(state.x) &&
    Number.isInteger(state.y) &&
    Number.isInteger(state.width) &&
    Number.isInteger(state.height) &&
    typeof state.maximized === "boolean"
  );
}

function windowWithinBounds(state, bounds) {
  return (
    state.x + state.width >= bounds.x &&
    state.x < bounds.x + bounds.width &&
    state.y >= bounds.y &&
    state.y < bounds.y + bounds.height
  );
}

export function createWindow(name, options) {
  const state = restoreWindowState(name);
  let maximize = false;

  if (isValidState(state)) {
    const visible = screen.getAllDisplays().some((display) => {
      return windowWithinBounds(state, display.bounds);
    });
    if (visible) {
      options.x = state.x;
      options.y = state.y;
      options.width = state.width;
      options.height = state.height;
      maximize = state.maximized;
    }
  }

  let window = new BrowserWindow(options);

  window.on("ready-to-show", () => {
    if (maximize) {
      window.maximize();
    }
  });

  window.on("pre-destroy", () => {
    saveWindowState(name, window);
  });

  return window;
}
