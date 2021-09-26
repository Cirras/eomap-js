import { CommandInvoker } from "../command/command";
import { DrawCommand, FillCommand } from "../command/map-command";
import { TilePos } from "../tilepos";
import { EvictingTextureCache } from "../gfx/texture-cache";

import { DrawTool } from "../tools/draw-tool";
import { EraseTool } from "../tools/erase-tool";
import { EyeDropperTool } from "../tools/eyedropper-tool";
import { MoveTool } from "../tools/move-tool";
import { FillTool } from "../tools/fill-tool";
import { EntityTool } from "../tools/entity-tool";

import "../gameobjects/eomap";

export class EditorScene extends Phaser.Scene {
  constructor() {
    super("editor");
    this.commandInvoker = new CommandInvoker();
    this.firstUpdate = true;
    this.ctrlKeyDown = false;
    this.currentPosDirty = false;

    this.currentPos = null;
    this.textureCache = null;
    this.map = null;
    this.tools = null;
    this.currentTool = null;
    this.cursorSprite = null;
    this.cursors = null;
    this.yKey = null;
    this.zKey = null;
    this.cameraControls = null;
  }

  create() {
    this.currentPos = new TilePos();

    this.textureCache = new EvictingTextureCache(
      this,
      this.data.values.gfxLoader,
      1024,
      1024
    );

    this.map = this.add.eomap(
      this,
      this.textureCache,
      this.data.values.emf,
      this.cameras.main.width,
      this.cameras.main.height,
      this.layerVisibility
    );

    this.tools = this.createTools();
    this.currentTool = null;

    this.cursorSprite = this.createTileCursor();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.yKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Y);
    this.zKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

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

    this.input.on("pointermove", (pointer) => this.handlePointerMove(pointer));
    this.input.on("pointerdown", (pointer) => this.handlePointerDown(pointer));
    this.input.on("pointerup", (pointer) => this.handlePointerUp(pointer));
    this.input.on("pointerupoutside", (pointer) =>
      this.handlePointerUp(pointer)
    );

    this.yKey.emitOnRepeat = true;
    this.zKey.emitOnRepeat = true;

    this.yKey.on("down", () => {
      if (this.yKey.ctrlKey) {
        this.commandInvoker.redo();
      }
    });

    this.zKey.on("down", () => {
      if (this.zKey.ctrlKey) {
        if (this.zKey.shiftKey) {
          this.commandInvoker.redo();
        } else {
          this.commandInvoker.undo();
        }
      }
    });

    this.data.set("eyedrop", null);

    this.data.events.on("changedata-layerVisibility", () => {
      this.updateLayerVisibility();
    });

    this.data.events.on("changedata-selectedLayer", () => {
      this.updateSelectedLayer();
    });

    this.data.events.on("changedata-tool", () => {
      this.updateCurrentTool();
    });

    this.scale.on("resize", this.resize, this);

    this.updateLayerVisibility();
    this.updateSelectedLayer();
    this.updateCurrentTool();
    this.resize();

    this.resetCameraPosition();
  }

  createTools() {
    return new Map([
      ["draw", new DrawTool()],
      ["erase", new EraseTool()],
      ["eyedropper", new EyeDropperTool()],
      ["move", new MoveTool()],
      ["fill", new FillTool()],
      ["entity", new EntityTool()],
    ]);
  }

  getTileCursorAsset() {
    return this.textureCache.getResource(2, 124).asset;
  }

  createTileCursor() {
    let cacheEntry = this.textureCache.getResource(2, 124);
    cacheEntry.incRef();

    let cursorSprite = this.add.sprite(0, 0);
    cursorSprite.visible = false;
    cursorSprite.setDepth(1.0);
    cursorSprite.setOrigin(0);
    cursorSprite.setTexture(
      cacheEntry.asset.textureKey,
      cacheEntry.asset.frames[0].name
    );

    return cursorSprite;
  }

  update(time, delta) {
    this.cameraControls.update(delta);
    this.textureCache.update();
    this.map.update(time, delta);

    if (this.currentPosDirty) {
      this.data.set("currentPos", this.currentPos);
      this.currentPosDirty = false;
    }

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

    this.cameras.main.setSize(width, height);
    let centerXDiff = this.cameras.main.scrollX + this.cameras.main.centerX;
    let centerYDiff = this.cameras.main.scrollY + this.cameras.main.centerY;
    this.cameras.main.scrollX = -this.cameras.main.centerX + centerXDiff;
    this.cameras.main.scrollY = -this.cameras.main.centerY + centerYDiff;

    this.map.setSize(width, height);
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
    this.ctrlKeyDown = pointer.event.ctrlKey;
    this.currentTool.pointerMove(this, pointer);
  }

  handlePointerDown(pointer) {
    this.ctrlKeyDown = pointer.event.ctrlKey;
    this.currentTool.pointerDown(this, pointer);
  }

  handlePointerUp(pointer) {
    this.currentTool.pointerUp(this, pointer);
  }

  doDrawCommand(x, y, newDrawID) {
    let oldDrawID = this.map.getDrawID(x, y, this.selectedLayer);

    if (newDrawID === oldDrawID) {
      return;
    }

    this.commandInvoker.add(
      new DrawCommand(this.map, x, y, this.selectedLayer, oldDrawID, newDrawID),
      true
    );
  }

  doFillCommand(x, y, newDrawID) {
    let oldDrawID = this.map.getDrawID(x, y, this.selectedLayer);

    if (newDrawID === oldDrawID) {
      return;
    }

    this.commandInvoker.add(
      new FillCommand(this.map, x, y, this.selectedLayer, oldDrawID, newDrawID)
    );
  }

  updateCurrentPos(pointerPos) {
    let worldPos = this.cameras.main.getWorldPoint(pointerPos.x, pointerPos.y);
    let newPos = this.getTilePosFromWorldPos(worldPos);

    if (this.currentPos.x !== newPos.x || this.currentPos.y !== newPos.y) {
      this.currentPosDirty = true;
      this.currentPos = newPos;
    }
  }

  updateLayerVisibility() {
    this.map.setLayerVisibility(this.layerVisibility);
  }

  updateSelectedLayer() {
    this.map.setSelectedLayer(this.selectedLayer);
  }

  updateCurrentTool() {
    this.currentTool = this.tools.get(this.data.values.tool);
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
      tilePos.x < this.map.emf.width &&
      tilePos.y >= 0 &&
      tilePos.y < this.map.emf.height;

    return tilePos;
  }

  getTileXFromWorldPos(worldPos) {
    return Math.floor(worldPos.y / 32 + (worldPos.x + 32) / 64) - 1;
  }

  getTileYFromWorldPos(worldPos) {
    return -Math.floor((worldPos.x + 32) / 64 - worldPos.y / 32);
  }

  resetCameraPosition() {
    let scrollX = -this.cameras.main.centerX + 32;
    let scrollY = -64;

    this.cameras.main.setScroll(scrollX, scrollY);
  }

  get selectedLayer() {
    return this.data.get("selectedLayer");
  }

  get selectedDrawID() {
    return this.data.get("selectedDrawID");
  }

  get layerVisibility() {
    return this.data.get("layerVisibility");
  }
}
