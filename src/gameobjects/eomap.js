import { arrayEquals, binaryInsert, removeFirst } from "../utils";

const SECTION_SIZE = 256;

const TDG = 0.00000001; // gap between depth of each tile on a layer
const RDG = 0.001; // gap between depth of each row of tiles

// prettier-ignore
const layerInfo = [
    { file: 3,  xoff: 0,  yoff: 0,  alpha: 1.0, centered: false, depth:-2.0 + TDG * 1 }, // Ground
    { file: 4,  xoff:-2,  yoff:-2,  alpha: 1.0, centered: true,  depth: 0.0 + TDG * 4 }, // Objects
    { file: 5,  xoff:-2,  yoff:-2,  alpha: 1.0, centered: true,  depth: 0.0 + TDG * 6 }, // Overlay
    { file: 6,  xoff: 0,  yoff:-1,  alpha: 1.0, centered: false, depth: 0.0 + TDG * 5 }, // Down Wall
    { file: 6,  xoff: 32, yoff:-1,  alpha: 1.0, centered: false, depth:-RDG + TDG * 9 }, // Right Wall
    { file: 7,  xoff: 0,  yoff:-64, alpha: 1.0, centered: false, depth: 0.0 + TDG * 7 }, // Roof
    { file: 3,  xoff: 0,  yoff:-32, alpha: 1.0, centered: false, depth: 0.0 + TDG * 2 }, // Top
    { file: 22, xoff:-24, yoff:-12, alpha: 0.2, centered: false, depth:-1.0 + TDG * 2 }, // Shadow
    { file: 5,  xoff:-2,  yoff:-2,  alpha: 1.0, centered: true,  depth: 1.0 + TDG * 8 }  // Overlay 2
];

const calcDepth = (x, y, layer) => {
  return layerInfo[layer].depth + y * RDG + x * layerInfo.length * TDG;
};

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
  constructor(scene, textureCache, emf, width, height) {
    super(scene, "EOMap");

    this.emf = emf;
    this.textureCache = textureCache;
    this.width = width;
    this.height = height;
    this.layerVisibility = new Array(layerInfo.length).fill(true);
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
        for (let layer = 0; layer < layerInfo.length; ++layer) {
          let gfx = this.emf.getTile(x, y).gfx[layer];

          this.setTileGraphic(x, y, gfx, layer);
        }
      }
    }
  }

  rebuildRenderList() {
    let visibleGraphicIndices = new Set();
    for (let section of this.visibleSections) {
      for (let graphicIndex of section) {
        let layer = this.tileGraphics[graphicIndex].layer;
        if (this.layerVisibility[layer]) {
          visibleGraphicIndices.add(graphicIndex);
        }
      }
    }

    this.renderList = Array.from(
      visibleGraphicIndices,
      (index) => this.tileGraphics[index]
    );
    this.renderList.sort(depthComparator);

    this.dirtyRenderList = false;
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

  setTileGraphic(x, y, gfx, layer, modifyRenderList) {
    if (modifyRenderList === undefined) {
      modifyRenderList = true;
    }

    this.emf.getTile(x, y).gfx[layer] = gfx;

    let graphicIndex = (y * this.emf.width + x) * layerInfo.length + layer;
    let oldGraphic = this.tileGraphics[graphicIndex];

    if (oldGraphic) {
      oldGraphic.cacheEntry.decRef();
      for (let section of this.findSections(oldGraphic)) {
        section.delete(graphicIndex);
      }
      delete this.tileGraphics[graphicIndex];
    }

    let displayGfx = this.getDisplayGfx(gfx, layer);
    if (displayGfx === null) {
      if (modifyRenderList && oldGraphic) {
        removeFirst(this.renderList, oldGraphic);
      }
      return;
    }

    let info = layerInfo[layer];

    let resourceID = displayGfx + 100;

    let cacheEntry = this.textureCache.getResource(info.file, resourceID);
    if (!cacheEntry) {
      console.debug("Could not load gfx %d/%d.", displayGfx, info.file);
      return;
    }

    cacheEntry.incRef();

    let tilex = info.xoff + x * 32 - y * 32;
    let tiley = info.yoff + x * 16 + y * 16;

    if (info.centered) {
      tilex -= Math.floor(cacheEntry.asset.width / 2) - 32;
    }

    if (layer !== 0 && layer !== 7) {
      tiley -= cacheEntry.asset.height - 32;
    }

    let tileGraphic = new TileGraphic(
      cacheEntry,
      tilex,
      tiley,
      layer,
      calcDepth(x, y, layer),
      info.alpha
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

  setLayerVisibility(layer, visibility) {
    if (this.layerVisibility[layer] !== visibility) {
      this.layerVisibility[layer] = visibility;
      this.dirtyRenderList = true;
    }
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
