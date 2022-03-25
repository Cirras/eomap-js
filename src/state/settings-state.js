export class SettingsState {
  gfxDirectory = null;
  customAssetsDirectory = null;
  connectedModeEnabled = false;
  connectedModeURL = "";

  static fromValues(
    gfxDirectory,
    customAssetsDirectory,
    connectedModeEnabled,
    connectedModeURL
  ) {
    let result = new SettingsState();
    result.gfxDirectory = gfxDirectory;
    result.customAssetsDirectory = customAssetsDirectory;
    result.connectedModeEnabled = connectedModeEnabled;
    result.connectedModeURL = connectedModeURL;
    return result;
  }

  static fromIDB(settings) {
    if (settings === undefined) {
      settings = {};
    }

    let result = new SettingsState();

    for (let property in result) {
      if (property in settings) {
        result[property] = settings[property];
      }
    }

    return result;
  }
}
