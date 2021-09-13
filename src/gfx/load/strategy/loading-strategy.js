export class LoadingStrategy {
  async loadEGF(fileID) {
    throw new Error("loadEGF must be implemented");
  }
}
