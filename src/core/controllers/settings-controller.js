import { get, set } from "idb-keyval";
import { SettingsState } from "../state/settings-state";
import { PendingPromise } from "../util/pending-promise";

export class SettingsController {
  constructor(application) {
    this.application = application;
    this.fileSystemProvider = this.application.fileSystemProvider;
    this.settingsState = new SettingsState();
    this._loadComplete = null;

    this._load().then(() => {
      this._updateApplication();
    });
  }

  updateSettings(settingsState) {
    this.settingsState = settingsState;
    this._updateApplication();
    this._save();
  }

  async _load() {
    let pendingPromise = new PendingPromise();
    this._loadComplete = pendingPromise.promise;

    try {
      const serializedSettings = (await get("settings")) ?? {};
      this.settingsState = this._deserializeSettings(serializedSettings);
      pendingPromise.resolve();
    } catch (e) {
      console.error("Failed to load settings", e);
      pendingPromise.reject(e);
    } finally {
      this._loadComplete = null;
    }
  }

  async _save() {
    try {
      await this._loadComplete;
    } catch {
      return;
    }

    try {
      await set("settings", this._serializeSettings());
    } catch (e) {
      console.error("Failed to save settings", e);
      return;
    }
  }

  _deserializeSettings(serializedSettings) {
    return SettingsState.fromValues(
      this._deserializeHandle(serializedSettings.gfxDirectory),
      this._deserializeHandle(serializedSettings.customAssetsDirectory),
      serializedSettings.connectedModeEnabled ?? false,
      serializedSettings.connectedModeURL ?? "",
    );
  }

  _serializeSettings() {
    return {
      gfxDirectory: this._serializeHandle(this.settingsState.gfxDirectory),
      customAssetsDirectory: this._serializeHandle(
        this.settingsState.customAssetsDirectory,
      ),
      connectedModeEnabled: this.settingsState.connectedModeEnabled,
      connectedModeURL: this.settingsState.connectedModeURL,
    };
  }

  _deserializeHandle(serialized) {
    if (!serialized) {
      return null;
    }
    return this.fileSystemProvider.deserializeHandle(serialized);
  }

  _serializeHandle(handle) {
    if (!handle) {
      return null;
    }
    return this.fileSystemProvider.serializeHandle(handle);
  }

  _updateApplication() {
    this.application.settingsState = this.settingsState;
  }

  hostUpdated() {
    this.fileSystemProvider = this.application.fileSystemProvider;
  }

  get loaded() {
    return this._loadComplete;
  }
}
