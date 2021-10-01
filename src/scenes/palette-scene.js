import {
  PaletteLayerResourceEntry,
  PaletteLayerSpecEntry,
  PaletteLayerBlackTileEntry,
} from "../gameobjects/palette-layer";
import { TextureCache } from "../gfx/texture-cache";

class LayerPreload {
  static PRELOAD_PER_FRAME = 5;

  constructor(layer) {
    this.layer = layer;
    this.preloadEntries = Array.from(this.layer.entries.values());
  }

  update() {
    let pending = this.layer.scene.textureCache.pending;
    let amount = 0;

    for (let resource of this.preloadEntries) {
      if (pending.length >= LayerPreload.PRELOAD_PER_FRAME) {
        break;
      }
      resource.preload();
      ++amount;
    }

    this.preloadEntries.splice(0, amount);
  }

  get finished() {
    return this.preloadEntries.length === 0;
  }
}

export class PaletteScene extends Phaser.Scene {
  constructor() {
    super("palette");
    this.firstUpdate = true;
    this.textureCache = null;
    this.selectedLayer = null;
    this.layers = [];
    this.preloads = [];
    this.lastResize = performance.now();
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

    this.data.events.on(
      "changedata-selectedLayer",
      (_parent, value, _previousValue) => {
        this.selectLayer(value);
      }
    );

    this.data.events.on(
      "changedata-eyedrop",
      (_parent, value, _previousValue) => {
        this.selectedLayer.selectEntry(value.drawID);
        let resource = this.selectedLayer.selectedEntry;
        if (resource) {
          this.selectedLayer.scroll = resource.y;
          this.updateScroll();
        }
        this.updateSelectedDrawID();
      }
    );

    this.data.events.on(
      "changedata-contentScroll",
      (_parent, value, _previousValue) => {
        this.cameras.main.scrollY = value;
        this.selectedLayer.scroll = value;
      }
    );

    this.input.on("pointerup", (pointer) => {
      if (pointer.leftButtonReleased() && pointer.getDistance() < 16) {
        let entry = this.selectedLayer.getEntryAtPosition(
          pointer.x,
          pointer.y + this.cameras.main.scrollY
        );
        if (entry) {
          this.selectedLayer.selectEntry(entry.id);
          this.updateSelectedDrawID();
        }
      }
    });

    this.scale.on("resize", this.resize, this);

    this.selectLayer(this.data.values.selectedLayer);
    this.resize();
  }

  createLayers() {
    let result = [];

    for (let fileID of [3, 4, 5, 6, 6, 7, 3, 22, 5]) {
      result.push(this.createResourceLayer(fileID));
    }

    result.push(this.createSpecLayer());

    return result;
  }

  createResourceLayer(fileID) {
    let layer = this.add.paletteLayer(this);
    let gfxLoader = this.data.values.gfxLoader;
    let resourceIDs = gfxLoader.resourceIDs(fileID);

    if (fileID === 3) {
      layer.addEntry(new PaletteLayerBlackTileEntry(this.textureCache));
    }

    for (let resourceID of resourceIDs) {
      if (resourceID < 101) {
        continue;
      }

      let info = gfxLoader.resourceInfo(fileID, resourceID);
      let width = info.width;
      let height = info.height;

      if (fileID === 3 || fileID === 7) {
        width = 64;
        height = 32;
      }

      if (fileID === 6 && width >= 32 * 4) {
        width = Math.floor(width / 4);
      }

      let resource = new PaletteLayerResourceEntry(
        this.textureCache,
        width,
        height,
        fileID,
        resourceID
      );

      layer.addEntry(resource);
    }

    return layer;
  }

  createSpecLayer() {
    let layer = this.add.paletteLayer(this);

    for (let tileSpec = 0; tileSpec < 37; ++tileSpec) {
      let spec = new PaletteLayerSpecEntry(this.textureCache, tileSpec);
      layer.addEntry(spec);
    }

    return layer;
  }

  selectLayer(layer) {
    if (this.selectedLayer) {
      this.selectedLayer.visible = false;
    }

    this.selectedLayer = this.layers[layer];
    this.selectedLayer.visible = true;

    this.prioritizePreloads();
    this.updateScroll();
    this.updateSelectedDrawID();
    this.updateContentHeight();
  }

  update(_time, _delta) {
    this.selectedLayer.update(_time, _delta);

    if (this.selectedLayer.dirty && this.canDoResizeLayout()) {
      this.selectedLayer.layout();
      this.updateContentHeight();
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

  canDoResizeLayout() {
    return this.lastResize < performance.now() - 100;
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
    this.lastResize = performance.now();
  }

  prioritizePreloads() {
    let preloads = this.preloads;
    for (let preload of preloads) {
      if (preload.layer === this.selectedLayer) {
        Phaser.Utils.Array.MoveTo(preloads, preload, 0);
        break;
      }
    }
  }

  updateScroll() {
    this.events.emit(
      "scroll-changed",
      this.selectedLayer.scroll,
      this.data.values.contentScroll
    );
  }

  updateSelectedDrawID() {
    let id = null;
    if (this.selectedLayer.selectedEntry) {
      id = this.selectedLayer.selectedEntry.id;
    }
    this.data.set("selectedDrawID", id);
  }

  updateContentHeight() {
    this.data.set("contentHeight", this.selectedLayer.height);
  }
}
