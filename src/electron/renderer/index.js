import { getApplication, getTheme, installApplication } from "../../core";

import "./components/titlebar";

import { ElectronFileSystemProvider } from "./filesystem/file-system-provider";
import { SettingsController } from "../../core/controllers/settings-controller";
import { RecentFilesController } from "../../core/controllers/recent-files-controller";
import {
  DOMMenuEventSource,
  MenubarController,
  MenuEventSource,
} from "../../core/controllers/menubar-controller";
import { titleFromMapState } from "../../core/util/title-utils";
import { isMac } from "../../core/util/platform-utils";

let menubarController = null;
let nativeMenuEventSource = new MenuEventSource();

function getTitlebar() {
  return document.getElementById("titlebar");
}

function setupTitlebar() {
  let titlebar = document.createElement("eomap-titlebar");
  titlebar.id = "titlebar";
  titlebar.maximized = bridge.isMaximized();
  titlebar.fullScreen = bridge.isFullScreen();
  getTheme().appendChild(titlebar);
}

function setupApplication() {
  const application = installApplication();
  application.fileSystemProvider = new ElectronFileSystemProvider();
  application.addEventListener("map-state-changed", (event) => {
    let mapState = event.detail;
    let title = titleFromMapState(mapState);
    getTitlebar().title = title;
    bridge.setTitle(title);
    bridge.setDocumentEdited(mapState.dirty);
  });
  application.addEventListener("has-open-prompt-changed", (event) => {
    let hasOpenPrompt = event.detail;
    if (hasOpenPrompt) {
      bridge.restore();
    }
    bridge.setClosable(!hasOpenPrompt);
  });
}

function setupControllers() {
  let application = getApplication();
  let titlebar = getTitlebar();

  application.settingsController = new SettingsController(application);
  application.recentFilesController = new RecentFilesController(application);

  menubarController = new MenubarController(application);
  menubarController.addEventSource(new DOMMenuEventSource(titlebar));
  menubarController.addEventSource(nativeMenuEventSource);
  if (isMac()) {
    menubarController.on("menubar-state-updated", (state) => {
      bridge.setMenubarState(state);
    });
    bridge.receive("window:focus", () => {
      bridge.setMenubarState(menubarController.state);
    });
  }

  titlebar.menubarController = menubarController;
}

function setupKeyboardEvents() {
  window.addEventListener("keydown", (event) => {
    if (isFullScreenShortcut(event)) {
      bridge.toggleFullScreen();
      event.stopPropagation();
      event.preventDefault();
    }
  });
}

function isFullScreenShortcut(event) {
  if (isMac()) {
    return event.ctrlKey && event.metaKey && event.key.toUpperCase() === "F";
  } else {
    return event.key === "F11";
  }
}

bridge.receive("window:close-request", () => {
  let application = getApplication();
  let callback = () => {
    menubarController.closed = true;
    bridge.close();
  };

  if (application) {
    if (!application.prompt.open) {
      application.dirtyCheck(callback);
    }
  } else {
    callback();
  }
});

bridge.receive("window:minimized", () => {
  menubarController.minimized = true;
});

bridge.receive("window:restored", () => {
  menubarController.minimized = false;
});

bridge.receive("window:maximized", () => {
  getTitlebar().maximized = true;
});

bridge.receive("window:unmaximized", () => {
  getTitlebar().maximized = false;
});

bridge.receive("window:enter-full-screen", () => {
  getTitlebar().fullScreen = true;
});

bridge.receive("window:leave-full-screen", () => {
  getTitlebar().fullScreen = false;
});

bridge.receive("window:focus", () => {
  getTitlebar().inactive = false;
});

bridge.receive("window:blur", () => {
  getTitlebar().inactive = true;
});

window.addEventListener("DOMContentLoaded", async (_event) => {
  setupTitlebar();
  // Defer to next tick
  await new Promise((resolve) => setTimeout(resolve, 0));
  setupApplication();
  setupControllers();
  setupKeyboardEvents();
});

window.emitNativeMenuEvent = function (eventType, eventDetail) {
  nativeMenuEventSource.emit(
    new CustomEvent(eventType, { detail: eventDetail })
  );
};
