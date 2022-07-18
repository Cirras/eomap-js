export class FileSystemProvider {
  async showOpenFilePicker(_options) {
    throw new Error(
      "FileSystemProvider.showOpenFilePicker() must be implemented"
    );
  }

  async showSaveFilePicker(_options) {
    throw new Error(
      "FileSystemProvider.showSaveFilePicker() must be implemented"
    );
  }

  async showDirectoryPicker(_options) {
    throw new Error(
      "FileSystemProvider.showDirectoryPicker() must be implemented"
    );
  }

  async dataTransferItemToHandle(_dataTransferItem) {
    throw new Error(
      "FileSystemProvider.dataTransferItemToHandle() must be implemented"
    );
  }

  serializeHandle(_handle) {
    throw new Error("FileSystemProvider.serializeHandle() must be implemented");
  }

  deserializeHandle(_serialized) {
    throw new Error(
      "FileSystemProvider.deserializeHandle() must be implemented"
    );
  }

  get supported() {
    throw new Error("FileSystemProvider.supported() must be implemented");
  }
}
