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

  putData(imageData, x, y) {
    let glTexture = this.source.glTexture;

    if (glTexture) {
      let gl = this.source.renderer.gl;

      if (imageData.width > 0 && imageData.height > 0) {
        gl.activeTexture(gl.TEXTURE0);
        let currentTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
        gl.bindTexture(gl.TEXTURE_2D, glTexture);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

        gl.texSubImage2D(
          gl.TEXTURE_2D,
          0,
          x,
          y,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          imageData
        );

        if (currentTexture) {
          gl.bindTexture(gl.TEXTURE_2D, currentTexture);
        }
      }
    } else {
      this.context.putImageData(
        imageData,
        x,
        y,
        0,
        0,
        imageData.width,
        imageData.height
      );
    }

    return this;
  }

  destroy() {
    this.source = null;
    this.canvas = null;
    this.context = null;
  }
}
