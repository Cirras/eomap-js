import { arrayEquals, binaryInsert, removeFirst } from "../utils";

const SECTION_SIZE = 256;

const TDG = 0.00000001; // gap between depth of each tile on a layer
const RDG = 0.001; // gap between depth of each row of tiles

// prettier-ignore
const layerInfo = [
    { xoff: 0,  yoff: 0,  alpha: 1.0,  centered: false, bottomOrigin: false, depth:-3.0 + TDG * 1 }, // Ground
    { xoff:-2,  yoff:-2,  alpha: 1.0,  centered: true,  bottomOrigin: true,  depth: 0.0 + TDG * 1 }, // Objects
    { xoff:-2,  yoff:-2,  alpha: 1.0,  centered: true,  bottomOrigin: true,  depth: 0.0 + TDG * 3 }, // Overlay
    { xoff: 0,  yoff:-1,  alpha: 1.0,  centered: false, bottomOrigin: true,  depth: 0.0 + TDG * 2 }, // Down Wall
    { xoff: 32, yoff:-1,  alpha: 1.0,  centered: false, bottomOrigin: true,  depth:-RDG + TDG * 5 }, // Right Wall
    { xoff: 0,  yoff:-64, alpha: 1.0,  centered: false, bottomOrigin: true,  depth: 0.0 + TDG * 4 }, // Roof
    { xoff: 0,  yoff:-32, alpha: 1.0,  centered: false, bottomOrigin: true,  depth: 0.0 + TDG * 2 }, // Top
    { xoff:-24, yoff:-12, alpha: 0.2,  centered: false, bottomOrigin: false, depth:-1.0 + TDG * 1 }, // Shadow
    { xoff:-2,  yoff:-2,  alpha: 1.0,  centered: true,  bottomOrigin: true,  depth: 1.0 + TDG * 1 }, // Overlay 2
    { xoff: 0,  yoff: 0,  alpha: 0.25, centered: false, bottomOrigin: false, depth:-2.0 + TDG * 1 }, // TileSpec
    { xoff: 0,  yoff: 0,  alpha: 0.25, centered: false, bottomOrigin: false, depth: 3.0 + TDG * 1 }  // TileSpec overlay
];

const layerFiles = [3, 4, 5, 6, 6, 7, 3, 22, 5];

const depthComparator = (a, b) => a.depth - b.depth;

class TileGraphic {
  constructor(cacheEntry, x, y, layer, depth, alpha) {
    this.cacheEntry = cacheEntry;
    this.x = x;
    this.y = y;
    this.layer = layer;
    this.depth = depth;
    this.alpha = alpha;
  }

  get width() {
    return this.cacheEntry.asset.width;
  }

  get height() {
    return this.cacheEntry.asset.height;
  }
}

export class EOMap extends Phaser.GameObjects.GameObject {
  constructor(scene, textureCache, emf, width, height, layerVisibility) {
    super(scene, "EOMap");

    this.emf = emf;
    this.textureCache = textureCache;
    this.width = width;
    this.height = height;
    this.layerVisibility = layerVisibility;
    this.selectedLayer = 0;
    this.sectionWidth = Math.ceil((this.emf.width * 64) / SECTION_SIZE);
    this.sectionHeight = Math.ceil((this.emf.height * 32) / SECTION_SIZE);
    this.sections = [];
    this.visibleSections = [];
    this.tileGraphics = {};
    this.renderList = [];
    this.dirtyRenderList = false;
    this.animationFrame = 0;

    this.initSections();
    this.initTileGraphics();

    this.initPipeline();
  }

  initSections() {
    let sectionCount = this.sectionWidth * this.sectionHeight;
    for (let i = 0; i < sectionCount; ++i) {
      this.sections.push(new Set());
    }
  }

  initTileGraphics() {
    for (let y = 0; y < this.emf.height; ++y) {
      for (let x = 0; x < this.emf.width; ++x) {
        let tile = this.emf.getTile(x, y);
        for (let layer = 0; layer < 9; ++layer) {
          let gfx = tile.gfx[layer];
          this.setGraphic(x, y, gfx, layer);
        }
        this.setSpec(x, y, tile.spec);
      }
    }
  }

  rebuildRenderList() {
    let visibleGraphicIndices = new Set();
    for (let section of this.visibleSections) {
      for (let graphicIndex of section) {
        let layer = this.tileGraphics[graphicIndex].layer;
        if (this.layerVisibility.isLayerVisible(layer)) {
          visibleGraphicIndices.add(graphicIndex);
        }
      }
    }

    this.renderList = Array.from(visibleGraphicIndices, (index) => {
      let tileGraphic = this.tileGraphics[index];
      tileGraphic.alpha = this.calcAlpha(tileGraphic.layer);
      return tileGraphic;
    });

    this.renderList.sort(depthComparator);

    this.dirtyRenderList = false;
  }

