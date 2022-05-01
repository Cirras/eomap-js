import { getApplication, getTheme, installApplication } from "../../core";

import "./components/titlebar";

import {
  DOMMenuEventSource,
  MenubarController,
} from "../../core/controllers/menubar-controller";
import { titleFromMapState } from "../../core/util/title-utils";

let menubarController = null;

function getTitlebar() {
  return document.getElementById("titlebar");
}

function setupTitlebar() {
  let titlebar = document.createElement("eomap-titlebar");
  titlebar.id = "titlebar";
  titlebar.maximized = bridge.isMaximized();
  getTheme().appendChild(titlebar);
}

function setupApplication() {
  let application = installApplication();
  application.addEventListener("map-state-changed", (event) => {
    let mapState = event.detail;
    let title = titleFromMapState(mapState);
    getTitlebar().title = title;
    bridge.setTitle(title);
  });
}

function setupMenubarController() {
  let application = getApplication();
  let titlebar = getTitlebar();

  menubarController = new MenubarController(application);
  menubarController.addEventSource(new DOMMenuEventSource(titlebar));
  menubarController.on("menubar-state-updated", (state) => {
    titlebar.menubarState = state;
  });
}

bridge.receive("window:close-request", () => {
  let application = getApplication();
  let callback = () => {
    bridge.send("window:close");
  };

  if (application) {
    if (!application.prompt.open) {
      application.dirtyCheck(callback);
    }
  } else {
    callback();
  }
});

bridge.receive("window:maximized", () => {
  getTitlebar().maximized = true;
});

bridge.receive("window:unmaximized", () => {
  getTitlebar().maximized = false;
});

window.addEventListener("DOMContentLoaded", (_event) => {
  setupTitlebar();
  setupApplication();
  setupMenubarController();
});
