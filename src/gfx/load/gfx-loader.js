import { DIBReader } from "./dib-reader";
import { PEReader } from "./pe-reader";

export class GFXLoader {
  constructor(loadingStrategy) {
    this.loadingStrategy = loadingStrategy;
    this.egfs = new Map();
    this.failed = [];
  }

  async loadEGF(fileID) {
    if (!this.egfs.has(fileID)) {
      try {
        let buffer = await this.loadingStrategy.loadEGF(fileID);
        this.egfs.set(fileID, new PEReader(buffer));
      } catch (e) {
        this.failed.push(`EGF ${fileID}`);
        console.error("Failed to load EGF %d: %s", id, e);
      }
    }
  }

  resourceIDs(fileID) {
    let egf = this.egfs.get(fileID);
    if (egf) {
      return egf.getResourceIDs();
    }
    return [];
  }

  info(fileID, resourceID) {
    let egf = this.egfs.get(fileID);
    if (egf) {
      return egf.getResourceInfo(resourceID);
    }
    return null;
  }

  loadResource(fileID, resourceID) {
    let egf = this.egfs.get(fileID);
    if (egf) {
      let info = this.info(fileID, resourceID);
      if (info) {
        let dib = egf.getResource(info);
        try {
          let reader = new DIBReader(dib);
          let pixels = reader.read();
          return new ImageData(pixels, info.width, info.height);
        } catch (e) {
          console.error(
            "Failed to read resource %d from file %d: %s",
            resourceID,
            fileID,
            e
          );
        }
      }
    }
    return new ImageData(1, 1);
  }
}
