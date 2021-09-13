import { getEGFFilename } from "../../../utils";
import { LoadingStrategy } from "./loading-strategy";

export class DownloadLoadingStrategy extends LoadingStrategy {
  constructor(baseURL) {
    super();
    this.baseURL = baseURL;
    if (!this.baseURL.endsWith("/")) {
      this.baseURL += "/";
    }
  }

  async download(url) {
    let response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error. Status: ${response.status}`);
    }
    return response.arrayBuffer();
  }

  async loadEGF(fileID) {
    return this.download(this.baseURL + "gfx/" + getEGFFilename(fileID));
  }
}
