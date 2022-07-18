import { FileSystemHandle } from "./file-system-handle";

export class FileSystemFileHandle extends FileSystemHandle {
  async getFile() {
    throw new Error("FileSystemFileHandle.getFile() must be implemented");
  }

  async write(_data) {
    throw new Error("FileSystemFileHandle.write() must be implemented");
  }
}
