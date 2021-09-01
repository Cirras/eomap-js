import Worker from "./gfx-loader.worker";
import { LoadType } from "./load-type";

class PendingPromise {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
export class GFXLoader {
  constructor(loadingStrategy) {
    this.loadingStrategy = loadingStrategy;
    this.egfs = new Map();
    this.worker = this.setupWorker();
    this.pendingEGFs = new Map();
    this.pendingResources = new Map();
  }

  setupWorker() {
    let worker = new Worker();

    worker.onmessage = (event) => {
      let data = event.data;
      switch (data.loadType) {
        case LoadType.DIB:
          this.handleDIBMessage(data);
          break;
        case LoadType.EGF:
          this.handleEGFMessage(data);
          break;
        default:
          throw new Error(`Unhandled LoadType: ${data.loadType}`);
      }
    };

    worker.onerror = (error) => {
      console.error(error);
    };

    return worker;
  }

  handleDIBMessage(data) {
    let info = this.info(data.fileID, data.resourceID);
    if (this.pendingResources.has(info)) {
      let pending = this.pendingResources.get(info);
      this.pendingResources.delete(info);

      if (data.error) {
        pending.reject(data.error);
      } else {
        let imageData = new ImageData(
          new Uint8ClampedArray(data.pixels),
          info.width,
          info.height
        );
        pending.resolve(imageData);
      }
    }
  }

  handleEGFMessage(data) {
    let fileID = data.fileID;
    if (this.pendingEGFs.has(fileID)) {
      let pending = this.pendingEGFs.get(fileID);
      this.pendingEGFs.delete(fileID);

      if (data.error) {
        pending.reject(data.error);
      } else {
        pending.resolve(data.resourceInfo);
      }
    }
  }

  async loadEGF(fileID) {
    if (!this.egfs.has(fileID)) {
      if (this.pendingEGFs.has(fileID)) {
        return this.pendingEGFs.get(fileID).promise;
      }

      let pending = new PendingPromise();
      this.pendingEGFs.set(fileID, pending);

      let buffer = await this.loadingStrategy.loadEGF(fileID);

      this.worker.postMessage(
        {
          loadType: LoadType.EGF,
          buffer: buffer,
          fileID: fileID,
        },
        [buffer]
      );

      let resourceInfo = await pending.promise;
      this.egfs.set(fileID, resourceInfo);
    }
  }

  resourceIDs(fileID) {
    let egf = this.egfs.get(fileID);
    if (egf) {
      return egf.keys();
    }
    return [];
  }

  info(fileID, resourceID) {
    let result = null;

    let resourceInfo = this.egfs.get(fileID);
    if (resourceInfo) {
      let info = resourceInfo.get(resourceID);
      if (info) {
        result = info;
      }
    }
    return result;
  }

  async loadResource(fileID, resourceID) {
    let info = this.info(fileID, resourceID);
    if (info) {
      if (this.pendingResources.has(info)) {
        return this.pendingResources.get(info).promise;
      }

      let pending = new PendingPromise();
      this.pendingResources.set(info, pending);

      this.worker.postMessage({
        loadType: LoadType.DIB,
        fileID: fileID,
        resourceID: resourceID,
      });

      try {
        let imageData = await pending.promise;
        this.pendingResources.delete(info);
        return imageData;
      } catch (e) {
        console.error(
          "Failed to read resource %d from file %d: %s",
          resourceID,
          fileID,
          e
        );
      }
    }

    return new ImageData(1, 1);
  }
}
