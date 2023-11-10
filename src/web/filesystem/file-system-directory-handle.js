import { WebFileSystemHandle } from "./file-system-handle";

export class WebFileSystemDirectoryHandle extends WebFileSystemHandle {
  async getFileHandle(name, options) {
    return this._handle.getFileHandle(name, options);
  }

  async getDirectoryHandle(name) {
    return this._handle.getDirectoryHandle(name, options);
  }
}
