export class PaletteLayerEntry {
  constructor(textureCache, width, height) {
    this.textureCache = textureCache;
    this.width = width;
    this.height = height;
    this._x = 0;
    this._y = 0;
    this._visible = false;
    this._cacheEntry = null;
  }

  _getCacheEntry() {
    throw new Error("PaletteLayerEntry._getCacheEntry() must be implemented");
  }

  preload() {
    this._getCacheEntry();
  }

  get id() {
    throw new Error("PaletteLayerEntry.id() must be implemented");
  }

  get visible() {
    return this._visible;
  }

  set visible(visible) {
    if (this.visible !== visible) {
      if (visible) {
        this.cacheEntry.incRef();
      } else {
        this.cacheEntry.decRef();
      }
      this._visible = visible;
    }
  }

  get cacheEntry() {
    if (this._cacheEntry === null) {
      this._cacheEntry = this._getCacheEntry();
    }
    return this._cacheEntry;
  }

  get x() {
    return this._x;
  }

  set x(value) {
    this._x = value;
    if (this.sprite) {
      this.sprite.x = value;
    }
  }

  get y() {
    return this._y;
  }

  set y(value) {
    this._y = value;
    if (this.sprite) {
      this.sprite.y = value;
    }
  }
}

export class PaletteLayerResourceEntry extends PaletteLayerEntry {
  constructor(textureCache, width, height, fileID, resourceID) {
    super(textureCache, width, height);
    this.fileID = fileID;
    this.resourceID = resourceID;
  }

  _getCacheEntry() {
    return this.textureCache.getResource(this.fileID, this.resourceID);
  }

  get id() {
    return this.resourceID - 100;
  }
}

export class PaletteLayerBlackTileEntry extends PaletteLayerEntry {
  constructor(textureCache) {
    super(textureCache, 64, 32);
  }

  _getCacheEntry() {
    return this.textureCache.getBlackTile();
  }

  get id() {
    return 0;
  }
}

export class PaletteLayerSpecEntry extends PaletteLayerEntry {
  constructor(textureCache, tileSpec) {
    super(textureCache, 64, 32);
    this.tileSpec = tileSpec;
  }

  _getCacheEntry() {
    return this.textureCache.getSpec(this.tileSpec);
  }

  get id() {
    return this.tileSpec;
  }
}

export class PaletteLayer extends Phaser.GameObjects.GameObject {
  static SECTION_HEIGHT = 512;

  constructor(scene) {
    super(scene, "PaletteLayer");
    this.scene = scene;
    this.entries = new Map();
    this.sections = [];
    this.renderList = new Set();
    this._selectedEntry = null;
    this._width = 0;
    this._height = 0;
    this.scroll = 0;
    this.animationFrame = 0;
    this.dirtyLayout = true;
    this.dirtyAnimationFrame = true;

    this.initPipeline();
  }

  addEntry(entry) {
    this.entries.set(entry.id, entry);
  }

  getEntryAtPosition(x, y) {
    for (let entry of this.renderList) {
      let top = entry.y;
      let bottom = top + entry.height;
      let left = entry.x;
      let right = left + entry.width;
      if (top < y && bottom > y && left < x && right > x) {
        return entry;
      }
    }
    return null;
  }

  selectEntry(drawID) {
    this._selectedEntry = this.entries.get(drawID) || null;
  }

  set visible(visible) {
    if (this.visible === visible) {
      return;
    }

    if (visible) {
      this.layout();
    } else {
      for (let entry of this.entries.values()) {
        entry.visible = false;
      }
    }

    super.visible = visible;
  }

  cull() {
    let visibleSections = [];
    let cullTop = this.scroll;
    let cullBottom = cullTop + this.scene.cameras.main.height;

    for (let i = 0; i < this.sections.length; ++i) {
      let section = this.sections[i];
      let sectionTop = i * PaletteLayer.SECTION_HEIGHT;
      let sectionBottom = sectionTop + PaletteLayer.SECTION_HEIGHT;
      let show = sectionBottom > cullTop && sectionTop < cullBottom;
      if (show) {
        visibleSections.push(section);
      } else {
        for (let entry of section) {
          entry.visible = false;
        }
      }
    }

    this.renderList.clear();
    for (let section of visibleSections) {
      for (let entry of section) {
        entry.visible = true;
        this.renderList.add(entry);
      }
    }
  }

  layout() {
    if (this.dirtyLayout) {
      this.layoutEntries();
    }
    this.cull();
  }

  calcSection(y) {
    let section = y;
    if (section !== 0) {
      section = Math.trunc(section / PaletteLayer.SECTION_HEIGHT);
    }
    return section;
  }

