import { FileSystemHandle } from "./file-system-handle";

export class FileSystemDirectoryHandle extends FileSystemHandle {
  async getFileHandle(_name, _options) {
    throw new Error(
      "FileSystemDirectoryHandle.getFileHandle() must be implemented",
    );
  }

  async getDirectoryHandle(_name, _options) {
    throw new Error(
      "FileSystemDirectoryHandle.getDirectoryHandle() must be implemented",
    );
  }
}
