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

class FastTextureSource extends TextureSource {
  constructor(texture, source, width, height) {
    super(texture, source, width, height);
  }

  init(game) {
    let renderer = this.renderer;
    if (renderer && renderer.gl && this.isCanvas) {
      this.glTexture = this.createCanvasTexture();
      if (!game.config.antialias) {
        this.setFilter(1);
      }
    } else {
      super.init(game);
    }
  }

  createCanvasTexture() {
    let gl = this.renderer.gl;
    let minFilter = gl.NEAREST;
    let magFilter = gl.NEAREST;

    let width = this.image.width;
    let height = this.image.height;

    let wrapping = gl.CLAMP_TO_EDGE;

    let pow = IsSizePowerOfTwo(width, height);

    if (pow) {
      wrapping = gl.REPEAT;
    }

    if (this.renderer.config.antialias) {
      minFilter = pow ? this.renderer.mipmapFilter : gl.LINEAR;
      magFilter = gl.LINEAR;
    }

    return this.renderer.createTexture2D(
      0,
      minFilter,
      magFilter,
      wrapping,
      wrapping,
      gl.RGBA,
      null,
      width,
      height,
      true,
      false,
      false
    );
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

    this.source = new FastTextureSource(
      this.texture,
      this.canvas,
      this.width,
      this.height
    );

    this.context = this.canvas.getContext("2d");

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

  draw(x, y, source) {
    this.context.drawImage(source, x, y);

    return this;
  }

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

  refresh() {
    this.source.update();

    return this;
  }

  getCanvas() {
    return this.canvas;
  }

  getContext() {
    return this.context;
  }

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

  destroy() {
    this.source = null;
    this.canvas = null;
    this.context = null;
  }
}
