import { WebFileSystemHandle } from "./file-system-handle";

export class WebFileSystemFileHandle extends WebFileSystemHandle {
  constructor(handle) {
    super(handle);
  }

  async getFile() {
    return this._handle.getFile();
  }

  async write(data) {
    const writable = await this._handle.createWritable();
    await writable.write(data);
    await writable.close();
  }
}
