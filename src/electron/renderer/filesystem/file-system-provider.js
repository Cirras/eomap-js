import { isElectron } from "../../../core/util/platform-utils";
import { ElectronFileSystemDirectoryHandle } from "./file-system-directory-handle";
import { ElectronFileSystemFileHandle } from "./file-system-file-handle";
import { getHandleData, showOpenDialog, showSaveDialog } from "./fs";

export class ElectronFileSystemProvider {
  async showOpenFilePicker(options) {
    const openOptions = this._optionsToOpenOptions(options);
    openOptions.properties.push("openFile");

    return (await showOpenDialog(openOptions)).map((data) =>
      this._dataToHandle(data),
    );
  }

  async showSaveFilePicker(options) {
    const saveOptions = this._optionsToSaveOptions(options);

    const data = await showSaveDialog(saveOptions);
    return this._dataToHandle(data);
  }

  async showDirectoryPicker(options) {
    const openOptions = this._optionsToOpenOptions(options);
    openOptions.properties.push("openDirectory");

    const [data] = await showOpenDialog(openOptions);
    return this._dataToHandle(data);
  }

  async dataTransferItemToHandle(dataTransferItem) {
    const file = dataTransferItem.getAsFile();
    return this._pathToHandle(file.path);
  }

  serializeHandle(handle) {
    return {
      name: handle.name,
      path: handle.path,
      kind: handle.kind,
    };
  }

  deserializeHandle(serialized) {
    return this._dataToHandle(serialized);
  }

  async _pathToHandle(path) {
    const data = await getHandleData(path);
    return this._dataToHandle(data);
  }

  _dataToHandle(data) {
    this._validateHandleData(data);
    switch (data.kind) {
      case "file":
        return new ElectronFileSystemFileHandle(data.name, data.path);
      case "directory":
        return new ElectronFileSystemDirectoryHandle(data.name, data.path);
    }
  }

  _validateHandleData(data) {
    if (
      data.name === undefined ||
      data.path === undefined ||
      data.kind === undefined
    ) {
      throw new Error("Invalid File System handle data");
    }
  }

  _filtersFromOptions(options) {
    const filters = [];

    if (!options.excludeAcceptAllOption) {
      filters.push({ name: "All Files", extensions: ["*"] });
    }

    for (const type of options.types ?? []) {
      const name = type.description ?? "";
      const extensions = [];
      for (const acceptExtensions of Object.values(type.accept)) {
        acceptExtensions
          .map((extension) => extension.substring(1)) // Remove the '.'
          .forEach((extension) => extensions.push(extension));
      }
      filters.push({
        name,
        extensions,
      });
    }

    return filters;
  }

  _optionsToOpenOptions(options) {
    if (options === undefined) {
      options = {};
    }

    const result = {
      properties: ["dontAddToRecent"],
      filters: this._filtersFromOptions(options),
    };

    if (options.multiple) {
      result.properties.push("multiSelections");
    }

    if (options.startIn instanceof ElectronFileSystemDirectoryHandle) {
      result.defaultPath = options.startIn.path;
    }

    return result;
  }

  _optionsToSaveOptions(options) {
    if (options === undefined) {
      options = {};
    }

    const result = {
      properties: ["dontAddToRecent"],
      filters: this._filtersFromOptions(options),
    };

    if (options.suggestedName) {
      result.defaultPath = options.suggestedName;
    }

    return result;
  }

  get supported() {
    return isElectron();
  }
}
