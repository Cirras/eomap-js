import { TextureCache } from "../gfx/texture-cache";

class PaletteLayerResource {
  constructor(layer, fileID, resourceID, width, height) {
    this.layer = layer;
    this.fileID = fileID;
    this.resourceID = resourceID;
    this.width = width;
    this.height = height;
    this._x = 0;
    this._y = 0;
    this.sprite = null;
    this.pointerDown = false;
  }

  show() {
    if (this.sprite) {
      return;
    }

    let asset = this.getAsset();
    asset.incRef();

    if (asset.data.animation) {
      this.sprite = this.layer.scene.add
        .sprite(this.x, this.y)
        .play(asset.data.animation);
      this.layer.scene.syncToMasterAnimation(this.sprite);
    } else {
      this.sprite = this.layer.scene.add.sprite(
        this.x,
        this.y,
        asset.data.textureKey,
        asset.data.frameKey
      );
    }

    if (this.selected) {
      this.sprite.setAlpha(0.6);
    }

    this.sprite.setOrigin(0);
    this.sprite.setInteractive();

    this.sprite.on("pointerup", (pointer) => {
      if (pointer.leftButtonReleased() && pointer.getDistance() < 16) {
        this.select();
        this.pointerDown = false;
      }
    });
  }

  hide() {
    if (!this.sprite) {
      return;
    }

    this.getAsset().decRef();
    this.sprite.destroy();
    this.sprite = null;
  }

  select() {
    if (this.layer.selectedResource) {
      this.layer.selectedResource.unselect();
    }

    this.layer.selectedResource = this;
    if (this.sprite) {
      this.sprite.setAlpha(0.6);
    }
  }

  unselect() {
    this.layer.selectedResource = null;
    if (this.sprite) {
      this.sprite.setAlpha(1);
    }
  }

  getAsset() {
    return this.layer.scene.textureCache.get(this.fileID, this.resourceID);
  }

  preload() {
    this.getAsset();
  }

  get selected() {
    return this.layer.selectedResource === this;
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

class PaletteLayer {
  constructor(scene, fileID) {
    this.scene = scene;
    this.fileID = fileID;
    this.resources = this.createResources();
    this._selectedResource = null;
    this.width = 0;
    this.height = 0;
    this.scroll = 0;
    this.dirty = true;
  }

  createResources() {
    let result = new Map();

    let gfxLoader = this.scene.data.values.gfxLoader;
    let resourceIDs = gfxLoader.resourceIDs(this.fileID);

    for (let resourceID of resourceIDs) {
      if (resourceID > 100) {
        let info = gfxLoader.info(this.fileID, resourceID);
        result.set(
          resourceID,
          new PaletteLayerResource(
            this,
            this.fileID,
            resourceID,
            info.width,
            info.height
          )
        );
      }
    }

    return result;
  }

  hide() {
    for (let resource of this.resources.values()) {
      resource.hide();
    }
  }

  show() {
    this.scene.updateScroll();
    this.scene.updateSelectedGraphic();
    this.prioritizePreloads();
    this.layout();
  }

  prioritizePreloads() {
    let preloads = this.scene.preloads;
    for (let preload of preloads) {
      if (preload.layer === this) {
        Phaser.Utils.Array.MoveTo(preloads, preload, 0);
        break;
      }
    }
  }

  cull() {
    let cullTop = this.scroll;
    let cullBottom = cullTop + this.scene.cameras.main.height;

    for (let resource of this.resources.values()) {
      let resourceTop = resource.y;
      let resourceBottom = resourceTop + resource.height;

      if (resourceBottom > cullTop && resourceTop < cullBottom) {
        resource.show();
      } else {
        resource.hide();
      }
    }
  }

  layout() {
    if (this.dirty) {
      this.layoutAssets();
    }
    this.cull();
    this.scene.data.set("contentHeight", this.height);
  }

  layoutAssets() {
    const xRes = 32;
    const yRes = 32;

    let pageWidth = Math.floor(this.width / xRes);
    let colHeights = new Array(pageWidth).fill(0);

    this.height = 0;

    for (let resource of this.resources.values()) {
      let width = resource.width;
      let height = resource.height;

      if (this.fileID === 3) {
        width = 64;
        height = 32;
      }

      if (this.fileID === 6 && width >= 32 * 4) {
        width = Math.floor(width / 4);
      }

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

            resource.x = x * xRes;
            resource.y = (y - 1) * yRes;

            this.height = Math.max(resource.y + resource.height, this.height);

            foundPosition = true;
            break;
          }
        }

        if (foundPosition) {
          break;
        }
      }
    }

