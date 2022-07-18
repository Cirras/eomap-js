export class FileSystemHandle {
  get kind() {
    throw new Error("FileSystemHandle.kind() must be implemented");
  }

  get name() {
    throw new Error("FileSystemHandle.name() must be implemented");
  }

  get path() {
    throw new Error("FileSystemHandle.path() must be implemented");
  }

  async isSameEntry(_other) {
    throw new Error("FileSystemHandle.isSameEntry() must be implemented");
  }

  async queryPermission(_descriptor) {
    throw new Error("FileSystemHandle.queryPermission() must be implemented");
  }

  async requestPermission(_descriptor) {
    throw new Error("FileSystemHandle.requestPermission() must be implemented");
  }
}
