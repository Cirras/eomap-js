class CursorAnimation {
  static FRAMES = [0, 1, 2, 3, 4, 3, 2, 1, 0];
  static TICK_MS = 16.67;

  accumulator = 0;
  tick = 0;
  isPlaying = false;

  play() {
    this.stop();
    this.isPlaying = true;
  }

  stop() {
    this.accumulator = 0;
    this.tick = 0;
    this.isPlaying = false;
  }

  update(_time, delta) {
    if (!this.isPlaying) {
      return;
    }

    this.accumulator += delta;

    if (this.accumulator >= this.nextTick) {
      if (this.tick === CursorAnimation.FRAMES.length - 1) {
        this.stop();
      } else {
        ++this.tick;
      }
    }
  }

  get frame() {
    return CursorAnimation.FRAMES[this.tick];
  }

  get nextTick() {
    return (this.tick + 1) * CursorAnimation.TICK_MS;
  }
}

export class Cursor extends Phaser.GameObjects.GameObject {
  constructor(scene, textureCache, x, y) {
    super(scene, "Cursor");
    this.animation = new CursorAnimation();
    this.frameIndex = 0;
    this.cacheEntry = textureCache.getCursor();
    this._scale = 1.0;
    this._drawScale = 1.0;
    this._renderTexture = null;
    this._assetLoaded = false;
    this._dirty = false;
    this._needsRedraw = false;

    this.cacheEntry.incRef();

    let onAssetLoad = () => {
      this._assetLoaded = true;
      this._dirty = true;
      this._needsRedraw = true;
    };

    if (this.cacheEntry.loadingComplete) {
      this.cacheEntry.loadingComplete.then(onAssetLoad);
    } else {
      onAssetLoad();
    }

    this.createRenderTexture();
    this.setPosition(x, y);

    this.initPipeline();
  }

  createRenderTexture() {
    this._renderTexture = new Phaser.GameObjects.RenderTexture(this.scene)
      .setSize(1024, 512)
      .setOrigin(0.0)
      .setVisible(false);
    this._renderTexture.texture.setFilter(Phaser.Textures.LINEAR);
    Phaser.Display.Canvas.Smoothing.disable(this._renderTexture.context);
    this.cropRenderTexture();
    this.scaleRenderTexture();
  }

  cropRenderTexture() {
    this._renderTexture.setCrop(
      0,
      0,
      64 * this._drawScale,
      32 * this._drawScale,
    );
    this._needsRedraw = true;
  }

  scaleRenderTexture() {
    this._renderTexture.setScale(this._scale / this._drawScale);
    this._dirty = true;
  }

  setFrame(index) {
    if (this.frameIndex !== index) {
      this.frameIndex = index;
      this._dirty = true;
      this._needsRedraw = true;
    }
  }

  playAnimation() {
    this.animation.play();
  }

  stopAnimation() {
    if (this.animation.isPlaying) {
      this.animation.stop();
      this.setFrame(0);
    }
  }

  addedToScene() {
    this.scene.sys.updateList.add(this);
  }

  removedFromScene() {
    this.scene.sys.updateList.remove(this);
  }

  preUpdate(time, delta) {
    if (this.animation.isPlaying) {
      this.animation.update(time, delta);
      this.setFrame(this.animation.frame);
    }
  }

  drawFrame() {
    if (!this._needsRedraw || !this.asset) {
      return;
    }

    let camera = this._renderTexture.camera;
    camera.zoom = this._drawScale;
    camera.setOrigin(0.0);

    this._renderTexture.clear();
    this._renderTexture.draw(this.asset.getFrame(this.frameIndex));

    this._needsRedraw = false;
  }

  renderWebGL(renderer, _src, camera) {
    this.drawFrame();
    this._renderTexture.renderWebGL(renderer, this._renderTexture, camera);
    this._dirty = false;
  }

  renderCanvas(renderer, _src, camera) {
    this.drawFrame();

    // See: https://github.com/photonstorm/phaser/pull/6141
    let antialias = renderer.antialias;
    renderer.antialias = true;

    this._renderTexture.renderCanvas(renderer, this._renderTexture, camera);

    renderer.antialias = antialias;

    this._dirty = false;
  }

  get asset() {
    return this._assetLoaded ? this.cacheEntry.asset : null;
  }

  get shouldRender() {
    return this._dirty;
  }

  get depth() {
    return this._renderTexture.depth;
  }

  // Because for some reason, Phaser reads the _depth field when sorting the
  // display list, which is supposed to be a private implementation detail
  // of the Depth component...
  get _depth() {
    return this.depth;
  }

  set depth(value) {
    this._renderTexture.depth = value;
  }

  setDepth(value) {
    this.depth = value;
    return this;
  }

  get x() {
    return this._renderTexture.x;
  }

  set x(value) {
    this._renderTexture.x = value;
  }

  get y() {
    return this._renderTexture.y;
  }

  set y(value) {
    this._renderTexture.y = value;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  get scale() {
    return this._scale;
  }

  set scale(value) {
    if (value === this._scale) {
      return;
    }

    this._scale = value;

    let newDrawScale = 1.0;
    while (newDrawScale < this._scale) {
      newDrawScale *= 2;
    }

    if (newDrawScale !== this._drawScale) {
      this._drawScale = newDrawScale;
      this.cropRenderTexture();
    }

    this.scaleRenderTexture();
  }

  setScale(value) {
    this.scale = value;
    return this;
  }

  get visible() {
    return this._renderTexture.visible;
  }

  set visible(value) {
    this._renderTexture.visible = value;
  }

  setVisible(value) {
    this.visible = value;
    return this;
  }

  get renderFlags() {
    return this._renderTexture.renderFlags;
  }

  destroy(fromScene) {
    this._renderTexture.destroy(fromScene);

    if (this.cachedFrame) {
      this.cachedFrame.destroy();
    }

    super.destroy(fromScene);
  }
}

Phaser.Class.mixin(Cursor, [
  Phaser.GameObjects.Components.BlendMode,
  Phaser.GameObjects.Components.Pipeline,
]);

Phaser.GameObjects.GameObjectFactory.register(
  "cursor",
  function (scene, textureCache, x, y) {
    const cursor = new Cursor(scene, textureCache, x, y);
    this.displayList.add(cursor);
    return cursor;
  },
);
