export class LoadingStrategy {
  getEGFFilename(id) {
    return "gfx" + id.toString().padStart(3, "0") + ".egf";
  }

  async loadEGF(id) {
    throw new Error("loadEGF must be implemented");
  }
}
