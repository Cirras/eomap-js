export class LoadingStrategy {
  async loadEGF(_filename) {
    throw new Error("LoadingStrategy.loadEGF() must be implemented");
  }

  async loadRaw(_path) {
    throw new Error("LoadingStrategy.loadRaw() must be implemented");
  }

  abort() {
    // do nothing
  }
}
