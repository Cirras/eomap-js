var Clamp = Phaser.Math.Clamp;
var Color = Phaser.Display.Color.Color;
var IsSizePowerOfTwo = Phaser.Math.Pow2.IsSize;
var Texture = Phaser.Textures.Texture;
var TextureSource = Phaser.Textures.TextureSource;
var Remove = Phaser.Utils.Array.Remove;
var CanvasPool = Phaser.Display.Canvas.CanvasPool;

export class CanvasMultiTexture extends Texture {
  constructor(manager, key, baseWidth, baseHeight) {
    super(manager, key, [], baseWidth, baseHeight);
    this.baseWidth = baseWidth;
    this.baseHeight = baseHeight;
    this.pages = [];

    manager.list[key] = this;
    this.addPage();
  }

  addPage() {
    let newPage = new CanvasTexturePage(this, this.baseWidth, this.baseHeight);
    this.pages.push(newPage);

    return newPage;
  }

  removePage(page) {
    Remove(this.pages, page);
  }
}

class CanvasTexturePage {
  constructor(texture, width, height) {
    this.texture = texture;
    this.width = width;
    this.height = height;

    this.canvas = CanvasPool.create(
      this.texture.manager,
      this.width,
      this.height,
      Phaser.CANVAS,
      true
    );

    this.source = new TextureSource(
      this.texture,
      this.canvas,
      this.width,
      this.height
    );

    this.context = this.canvas.getContext("2d");
    this.imageData = this.context.getImageData(0, 0, width, height);
    this.data = this.imageData ? this.imageData.data : null;
    this.pixels = null;
    this.buffer;

    if (this.data) {
      if (this.imageData.data.buffer) {
        this.buffer = this.imageData.data.buffer;
        this.pixels = new Uint32Array(this.buffer);
      } else if (window.ArrayBuffer) {
        this.buffer = new ArrayBuffer(this.imageData.data.length);
        this.pixels = new Uint32Array(this.buffer);
      } else {
        this.pixels = this.imageData.data;
      }
    }

    let sourceIndex = this.texture.source.length;
    this.texture.source.push(this.source);
    this.texture.add(
      "__BASE_PAGE_" + sourceIndex,
      sourceIndex,
      0,
      0,
      width,
      height
    );
  }

  /**
   * This re-creates the `imageData` from the current context.
   * It then re-builds the ArrayBuffer, the `data` Uint8ClampedArray reference and the `pixels` Int32Array.
   *
   * Warning: This is a very expensive operation, so use it sparingly.
   *
   * @method Phaser.Textures.CanvasTexture#update
   * @since 3.13.0
   *
   * @return {Phaser.Textures.CanvasTexture} This CanvasTexture.
   */
  update() {
    this.imageData = this.context.getImageData(0, 0, this.width, this.height);

    this.data = this.imageData.data;

    if (this.imageData.data.buffer) {
      this.buffer = this.imageData.data.buffer;
      this.pixels = new Uint32Array(this.buffer);
    } else if (window.ArrayBuffer) {
      this.buffer = new ArrayBuffer(this.imageData.data.length);
      this.pixels = new Uint32Array(this.buffer);
    } else {
      this.pixels = this.imageData.data;
    }

    return this;
  }

  /**
   * Draws the given Image or Canvas element to this CanvasTexture, then updates the internal
   * ImageData buffer and arrays.
   *
   * @method Phaser.Textures.CanvasTexture#draw
   * @since 3.13.0
   *
   * @param {integer} x - The x coordinate to draw the source at.
   * @param {integer} y - The y coordinate to draw the source at.
   * @param {(HTMLImageElement|HTMLCanvasElement)} source - The element to draw to this canvas.
   *
   * @return {Phaser.Textures.CanvasTexture} This CanvasTexture.
   */
  draw(x, y, source) {
    this.context.drawImage(source, x, y);

    return this.update();
  }

