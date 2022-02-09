var IsSizePowerOfTwo = Phaser.Math.Pow2.IsSize;
var Texture = Phaser.Textures.Texture;
var TextureSource = Phaser.Textures.TextureSource;
var Remove = Phaser.Utils.Array.Remove;
var CanvasPool = Phaser.Display.Canvas.CanvasPool;

export class DrawableMultiTexture extends Texture {
  constructor(manager, key, baseWidth, baseHeight) {
    super(manager, key, [], baseWidth, baseHeight);
    this.baseWidth = baseWidth;
    this.baseHeight = baseHeight;
    this.pages = [];

    manager.list[key] = this;
    this.addPage();
  }

  addPage() {
    let newPage;
    if (this.manager.game.renderer.gl) {
      newPage = new WebGLTexturePage(this, this.baseWidth, this.baseHeight);
    } else {
      newPage = new CanvasTexturePage(this, this.baseWidth, this.baseHeight);
    }

    this.pages.push(newPage);

    return newPage;
  }

  removePage(page) {
    page.destroy();
    Remove(this.pages, page);
  }

  destroy() {
    for (let page of this.pages) {
      page.destroy();
    }
    this.pages = [];
    super.destroy();
  }
}

class WebGLTexturePage {
  constructor(texture, width, height) {
    this.texture = texture;
    this.width = width;
    this.height = height;

    this.glTexture = this.createGLTexture(texture.manager.game.renderer);
    this.source = new TextureSource(
      this.texture,
      this.glTexture,
      this.width,
      this.height
    );

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

  createGLTexture(renderer) {
    let gl = renderer.gl;
    let minFilter = gl.NEAREST;
    let magFilter = gl.NEAREST;

    let width = this.width;
    let height = this.height;

    let wrapping = gl.CLAMP_TO_EDGE;

    let pow = IsSizePowerOfTwo(width, height);

    if (pow) {
      wrapping = gl.REPEAT;
    }

    if (renderer.config.antialias) {
      minFilter = pow ? renderer.mipmapFilter : gl.LINEAR;
      magFilter = gl.LINEAR;
    }

    return renderer.createTexture2D(
      0,
      minFilter,
      magFilter,
      wrapping,
      wrapping,
      gl.RGBA,
      new ImageData(width, height),
      width,
      height,
      true,
      false,
      false
    );
  }

  draw(imageData, x, y) {
    if (!this.source) {
      return;
    }

    let gl = this.source.renderer.gl;

    if (imageData.width > 0 && imageData.height > 0) {
      gl.activeTexture(gl.TEXTURE0);
      let currentTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
      gl.bindTexture(gl.TEXTURE_2D, this.glTexture);

      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
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
  }

  destroy() {
    this.source = null;
    this.canvas = null;
    this.context = null;
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

  draw(imageData, x, y) {
    if (!this.context) {
      return;
    }

    this.context.putImageData(
      imageData,
      x,
      y,
      0,
      0,
      imageData.width,
      imageData.height
    );

    this.source.update();
  }

  destroy() {
    CanvasPool.remove(this.canvas);
    this.source = null;
    this.canvas = null;
    this.context = null;
  }
}