  layoutEntries() {
    const xRes = 32;
    const yRes = 32;

    let pageWidth = Math.floor(this.width / xRes);
    let colHeights = new Array(pageWidth).fill(0);

    this.sections.length = 0;
    this._height = 0;

    for (let entry of this.entries.values()) {
      let width = entry.width;
      let height = entry.height;

      let blockWidth = Math.floor((width + xRes - 1) / xRes);
      let blockHeight = Math.floor((height + yRes - 1) / yRes);

      blockWidth = Math.min(blockWidth, pageWidth);

      let startY = 0x7fffffff;

      for (let colHeight of colHeights) {
        startY = Math.min(startY, colHeight);
      }

      let foundPosition = false;

      for (let y = startY; ; ++y) {
        for (let x = 0; x <= pageWidth - blockWidth; ++x) {
          let maxY = 0;

          for (let i = x; i < x + blockWidth; ++i) {
            maxY = Math.max(maxY, colHeights[i]);
          }

          if (maxY < y) {
            for (let i = x; i < x + blockWidth; ++i) {
              colHeights[i] = maxY + blockHeight;
            }

            entry.x = x * xRes;
            entry.y = (y - 1) * yRes;

            this._height = Math.max(entry.y + entry.height, this.height);

            let startSection = this.calcSection(entry.y);
            let endSection = this.calcSection(entry.y + entry.height);

            let sectionsToAdd = endSection + 1 - this.sections.length;
            for (let i = 0; i < sectionsToAdd; ++i) {
              this.sections.push([]);
            }

            for (let i = startSection; i <= endSection; ++i) {
              this.sections[i].push(entry);
            }

            foundPosition = true;
            break;
          }
        }

        if (foundPosition) {
          break;
        }
      }
    }

    this.dirtyLayout = false;
  }

  renderWebGL(renderer, src, camera) {
    let pipeline = renderer.pipelines.set(src.pipeline, src);
    let getTint = Phaser.Renderer.WebGL.Utils.getTintAppendFloatAlpha;

    renderer.pipelines.preBatch(src);

    for (let entry of this.renderList) {
      let frame = entry.cacheEntry.asset.getFrame(this.animationFrame);
      let texture = frame.glTexture;
      let textureUnit = pipeline.setTexture2D(texture, src);

      let alpha = 1.0;
      if (entry === this.selectedEntry) {
        alpha = 0.6;
      }

      let tint = getTint(0xffffff, alpha);

      pipeline.batchTexture(
        src,
        texture,
        texture.width,
        texture.height,
        entry.x,
        entry.y,
        frame.width,
        frame.height,
        1,
        1,
        0,
        false,
        false,
        1,
        1,
        0,
        0,
        frame.cutX,
        frame.cutY,
        frame.width,
        frame.height,
        tint,
        tint,
        tint,
        tint,
        false,
        0,
        0,
        camera,
        null,
        true,
        textureUnit
      );
    }

    renderer.pipelines.postBatch(src);
  }

  renderCanvas(renderer, _src, camera) {
    let ctx = renderer.currentContext;
    ctx.save();

    ctx.transform(1, 0, 0, 1, -camera.scrollX, -camera.scrollY);

    if (!renderer.antialias) {
      ctx.imageSmoothingEnabled = false;
    }

    for (let entry of this.renderList) {
      ctx.save();

      let alpha = 1.0;
      if (entry === this.selectedEntry) {
        alpha = 0.6;
      }

      ctx.globalAlpha = alpha;

      let frame = entry.cacheEntry.asset.getFrame(this.animationFrame);
      let cd = frame.canvasData;
      let frameX = cd.x;
      let frameY = cd.y;
      let frameWidth = frame.cutWidth;
      let frameHeight = frame.cutHeight;
      let res = frame.source.resolution;

      ctx.drawImage(
        frame.source.image,
        frameX,
        frameY,
        frameWidth,
        frameHeight,
        entry.x,
        entry.y,
        frameWidth / res,
        frameHeight / res
      );

      ctx.restore();
    }

    ctx.restore();
  }

  update(_time, _delta) {
    if (this.scene.cameras.main.dirty) {
      this.cull();
    }
    this.updateAnimationFrame();
  }

  updateAnimationFrame() {
    let oldAnimationFrame = this.animationFrame;
    this.animationFrame = Math.trunc(performance.now() / 600) % 4;
    this.dirtyAnimationFrame = this.animationFrame !== oldAnimationFrame;
  }

  destroy(fromScene) {
    for (let entry in this.entries.values()) {
      entry.visible = false;
    }
    super.destroy(fromScene);
  }

  get width() {
    return this._width;
  }

  set width(value) {
    this._width = value;
    this.dirtyLayout = true;
  }

  get height() {
    return this._height;
  }

  get selectedEntry() {
    return this._selectedEntry;
  }
}

Phaser.Class.mixin(PaletteLayer, [
  Phaser.GameObjects.Components.BlendMode,
  Phaser.GameObjects.Components.Depth,
  Phaser.GameObjects.Components.Pipeline,
  Phaser.GameObjects.Components.Visible,
]);

Phaser.GameObjects.GameObjectFactory.register("paletteLayer", function (scene) {
  const layer = new PaletteLayer(scene);
  this.displayList.add(layer);
  return layer;
});
