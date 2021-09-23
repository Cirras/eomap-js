import { LoadingStrategy } from "./loading-strategy";

export class BundledLoadingStrategy extends LoadingStrategy {
  constructor(requireContext) {
    super();
    this.images = new Map();
    requireContext.keys().forEach((item) => {
      this.images.set(item.replace("./", ""), requireContext(item).default);
    });
  }

  async load(path) {
    let image = new Image();
    image.src = this.images.get(path);

    await new Promise((resolve) =>
      image.addEventListener("load", () => resolve())
    );

    let canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;

    let context = canvas.getContext("2d");
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0);

    return context.getImageData(0, 0, image.width, image.height);
  }
}
