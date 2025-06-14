import { installApplication, getApplication } from "../core/index";
import { WebFileSystemProvider } from "./filesystem/file-system-provider";
import { SettingsController } from "../core/controllers/settings-controller";
import { RecentFilesController } from "../core/controllers/recent-files-controller";
import {
  DOMMenuEventSource,
  MenubarController,
} from "../core/controllers/menubar-controller";
import { titleFromMapState } from "../core/util/title-utils";

function setupApplication() {
  const application = installApplication();
  application.fileSystemProvider = new WebFileSystemProvider();
  application.addEventListener("map-state-changed", (event) => {
    const mapState = event.detail;
    document.title = titleFromMapState(mapState);
  });
}

function setupControllers() {
  let application = getApplication();

  application.settingsController = new SettingsController(application);
  application.recentFilesController = new RecentFilesController(application);
  application.menubarController = new MenubarController(application);

  application.menubarController.addEventSource(
    new DOMMenuEventSource(application),
  );
}

window.addEventListener("DOMContentLoaded", (_event) => {
  setupApplication();
  setupControllers();
});
