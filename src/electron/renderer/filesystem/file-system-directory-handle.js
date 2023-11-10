import { ElectronFileSystemFileHandle } from "./file-system-file-handle";
import { ElectronFileSystemHandle } from "./file-system-handle";
import { getDirectoryHandleData, getFileHandleData } from "./fs";

export class ElectronFileSystemDirectoryHandle extends ElectronFileSystemHandle {
  get kind() {
    return "directory";
  }

  async getFileHandle(name, options) {
    const path = this._createPath(name);
    const data = await getFileHandleData(path, !!options?.create);
    return new ElectronFileSystemFileHandle(data.name, data.path);
  }

  async getDirectoryHandle(name, options) {
    const path = this._createPath(name);
    const data = await getDirectoryHandleData(path, !!options?.create);
    return new ElectronFileSystemDirectoryHandle(data.name, data.path);
  }

  _createPath(name) {
    if (name === "") {
      throw new TypeError(`Name can't be an empty string.`);
    }

    if (name === "." || name === ".." || name.includes("/")) {
      throw new TypeError(`Name contains invalid characters.`);
    }

    return this.path + "/" + name;
  }
}
