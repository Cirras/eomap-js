import { LoadType } from "./load-type";
import { DIBReader } from "./dib-reader";
import { PEReader } from "./pe-reader";

self.egfs = new Map();

self.loadDIB = function (data) {
  try {
    let egf = egfs.get(data.fileID);
    if (egf) {
      let info = egf.getResourceInfo(data.resourceID);
      if (info) {
        let dib = egf.readResource(info);
        let reader = new DIBReader(dib);
        let pixels = reader.read();
        postMessage(
          {
            loadType: LoadType.DIB,
            fileID: data.fileID,
            resourceID: data.resourceID,
            pixels: pixels.buffer,
          },
          [pixels.buffer]
        );
      }
    }
  } catch (e) {
    postMessage({
      loadType: LoadType.DIB,
      fileID: data.fileID,
      resourceID: data.resourceID,
      error: e,
    });
  }
};

self.loadEGF = function (data) {
  try {
    if (egfs.has(data.fileID)) {
      throw new Error(`EGF ${data.fileID} was already loaded.`);
    }

    let egf = new PEReader(data.buffer);

    egfs.set(data.fileID, egf);

    postMessage({
      loadType: LoadType.EGF,
      fileID: data.fileID,
      resourceInfo: egf.resourceInfo,
    });
  } catch (e) {
    postMessage({
      loadType: LoadType.EGF,
      fileID: data.fileID,
      error: e,
    });
  }
};

onmessage = function (event) {
  let data = event.data;

  switch (data.loadType) {
    case LoadType.DIB:
      loadDIB(data);
      break;
    case LoadType.EGF:
      loadEGF(data);
      break;
    default:
      throw new Error(`Unhandled LoadType: ${data.loadType}`);
  }
};
