import { ElectronFileSystemHandle } from "./file-system-handle";
import { readFile, writeFile } from "./fs";

export class ElectronFileSystemFileHandle extends ElectronFileSystemHandle {
  get kind() {
    return "file";
  }

  async getFile() {
    const buffer = await readFile(this.path);
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    return new File([blob], this.name, { type: "application/octet-stream" });
  }

  async write(data) {
    return writeFile(this.path, data);
  }
}