    this.dirty = false;
  }

  get width() {
    return this._width;
  }

  set width(value) {
    this._width = value;
    this.dirty = true;
  }

  get selectedResource() {
    return this._selectedResource;
  }

  set selectedResource(value) {
    this._selectedResource = value;
    this.scene.updateSelectedGraphic();
  }
}

class LayerPreload {
  static PRELOAD_PER_FRAME = 5;

  constructor(layer) {
    this.layer = layer;
    this.preloadResources = Array.from(this.layer.resources.values());
  }

  update() {
    let pending = this.layer.scene.textureCache.pending;
    let amount = 0;

    for (let resource of this.preloadResources) {
      if (pending.length >= LayerPreload.PRELOAD_PER_FRAME) {
        break;
      }
      resource.preload();
      ++amount;
    }

    this.preloadResources.splice(0, amount);
  }

  get finished() {
    return this.preloadResources.length === 0;
  }
}

export class PaletteScene extends Phaser.Scene {
  constructor() {
    super("palette");
    this.firstUpdate = true;
    this.textureCache = null;
    this.layers = [];
    this.preloads = [];
    this.masterAnimation = null;
  }

  create() {
    this.textureCache = new TextureCache(
      this,
      this.data.values.gfxLoader,
      2048,
      2048
    );

    this.layers = this.createLayers();
    this.preloads = this.layers.map((layer) => new LayerPreload(layer));
    this.masterAnimation = this.createMasterAnimation();

    this.data.events.on(
      "changedata-selectedLayer",
      (_parent, value, previousValue) => {
        this.layers[previousValue].hide();
        this.layers[value].show();
      }
    );

    this.data.events.on(
      "changedata-eyedrop",
      (_parent, value, _previousValue) => {
        if (value.graphic === null) {
          if (this.selectedResource) {
            this.selectedResource.unselect();
          }
          return;
        }

        let resource = this.selectedLayer.resources.get(value.graphic + 100);
        if (resource) {
          resource.select();
          this.selectedLayer.scroll = resource.y;
          this.updateScroll();
        }
      }
    );

    this.data.events.on(
      "changedata-contentScroll",
      (_parent, value, _previousValue) => {
        if (this.selectedLayer.scroll !== value) {
          this.cameras.main.scrollY = value;
          this.selectedLayer.scroll = value;
        }
      }
    );

    this.scale.on("resize", this.resize, this);
    this.resize();
  }

  createLayers() {
    let result = [];
    for (let fileID of [3, 4, 5, 6, 6, 7, 3, 22, 5]) {
      result.push(new PaletteLayer(this, fileID));
    }
    return result;
  }

  // FIXME: This is a stupid idea.
  createMasterAnimation() {
    let asset = this.textureCache.get(2, 124);
    asset.incRef();

    let frames = asset.data.frames.map((f) => ({
      key: f.texture.key,
      frame: f.name,
    }));
    frames.pop();

    let animation = this.game.anims.create({
      key: "masterAnimation",
      frames: frames,
      frameRate: 1.66,
      repeat: -1,
    });

    return this.add.sprite(0, -100).setVisible(false).play(animation).anims;
  }

  update(_time, _delta) {
    if (this.cameras.main.dirty) {
      this.selectedLayer.cull();
    }

    if (this.preloads.length > 0) {
      let preload = this.preloads[0];
      preload.update();
      if (preload.finished) {
        this.preloads.shift();
      }
    }

    this.textureCache.update();

    if (this.firstUpdate) {
      this.firstUpdate = false;
      this.events.emit("first-update");
    }
  }

  resize(gameSize, _baseSize, _displaySize, _resolution) {
    let width;
    let height;

    if (gameSize === undefined) {
      width = this.sys.scale.width;
      height = this.sys.scale.height;
    } else {
      width = gameSize.width;
      height = gameSize.height;
    }

    for (let layer of this.layers) {
      layer.width = width;
    }

    this.cameras.main.setSize(width, height);
    this.selectedLayer.layout();
  }

  syncToMasterAnimation(sprite) {
    if (sprite.anims.isPlaying) {
      sprite.anims.setProgress(this.masterAnimation.getProgress());
      sprite.anims.accumulator = this.masterAnimation.accumulator;
    }
  }

  updateScroll() {
    this.cameras.main.scrollY = this.selectedLayer.scroll;
    this.data.set("contentScroll", this.selectedLayer.scroll);
  }

  updateSelectedGraphic() {
    let graphic = null;
    if (this.selectedResource) {
      graphic = this.selectedResource.resourceID - 100;
    }
    this.data.set("selectedGraphic", graphic);
  }

  get selectedLayer() {
    return this.layers[this.data.values.selectedLayer];
  }

  get selectedResource() {
    return this.selectedLayer.selectedResource;
  }
}
