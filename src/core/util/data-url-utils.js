export function blobToDataURL(blob) {
  return new Promise((resolve, _) => {
    let reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export async function dataURLToImage(dataURL) {
  let image = new Image();
  image.src = dataURL;

  await new Promise((resolve) =>
    image.addEventListener("load", () => resolve()),
  );

  return image;
}

export async function dataURLToImageData(dataURL) {
  let image = await dataURLToImage(dataURL);

  let canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;

  let context = canvas.getContext("2d");
  context.imageSmoothingEnabled = false;
  context.drawImage(image, 0, 0);

  return context.getImageData(0, 0, image.width, image.height);
}
