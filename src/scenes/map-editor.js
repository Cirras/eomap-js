import { EMF } from "../map";
import { TilePos } from "../tilepos";
import { CommandInvoker } from "../command/command";
import { SetGraphicCommand, FillCommand } from "../command/map-editor-command";
import { TextureCache } from "../gfx/texture-cache";

const TDG = 0.00000001; // gap between depth of each tile on a layer
const RDG = 0.001; // gap between depth of each row of tiles

// prettier-ignore
const layerInfo = [
    { file: 'tile',    xoff: 0,  yoff: 0,  alpha: 1.0, centered: false, depth:-2.0 + TDG * 1 }, // Ground
    { file: 'object',  xoff:-2,  yoff:-2,  alpha: 1.0, centered: true,  depth: 0.0 + TDG * 4 }, // Objects
    { file: 'overlay', xoff:-2,  yoff:-2,  alpha: 1.0, centered: true,  depth: 0.0 + TDG * 6 }, // Overlay
    { file: 'wall',    xoff: 0,  yoff:-1,  alpha: 1.0, centered: false, depth: 0.0 + TDG * 5 }, // Down Wall
    { file: 'wall',    xoff: 32, yoff:-1,  alpha: 1.0, centered: false, depth:-RDG + TDG * 9 }, // Right Wall
    { file: 'roof',    xoff: 0,  yoff:-64, alpha: 1.0, centered: false, depth: 0.0 + TDG * 7 }, // Roof
    { file: 'tile',    xoff: 0,  yoff:-32, alpha: 1.0, centered: false, depth: 0.0 + TDG * 2 }, // Top
    { file: 'shadow',  xoff:-24, yoff:-12, alpha: 0.2, centered: false, depth:-1.0 + TDG * 2 }, // Shadow
    { file: 'overlay', xoff:-2,  yoff:-2,  alpha: 1.0, centered: true,  depth: 1.0 + TDG * 8 }  // Overlay 2
];

const calcDepth = (x, y, layer) => {
  return layerInfo[layer].depth + y * RDG + x * layerInfo.length * TDG;
};

export class MapEditor extends Phaser.Scene {
  constructor(controller) {
    super("mapEditor");
    this.controller = controller;
    this.commandInvoker = new CommandInvoker();
    this.currentPos = new TilePos();
  }

  create() {
    this.textureCache = new TextureCache(this, "mapEditor", 1024, 1024);
    this.cursorSprite = this.add.sprite(0, 0, "tileCursor", 0);
    this.cursorSprite.visible = false;
    this.cursorSprite.setDepth(3.0);
    this.cursorSprite.setOrigin(0);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.zKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.yKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y);

    let controlConfig = {
      camera: this.cameras.main,
      left: this.cursors.left,
      right: this.cursors.right,
      up: this.cursors.up,
      down: this.cursors.down,
      zoomIn: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      zoomOut: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      speed: 1,
    };

    this.cameraControls = new Phaser.Cameras.Controls.FixedKeyControl(
      controlConfig
    );

    this.initMap();

    this.input.on("pointermove", (pointer) => this.handlePointerMove(pointer));
    this.input.on("pointerdown", (pointer) => this.handlePointerDown(pointer));
    this.input.on("pointerup", (pointer) => this.handlePointerUp(pointer));
    this.input.on("pointerupoutside", (pointer) =>
      this.handlePointerUp(pointer)
    );

    this.zKey.emitOnRepeat = true;
    this.yKey.emitOnRepeat = true;

    this.zKey.on("down", () => {
      if (this.zKey.ctrlKey) {
        if (this.zKey.shiftKey) {
          this.commandInvoker.redo();
        } else {
          this.commandInvoker.undo();
        }
      }
    });

    this.yKey.on("down", () => {
      if (this.yKey.ctrlKey) {
        this.commandInvoker.redo();
      }
    });

    this.controller.data.events.on("changedata-layerVisibility", () => {
      this.cull();
    });

