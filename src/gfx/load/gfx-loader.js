import { DIBReader } from "./dib-reader";
import { PEReader } from "./pe-reader";

export class GFXLoader {
  constructor(loadingStrategy) {
    this.loadingStrategy = loadingStrategy;
    this.egfs = new Map();
  }

  async loadEGF(id) {
    if (this.egfs.has(id)) {
      return this.egfs.get(id);
    }
    return this.loadingStrategy
      .loadEGF(id)
      .then((buffer) => {
        let egf = new PEReader(buffer);
        this.egfs.set(id, egf);
        return egf;
      })
      .catch((e) => {
        console.error("Failed to load EGF %d: %s", id, e.message);
      });
  }

  info(file, id) {
    let egf = this.egfs.get(file);
    if (egf) {
      return egf.getResourceInfo(id);
    }
    return null;
  }

  async loadResource(file, id) {
    let egf = this.egfs.get(file);
    if (egf) {
      let info = this.info(file, id);
      if (info) {
        let dib = egf.getResource(info);
        try {
          let reader = new DIBReader(dib);
          let pixels = reader.read();
          return new ImageData(pixels, info.width, info.height);
        } catch (e) {
          console.error(
            "Failed to read resource %d from file %d: %s",
            id,
            file,
            e.message
          );
        }
      }
    }
    return new ImageData(1, 1);
  }
}
