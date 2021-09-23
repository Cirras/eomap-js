import { LoadingStrategy } from "./loading-strategy";

export class DownloadLoadingStrategy extends LoadingStrategy {
  constructor(url) {
    super();
    this.url = url;
    if (!this.url.endsWith("/")) {
      this.url += "/";
    }
  }

  async load(path) {
    let response = await fetch(this.url + path);
    if (!response.ok) {
      throw new Error(`HTTP error. Status: ${response.status}`);
    }
    return response.arrayBuffer();
  }
}
