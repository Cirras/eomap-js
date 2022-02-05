import { blobToDataURL, dataURLToImageData } from "../../../utils";
import { LoadingStrategy } from "./loading-strategy";

export class RemoteLoadingStrategy extends LoadingStrategy {
  constructor(url) {
    super();
    this.abortController = new AbortController();
    this.url = url;
    if (!this.url.endsWith("/")) {
      this.url += "/";
    }
  }

  async loadEGF(filename) {
    let response = await this.download("gfx/" + filename);
    return response.arrayBuffer();
  }

  async loadRaw(path) {
    let response = await this.download("assets/" + path);
    let blob = await response.blob();
    let dataURL = await blobToDataURL(blob);
    return dataURLToImageData(dataURL);
  }

  async download(path) {
    let signal = this.abortController.signal;
    let response = await fetch(this.url + path, { signal });
    if (!response.ok) {
      throw new Error(`HTTP error. Status: ${response.status}`);
    }
    return response;
  }

  abort() {
    this.abortController.abort();
  }
}