  calcDepth(x, y, layer) {
    return layerInfo[layer].depth + y * RDG + x * layerInfo.length * TDG;
  }

  calcAlpha(layer) {
    let alpha = layerInfo[layer].alpha;
    if (layer === 9 && this.selectedLayer === 9) {
      alpha *= 3;
    }
    return alpha;
  }

  getDisplayGfx(gfx, layer) {
    if (gfx === null && layer === 0) {
      return this.emf.fillTile;
    }
    return gfx;
  }

  getSection(x, y) {
    return this.sections[y * this.sectionWidth + x];
  }

  findSections(tileGraphic) {
    let halfWidth = this.emf.width * 32;
    let x = tileGraphic.x + halfWidth;
    let y = tileGraphic.y;

    let width = tileGraphic.width;
    let height = tileGraphic.height;

    let top = Math.trunc(y / SECTION_SIZE);
    let bottom = Math.trunc((y + height) / SECTION_SIZE);
    let left = Math.trunc(x / SECTION_SIZE);
    let right = Math.trunc((x + width) / SECTION_SIZE);

    bottom = Math.min(this.sectionHeight - 1, bottom);
    right = Math.min(this.sectionWidth - 1, right);

    top = Math.max(0, top);
    bottom = Math.max(0, bottom);
    left = Math.max(0, left);
    right = Math.max(0, right);

    let result = [];

    for (let y = top; y <= bottom; ++y) {
      for (let x = left; x <= right; ++x) {
        let section = this.getSection(x, y);
        result.push(section);
      }
    }

    return result;
  }

  draw(x, y, drawID, layer, modifyRenderList) {
    if (layer >= 0 && layer <= 8) {
      this.setGraphic(x, y, drawID, layer, modifyRenderList);
      return;
    }

    if (layer === 9) {
      this.setSpec(x, y, drawID, modifyRenderList);
      return;
    }

    throw new Error(`Invalid draw layer: ${layer}`);
  }

  getDrawID(x, y, layer) {
    if (layer >= 0 && layer <= 8) {
      return this.emf.getTile(x, y).gfx[layer];
    }

    if (layer === 9) {
      return this.emf.getTile(x, y).spec;
    }

    throw new Error(`Invalid draw layer: ${layer}`);
  }

  setGraphic(x, y, gfx, layer, modifyRenderList) {
    this.emf.getTile(x, y).gfx[layer] = gfx;

    let cacheEntry = null;
    let displayGfx = this.getDisplayGfx(gfx, layer);

    if (displayGfx !== null) {
      let fileID = layerFiles[layer];
      let resourceID = displayGfx + 100;

      cacheEntry = this.textureCache.getResource(fileID, resourceID);
      if (!cacheEntry) {
        console.warn("Could not load gfx %d/%d.", displayGfx, file);
        return;
      }
    }

    this.setTileGraphic(x, y, layer, cacheEntry, modifyRenderList);
  }

  setSpec(x, y, tileSpec, modifyRenderList) {
    this.emf.getTile(x, y).spec = tileSpec;

    let cacheEntry = null;

    if (tileSpec !== null) {
      cacheEntry = this.textureCache.getSpec(tileSpec);
      if (!cacheEntry) {
        console.warn("Could not load tileSpec %d.", tileSpec);
        return;
      }
    }

    this.setTileGraphic(x, y, 9, cacheEntry, modifyRenderList);
    this.setTileGraphic(x, y, 10, cacheEntry, modifyRenderList);
  }

  setTileGraphic(x, y, layer, cacheEntry, modifyRenderList) {
    if (modifyRenderList === undefined) {
      modifyRenderList = true;
    }

    let graphicIndex = (y * this.emf.width + x) * layerInfo.length + layer;
    let oldGraphic = this.tileGraphics[graphicIndex];

    if (oldGraphic) {
      oldGraphic.cacheEntry.decRef();
      for (let section of this.findSections(oldGraphic)) {
        section.delete(graphicIndex);
      }
      delete this.tileGraphics[graphicIndex];
    }

    if (cacheEntry === null) {
      if (modifyRenderList && oldGraphic) {
        removeFirst(this.renderList, oldGraphic);
      }
      return;
    }

    let info = layerInfo[layer];

    if (!cacheEntry) {
      return;
    }

    cacheEntry.incRef();

    let tilex = info.xoff + x * 32 - y * 32;
    let tiley = info.yoff + x * 16 + y * 16;

    if (info.centered) {
      tilex -= Math.floor(cacheEntry.asset.width / 2) - 32;
    }

    if (info.bottomOrigin) {
      tiley -= cacheEntry.asset.height - 32;
    }

    let tileGraphic = new TileGraphic(
      cacheEntry,
      tilex,
      tiley,
      layer,
      this.calcDepth(x, y, layer),
      this.calcAlpha(layer)
    );

    for (let section of this.findSections(tileGraphic)) {
      section.add(graphicIndex);
    }

    this.tileGraphics[graphicIndex] = tileGraphic;

    if (modifyRenderList) {
      binaryInsert(this.renderList, tileGraphic, depthComparator);
    }
  }