  /**
   * Draws the given texture frame to this CanvasTexture, then updates the internal
   * ImageData buffer and arrays.
   *
   * @method Phaser.Textures.CanvasTexture#drawFrame
   * @since 3.16.0
   *
   * @param {string} key - The unique string-based key of the Texture.
   * @param {(string|integer)} [frame] - The string-based name, or integer based index, of the Frame to get from the Texture.
   * @param {integer} [x=0] - The x coordinate to draw the source at.
   * @param {integer} [y=0] - The y coordinate to draw the source at.
   *
   * @return {Phaser.Textures.CanvasTexture} This CanvasTexture.
   */
  drawFrame(key, frame, x, y) {
    if (x === undefined) {
      x = 0;
    }
    if (y === undefined) {
      y = 0;
    }

    var textureFrame = this.manager.getFrame(key, frame);

    if (textureFrame) {
      var cd = textureFrame.canvasData;

      var width = textureFrame.cutWidth;
      var height = textureFrame.cutHeight;
      var res = textureFrame.source.resolution;

      this.context.drawImage(
        textureFrame.source.image,
        cd.x,
        cd.y,
        width,
        height,
        x,
        y,
        width / res,
        height / res
      );

      return this.update();
    } else {
      return this;
    }
  }

  /**
   * Sets a pixel in the CanvasTexture to the given color and alpha values.
   *
   * This is an expensive operation to run in large quantities, so use sparingly.
   *
   * @method Phaser.Textures.CanvasTexture#setPixel
   * @since 3.16.0
   *
   * @param {integer} x - The x coordinate of the pixel to get. Must lay within the dimensions of this CanvasTexture and be an integer.
   * @param {integer} y - The y coordinate of the pixel to get. Must lay within the dimensions of this CanvasTexture and be an integer.
   * @param {integer} red - The red color value. A number between 0 and 255.
   * @param {integer} green - The green color value. A number between 0 and 255.
   * @param {integer} blue - The blue color value. A number between 0 and 255.
   * @param {integer} [alpha=255] - The alpha value. A number between 0 and 255.
   *
   * @return {this} This CanvasTexture.
   */
  setPixel(x, y, red, green, blue, alpha) {
    if (alpha === undefined) {
      alpha = 255;
    }

    x = Math.abs(Math.floor(x));
    y = Math.abs(Math.floor(y));

    var index = this.getIndex(x, y);

    if (index > -1) {
      var imageData = this.context.getImageData(x, y, 1, 1);

      imageData.data[0] = red;
      imageData.data[1] = green;
      imageData.data[2] = blue;
      imageData.data[3] = alpha;

      this.context.putImageData(imageData, x, y);
    }

    return this;
  }

  /**
   * Puts the ImageData into the context of this CanvasTexture at the given coordinates.
   *
   * @method Phaser.Textures.CanvasTexture#putData
   * @since 3.16.0
   *
   * @param {ImageData} imageData - The ImageData to put at the given location.
   * @param {integer} x - The x coordinate to put the imageData. Must lay within the dimensions of this CanvasTexture and be an integer.
   * @param {integer} y - The y coordinate to put the imageData. Must lay within the dimensions of this CanvasTexture and be an integer.
   * @param {integer} [dirtyX=0] - Horizontal position (x coordinate) of the top-left corner from which the image data will be extracted.
   * @param {integer} [dirtyY=0] - Vertical position (x coordinate) of the top-left corner from which the image data will be extracted.
   * @param {integer} [dirtyWidth] - Width of the rectangle to be painted. Defaults to the width of the image data.
   * @param {integer} [dirtyHeight] - Height of the rectangle to be painted. Defaults to the height of the image data.
   *
   * @return {this} This CanvasTexture.
   */
  putData(imageData, x, y, dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
    if (dirtyX === undefined) {
      dirtyX = 0;
    }
    if (dirtyY === undefined) {
      dirtyY = 0;
    }
    if (dirtyWidth === undefined) {
      dirtyWidth = imageData.width;
    }
    if (dirtyHeight === undefined) {
      dirtyHeight = imageData.height;
    }

    this.context.putImageData(
      imageData,
      x,
      y,
      dirtyX,
      dirtyY,
      dirtyWidth,
      dirtyHeight
    );

    return this;
  }

