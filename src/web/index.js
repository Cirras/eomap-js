import { installApplication, getApplication } from "../core/index";
import {
  DOMMenuEventSource,
  MenubarController,
} from "../core/controllers/menubar-controller";

let menubarController = null;

function setupMenubarController() {
  let application = getApplication();

  menubarController = new MenubarController(application);
  menubarController.addEventSource(new DOMMenuEventSource(application));

  application.menubarController = menubarController;
}

window.addEventListener("DOMContentLoaded", (_event) => {
  installApplication();
  setupMenubarController();
});