  cull() {
    let halfWidth = this.emf.width * 32;
    let fullHeight = this.emf.height * 32;

    let camera = this.scene.cameras.main;
    let cullTop = camera.scrollY;
    let cullBottom = cullTop + camera.height;
    let cullLeft = camera.scrollX;
    let cullRight = cullLeft + camera.width;

    if (cullBottom < 0) {
      cullTop = -camera.height;
      cullBottom = 0;
    } else if (cullTop > fullHeight) {
      cullTop = fullHeight;
      cullBottom = cullTop + camera.height;
    }

    if (cullRight < -halfWidth) {
      cullRight = -halfWidth;
      cullLeft = cullRight - camera.width;
    } else if (cullLeft > halfWidth) {
      cullLeft = halfWidth;
      cullRight = cullLeft + camera.width;
    }

    cullTop = Math.max(0, cullTop);
    cullBottom = Math.min(fullHeight, cullBottom);
    cullLeft = Math.max(-halfWidth, cullLeft);
    cullRight = Math.min(halfWidth, cullRight);

    let oldVisibleSections = this.visibleSections;
    this.visibleSections = [];

    for (let y = 0; y < this.sectionHeight; ++y) {
      let top = y * SECTION_SIZE;
      let bottom = top + SECTION_SIZE;
      for (let x = 0; x < this.sectionWidth; ++x) {
        let left = -halfWidth + x * SECTION_SIZE;
        let right = left + SECTION_SIZE;

        let isVisible =
          right >= cullLeft &&
          left <= cullRight &&
          bottom >= cullTop &&
          top <= cullBottom;

        if (isVisible) {
          this.visibleSections.push(this.getSection(x, y));
        }
      }
    }

    if (!arrayEquals(oldVisibleSections, this.visibleSections)) {
      this.dirtyRenderList = true;
    }
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
  }

  setLayerVisibility(layerVisibility) {
    this.layerVisibility = layerVisibility;
    this.dirtyRenderList = true;
  }

  setSelectedLayer(selectedLayer) {
    this.selectedLayer = selectedLayer;
    this.dirtyRenderList = true;
  }

  renderWebGL(renderer, src, camera) {
    let pipeline = renderer.pipelines.set(src.pipeline, src);
    let getTint = Phaser.Renderer.WebGL.Utils.getTintAppendFloatAlpha;

    renderer.pipelines.preBatch(src);

    for (let tileGraphic of this.renderList) {
      let frame = tileGraphic.cacheEntry.asset.getFrame(this.animationFrame);
      let texture = frame.glTexture;
      let textureUnit = pipeline.setTexture2D(texture, src);

      let tint = getTint(0xffffff, tileGraphic.alpha);

      pipeline.batchTexture(
        src,
        texture,
        texture.width,
        texture.height,
        tileGraphic.x,
        tileGraphic.y,
        tileGraphic.width,
        tileGraphic.height,
        1,
        1,
        0,
        false,
        true,
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

    for (let tileGraphic of this.renderList) {
      ctx.save();
      ctx.globalAlpha = tileGraphic.alpha;

      let frame = tileGraphic.cacheEntry.asset.getFrame(this.animationFrame);
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
        tileGraphic.x,
        tileGraphic.y,
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

    if (this.dirtyRenderList) {
      this.rebuildRenderList();
    }

    this.animationFrame = Math.trunc(performance.now() / 600) % 4;
  }

  destroy(fromScene) {
    for (let index in this.tileGraphics) {
      this.tileGraphics[index].cacheEntry.decRef();
      delete this.tileGraphics[index];
    }

    this.tileGraphics = null;
    this.sections = null;

    super.destroy(fromScene);
  }
}

Phaser.Class.mixin(EOMap, [
  Phaser.GameObjects.Components.BlendMode,
  Phaser.GameObjects.Components.Depth,
  Phaser.GameObjects.Components.Pipeline,
]);

Phaser.GameObjects.GameObjectFactory.register(
  "eomap",
  function (scene, textureCache, emf, width, height) {
    const map = new EOMap(scene, textureCache, emf, width, height);
    this.displayList.add(map);
    return map;
  }
);