  /**
   * Gets an ImageData region from this CanvasTexture from the position and size specified.
   * You can write this back using `CanvasTexture.putData`, or manipulate it.
   *
   * @method Phaser.Textures.CanvasTexture#getData
   * @since 3.16.0
   *
   * @param {integer} x - The x coordinate of the top-left of the area to get the ImageData from. Must lay within the dimensions of this CanvasTexture and be an integer.
   * @param {integer} y - The y coordinate of the top-left of the area to get the ImageData from. Must lay within the dimensions of this CanvasTexture and be an integer.
   * @param {integer} width - The width of the rectangle from which the ImageData will be extracted. Positive values are to the right, and negative to the left.
   * @param {integer} height - The height of the rectangle from which the ImageData will be extracted. Positive values are down, and negative are up.
   *
   * @return {ImageData} The ImageData extracted from this CanvasTexture.
   */
  getData(x, y, width, height) {
    x = Clamp(Math.floor(x), 0, this.width - 1);
    y = Clamp(Math.floor(y), 0, this.height - 1);
    width = Clamp(width, 1, this.width - x);
    height = Clamp(height, 1, this.height - y);

    var imageData = this.context.getImageData(x, y, width, height);

    return imageData;
  }

  /**
   * Get the color of a specific pixel from this texture and store it in a Color object.
   *
   * If you have drawn anything to this CanvasTexture since it was created you must call `CanvasTexture.update` to refresh the array buffer,
   * otherwise this may return out of date color values, or worse - throw a run-time error as it tries to access an array element that doesn't exist.
   *
   * @method Phaser.Textures.CanvasTexture#getPixel
   * @since 3.13.0
   *
   * @param {integer} x - The x coordinate of the pixel to get. Must lay within the dimensions of this CanvasTexture and be an integer.
   * @param {integer} y - The y coordinate of the pixel to get. Must lay within the dimensions of this CanvasTexture and be an integer.
   * @param {Phaser.Display.Color} [out] - A Color object to store the pixel values in. If not provided a new Color object will be created.
   *
   * @return {Phaser.Display.Color} An object with the red, green, blue and alpha values set in the r, g, b and a properties.
   */
  getPixel(x, y, out) {
    if (!out) {
      out = new Color();
    }

    var index = this.getIndex(x, y);

    if (index > -1) {
      var data = this.data;

      var r = data[index + 0];
      var g = data[index + 1];
      var b = data[index + 2];
      var a = data[index + 3];

      out.setTo(r, g, b, a);
    }

    return out;
  }

  /**
   * An object containing the position and color data for a single pixel in a CanvasTexture.
   *
   * @typedef {object} PixelConfig
   *
   * @property {integer} x - The x-coordinate of the pixel.
   * @property {integer} y - The y-coordinate of the pixel.
   * @property {integer} color - The color of the pixel, not including the alpha channel.
   * @property {float} alpha - The alpha of the pixel, between 0 and 1.
   */

  /**
   * Returns an array containing all of the pixels in the given region.
   *
   * If the requested region extends outside the bounds of this CanvasTexture,
   * the region is truncated to fit.
   *
   * If you have drawn anything to this CanvasTexture since it was created you must call `CanvasTexture.update` to refresh the array buffer,
   * otherwise this may return out of date color values, or worse - throw a run-time error as it tries to access an array element that doesn't exist.
   *
   * @method Phaser.Textures.CanvasTexture#getPixels
   * @since 3.16.0
   *
   * @param {integer} x - The x coordinate of the top-left of the region. Must lay within the dimensions of this CanvasTexture and be an integer.
   * @param {integer} y - The y coordinate of the top-left of the region. Must lay within the dimensions of this CanvasTexture and be an integer.
   * @param {integer} width - The width of the region to get. Must be an integer.
   * @param {integer} [height] - The height of the region to get. Must be an integer. If not given will be set to the `width`.
   *
   * @return {PixelConfig[]} An array of Pixel objects.
   */
  getPixels(x, y, width, height) {
    if (height === undefined) {
      height = width;
    }

    x = Math.abs(Math.round(x));
    y = Math.abs(Math.round(y));

    var left = Clamp(x, 0, this.width);
    var right = Clamp(x + width, 0, this.width);
    var top = Clamp(y, 0, this.height);
    var bottom = Clamp(y + height, 0, this.height);

    var pixel = new Color();

    var out = [];

    for (var py = top; py < bottom; py++) {
      var row = [];

      for (var px = left; px < right; px++) {
        pixel = this.getPixel(px, py, pixel);

        row.push({ x: px, y: py, color: pixel.color, alpha: pixel.alphaGL });
      }

      out.push(row);
    }

    return out;
  }