    this.scene.sendToBack();
  }

  moveTileCursor(tilePos) {
    if (!tilePos.valid) {
      this.cursorSprite.visible = false;
      return false;
    }

    this.cursorSprite.visible = true;
    this.cursorSprite.setPosition(
      tilePos.x * 32 - tilePos.y * 32,
      tilePos.x * 16 + tilePos.y * 16
    );

    return true;
  }

  handlePointerMove(pointer) {
    this.controller.toolBar.currentTool.pointerMove(this, pointer);
  }

  handlePointerDown(pointer) {
    this.controller.toolBar.currentTool.pointerDown(this, pointer);
  }

  handlePointerUp(pointer) {
    this.controller.toolBar.currentTool.pointerUp(this, pointer);
    this.commandInvoker.finalizeAggregate();
  }

  doSetGraphicCommand(x, y, newGfx) {
    let layer = this.controller.palette.selectedLayer;
    let oldGfx = this.emf.getTile(x, y).gfx[layer];

    if (newGfx === oldGfx) {
      return;
    }

    this.commandInvoker.add(
      new SetGraphicCommand(this, x, y, layer, oldGfx, newGfx),
      true
    );
  }

  doFillCommand(x, y, newGfx) {
    let layer = this.controller.palette.selectedLayer;
    let oldGfx = this.emf.getTile(x, y).gfx[layer];

    if (newGfx === oldGfx) {
      return;
    }

    this.commandInvoker.add(new FillCommand(this, x, y, layer, oldGfx, newGfx));
  }

  doEyeDropper(x, y) {
    this.cursorSprite.play("tileCursorClick");

    let paletteLayer = this.controller.palette.currentLayer;
    let gfx = this.emf.getTile(x, y).gfx[paletteLayer.index];

    if (gfx === 0 && paletteLayer.index === 0) {
      gfx = this.emf.fill_tile;
    }

    if (gfx !== 0) {
      let entryKey = (gfx + 100).toString();
      paletteLayer.entries[entryKey].select();
      paletteLayer.assetAnchor = paletteLayer.selectedEntry.sprite;
      paletteLayer.assetAnchorOffset = 0;
      paletteLayer.scrollToAnchor();
    }
  }

  cull() {
    let camera = this.cameras.main;
    var mva = camera.matrix.a;
    var mvb = camera.matrix.b;
    var mvc = camera.matrix.c;
    var mvd = camera.matrix.d;

    /* First Invert Matrix */
    var determinant = mva * mvd - mvb * mvc;

    if (!determinant) {
      return;
    }

    var mve = camera.matrix.e;
    var mvf = camera.matrix.f;

    var scrollX = camera.scrollX;
    var scrollY = camera.scrollY;
    var cameraW = camera.width;
    var cameraH = camera.height;

    let depthSortRequired = false;
    let layerVisibility = this.controller.data.values.layerVisibility;

    for (let row of this.emf.rows) {
      for (let tile of row) {
        for (let layer = 0; layer < 9; ++layer) {
          let object = tile.sprites[layer];
          if (!object) {
            continue;
          }

          let objectW = object.width;
          let objectH = object.height;
          let objectX =
            object.x -
            scrollX * object.scrollFactorX -
            objectW * object.originX;
          let objectY =
            object.y -
            scrollY * object.scrollFactorY -
            objectH * object.originY;
          let tx = objectX * mva + objectY * mvc + mve;
          let ty = objectX * mvb + objectY * mvd + mvf;
          let tw = (objectX + objectW) * mva + (objectY + objectH) * mvc + mve;
          let th = (objectX + objectW) * mvb + (objectY + objectH) * mvd + mvf;

          let cullTop = camera.y;
          let cullBottom = cullTop + cameraH;
          let cullLeft = camera.x;
          let cullRight = cullLeft + cameraW;

          let layerIsVisible = layerVisibility[layer];

          let isVisible =
            layerIsVisible &&
            tw > cullLeft &&
            tx < cullRight &&
            th > cullTop &&
            ty < cullBottom;

          if (isVisible) {
            if (!object.visible) {
              this.addSpriteToScene(object);
              object.visible = true;
              depthSortRequired = true;
            }
          } else if (object.visible) {
            this.removeSpriteFromScene(object);
            object.visible = false;
          }
        }
      }
    }

    if (depthSortRequired) {
      this.children.queueDepthSort();
    }
  }

  update(_time, delta) {
    this.cameraControls.update(delta);

    if (this.cameras.main.dirty) {
      this.cull();
    }
  }

  updateCurrentPos(pointerPos) {
    let worldPos = this.cameras.main.getWorldPoint(pointerPos.x, pointerPos.y);
    let newPos = this.getTilePosFromWorldPos(worldPos);

    if (this.currentPos.x !== newPos.x || this.currentPos.y !== newPos.y) {
      this.currentPos = newPos;
    }
  }

  getTilePosFromPointerPos(pointerPos) {
    let worldPos = this.cameras.main.getWorldPoint(pointerPos.x, pointerPos.y);

    return this.getTilePosFromWorldPos(worldPos);
  }

  getTilePosFromWorldPos(worldPos) {
    let tilePos = new TilePos();
    tilePos.x = this.getTileXFromWorldPos(worldPos);
    tilePos.y = this.getTileYFromWorldPos(worldPos);

    tilePos.valid =
      tilePos.x >= 0 &&
      tilePos.x < this.emf.width &&
      tilePos.y >= 0 &&
      tilePos.y < this.emf.height;

    return tilePos;
  }

  getTileXFromWorldPos(worldPos) {
    return Math.floor(worldPos.y / 32 + (worldPos.x + 32) / 64) - 1;
  }

  getTileYFromWorldPos(worldPos) {
    return -Math.floor((worldPos.x + 32) / 64 - worldPos.y / 32);
  }

  initMap() {
    this.emf = EMF.from_json(this.cache.json.get("map"));

    for (let y = 0; y < this.emf.rows.length; ++y) {
      for (let x = 0; x < this.emf.rows[y].length; ++x) {
        for (let layer = 0; layer < layerInfo.length; ++layer) {
          let gfx = this.emf.rows[y][x].gfx[layer];

          this.setGraphic(x, y, gfx, layer);
        }
      }
    }

    this.textureCache.uploadChanges();
  }

  /*
   * Sets a gfx value for a tile at a given x/y position at the specified layer.
   * Adds a sprite to the scene (or modifies the existing one.)
   * @see SetGraphicCommand
   */
  setGraphic(x, y, gfx, layer) {
    let tile = this.emf.getTile(x, y);
    let sprite = tile.sprites[layer];
    let info = layerInfo[layer];

    const getAsset = (displayGfx) => {
      let frameKey = (displayGfx + 100).toString();
      return this.textureCache.get(info.file, frameKey);
    };

    const getDisplayGfx = (gfx) => {
      if (gfx === 0 && layer === 0) {
        return this.emf.fill_tile;
      }

      return gfx;
    };

    if (sprite) {
      if (tile.gfx[layer] === gfx) {
        return;
      }

      let asset = getAsset(getDisplayGfx(tile.gfx[layer]));
      asset.decRef();
    }

    let displayGfx = getDisplayGfx(gfx);
    tile.gfx[layer] = gfx;

    if (displayGfx === 0) {
      if (sprite) {
        tile.sprites[layer] = undefined;
        sprite.destroy();
      }

      return;
    }

    let tilex = info.xoff + x * 32 - y * 32;
    let tiley = info.yoff + x * 16 + y * 16;

    let asset = getAsset(displayGfx);
    let texture = asset.data.textureFrame;
    asset.incRef();

    if (info.centered) {
      tilex -= Math.floor(texture.realWidth / 2) - 32;
    }

    if (layer !== 0 && layer !== 7) {
      tiley -= texture.realHeight - 32;
    }

    if (!sprite) {
      sprite = this.add.sprite(0, 0);
    }

    sprite.setPosition(tilex, tiley);
    sprite.setDepth(calcDepth(x, y, layer));
    sprite.setAlpha(info.alpha);
    sprite.setOrigin(0);

    if (asset.data.hasAnimation) {
      sprite.play(asset.data.animationKey);
      this.controller.syncToMasterAnimation(sprite);
    } else {
      sprite.anims.stop();
      sprite.setTexture(asset.data.fileKey, asset.data.frameKey);
    }

    tile.sprites[layer] = sprite;
  }

  resetCameraPosition() {
    let scrollX = -this.cameras.main.centerX + 32;
    let scrollY = -64;

    this.cameras.main.setScroll(scrollX, scrollY);
  }

  addSpriteToScene(sprite) {
    this.sys.updateList.add(sprite);
    this.children.add(sprite);
    this.controller.syncToMasterAnimation(sprite);
  }

  removeSpriteFromScene(sprite) {
    this.sys.updateList.remove(sprite);
    this.children.remove(sprite);
  }

  get currentPos() {
    return this.controller.data.get("currentPos");
  }

  set currentPos(value) {
    this.controller.data.set("currentPos", value);
  }
}
