import { FileSystemHandle } from "../../core/filesystem/file-system-handle";
import { isWindows } from "../../core/util/platform-utils";

export class WebFileSystemHandle extends FileSystemHandle {
  constructor(handle) {
    super();
    this._handle = handle;
  }

  get kind() {
    return this._handle.kind;
  }

  get name() {
    return this._handle.name;
  }

  get path() {
    return (isWindows() ? "\\" : "/") + this._handle.name;
  }

  async isSameEntry(other) {
    return this._handle.isSameEntry(other._handle);
  }

  async queryPermission(descriptor) {
    return this._handle.queryPermission(descriptor);
  }

  async requestPermission(descriptor) {
    return this._handle.requestPermission(descriptor);
  }
}
