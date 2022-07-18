import { isWindows } from "../../../core/util/platform-utils";

export class ElectronFileSystemHandle {
  constructor(name, path) {
    this._name = name;
    this._path = path;
  }

  get kind() {
    throw new Error("ElectronFileSystemHandle.kind() must be implemented");
  }

  get name() {
    return this._name;
  }

  get path() {
    return this._path;
  }

  async isSameEntry(other) {
    if (isWindows()) {
      return this._path.toLowerCase() === other._path.toLowerCase();
    } else {
      return this._path === other._path;
    }
  }

  async queryPermission(_descriptor) {
    return "granted";
  }

  async requestPermission(_descriptor) {
    return "granted";
  }
}
