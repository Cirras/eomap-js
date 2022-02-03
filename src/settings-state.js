export class SettingsState {
  gfxDirectory = null;
  customAssetsDirectory = null;

  static fromValues(gfxDirectory, customAssetsDirectory) {
    let result = new SettingsState();
    result.gfxDirectory = gfxDirectory;
    result.customAssetsDirectory = customAssetsDirectory;
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
