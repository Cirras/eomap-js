import { get, set } from "idb-keyval";
import { asyncFilter } from "../util/array-utils";
import { PendingPromise } from "../util/pending-promise";
import { isElectron } from "../util/platform-utils";

export class RecentFilesController {
  static MAX_RECENT_FILES = 50;

  constructor(application) {
    this.application = application;
    this.fileSystemProvider = this.application.fileSystemProvider;
    this.recentFiles = [];
    this._broadcastChannel = new BroadcastChannel("recent-files-controller");
    this._loadComplete = null;

    this._broadcastChannel.addEventListener("message", (event) => {
      this._restoreRecentFiles(event.data);
      this._updateApplication();
    });

    this._load().then(() => {
      this._updateApplication();
    });
  }

  async _load() {
    await this._loadComplete;

    let pendingPromise = new PendingPromise();
    this._loadComplete = pendingPromise.promise;

    try {
      const serializedRecentFiles = (await get("recentFiles")) || [];
      await this._restoreRecentFiles(serializedRecentFiles);
      pendingPromise.resolve();
    } catch (e) {
      console.error("Failed to load recent files", e);
      pendingPromise.reject(e);
    } finally {
      this._loadComplete = null;
    }
  }

  async _restoreRecentFiles(serializedRecentFiles) {
    this.recentFiles = serializedRecentFiles.map((handle) =>
      this.fileSystemProvider.deserializeHandle(handle)
    );
  }

  _updateApplication() {
    this.application.recentFiles = this.recentFiles;
  }

  _updateRecentDocuments() {
    if (isElectron()) {
      window.bridge.setRecentDocuments(
        this.recentFiles.map((handle) => handle.path)
      );
    }
  }

  async _saveRecentFiles() {
    let serializedRecentFiles = this.recentFiles.map((handle) =>
      this.fileSystemProvider.serializeHandle(handle)
    );

    try {
      await set("recentFiles", serializedRecentFiles);
    } catch (e) {
      console.error("Failed to save recent files", e);
      return;
    }

    this._broadcastChannel.postMessage(serializedRecentFiles);
    this._updateApplication();
    this._updateRecentDocuments();
  }

  async _doRemoveRecentFile(handle) {
    this.recentFiles = await asyncFilter(
      this.recentFiles,
      async (recent) => !(await recent.isSameEntry(handle))
    );
  }

  async addRecentFile(handle) {
    await this._load();
    await this._doRemoveRecentFile(handle);

    this.recentFiles.unshift(handle);
    while (this.recentFiles.length > RecentFilesController.MAX_RECENT_FILES) {
      this.recentFiles.pop();
    }

    this._saveRecentFiles();
  }

  async removeRecentFile(handle) {
    await this._load();
    await this._doRemoveRecentFile(handle);
    this._saveRecentFiles();
  }

  async clearRecentFiles() {
    await this._load();
    this.recentFiles.length = 0;
    this._saveRecentFiles();
  }

  async hasRecentFile(handle) {
    let matched = await asyncFilter(this.recentFiles, async (recent) =>
      recent.isSameEntry(handle)
    );
    return matched.length > 0;
  }

  hostUpdated() {
    this.fileSystemProvider = this.application.fileSystemProvider;
  }
}
