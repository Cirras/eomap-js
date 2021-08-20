import { LoadingStrategy } from "./loading-strategy";

export class DownloadLoadingStrategy extends LoadingStrategy {
  constructor(baseURL) {
    super();
    this.baseURL = baseURL;
  }

  getURL(id) {
    let result = this.baseURL;
    if (!result.endsWith("/")) {
      result += "/";
    }
    result += this.getEGFFilename(id);
    return result;
  }

  async loadEGF(id) {
    let response = await fetch(this.getURL(id));
    if (!response.ok) {
      throw new Error(`HTTP error. Status: ${response.status}`);
    }
    return response.arrayBuffer();
  }
}