  /**
   * Returns the Image Data index for the given pixel in this CanvasTexture.
   *
   * The index can be used to read directly from the `this.data` array.
   *
   * The index points to the red value in the array. The subsequent 3 indexes
   * point to green, blue and alpha respectively.
   *
   * @method Phaser.Textures.CanvasTexture#getIndex
   * @since 3.16.0
   *
   * @param {integer} x - The x coordinate of the pixel to get. Must lay within the dimensions of this CanvasTexture and be an integer.
   * @param {integer} y - The y coordinate of the pixel to get. Must lay within the dimensions of this CanvasTexture and be an integer.
   *
   * @return {integer}
   */
  getIndex(x, y) {
    x = Math.abs(Math.round(x));
    y = Math.abs(Math.round(y));

    if (x < this.width && y < this.height) {
      return (x + y * this.width) * 4;
    } else {
      return -1;
    }
  }

  /**
   * This should be called manually if you are running under WebGL.
   * It will refresh the WebGLTexture from the Canvas source. Only call this if you know that the
   * canvas has changed, as there is a significant GPU texture allocation cost involved in doing so.
   *
   * @method Phaser.Textures.CanvasTexture#refresh
   * @since 3.7.0
   *
   * @return {Phaser.Textures.CanvasTexture} This CanvasTexture.
   */
  refresh() {
    this.source.update();

    return this;
  }

  /**
   * Gets the Canvas Element.
   *
   * @method Phaser.Textures.CanvasTexture#getCanvas
   * @since 3.7.0
   *
   * @return {HTMLCanvasElement} The Canvas DOM element this texture is using.
   */
  getCanvas() {
    return this.canvas;
  }

  /**
   * Gets the 2D Canvas Rendering Context.
   *
   * @method Phaser.Textures.CanvasTexture#getContext
   * @since 3.7.0
   *
   * @return {CanvasRenderingContext2D} The Canvas Rendering Context this texture is using.
   */
  getContext() {
    return this.context;
  }

  /**
   * Clears the given region of this Canvas Texture, resetting it back to transparent.
   * If no region is given, the whole Canvas Texture is cleared.
   *
   * @method Phaser.Textures.CanvasTexture#clear
   * @since 3.7.0
   *
   * @param {integer} [x=0] - The x coordinate of the top-left of the region to clear.
   * @param {integer} [y=0] - The y coordinate of the top-left of the region to clear.
   * @param {integer} [width] - The width of the region.
   * @param {integer} [height] - The height of the region.
   *
   * @return {Phaser.Textures.CanvasTexture} The Canvas Texture.
   */
  clear(x, y, width, height) {
    if (x === undefined) {
      x = 0;
    }
    if (y === undefined) {
      y = 0;
    }
    if (width === undefined) {
      width = this.width;
    }
    if (height === undefined) {
      height = this.height;
    }

    this.context.clearRect(x, y, width, height);

    return this.update();
  }

  /**
   * Changes the size of this Canvas Texture.
   *
   * @method Phaser.Textures.CanvasTexture#setSize
   * @since 3.7.0
   *
   * @param {integer} width - The new width of the Canvas.
   * @param {integer} [height] - The new height of the Canvas. If not given it will use the width as the height.
   *
   * @return {Phaser.Textures.CanvasTexture} The Canvas Texture.
   */
  setSize(width, height) {
    if (height === undefined) {
      height = width;
    }

    if (width !== this.width || height !== this.height) {
      //  Update the Canvas
      this.canvas.width = width;
      this.canvas.height = height;

      //  Update the Texture Source
      this.source.width = width;
      this.source.height = height;
      this.source.isPowerOf2 = IsSizePowerOfTwo(width, height);

      //  Update the Frame
      this.frames["__BASE"].setSize(width, height, 0, 0);

      this.refresh();
    }

    return this;
  }

  /**
   * Destroys this Texture and releases references to its sources and frames.
   *
   * @method Phaser.Textures.CanvasTexture#destroy
   * @since 3.16.0
   */
  destroy() {
    this.source = null;
    this.canvas = null;
    this.context = null;
    this.imageData = null;
    this.data = null;
    this.pixels = null;
    this.buffer = null;
  }
}
