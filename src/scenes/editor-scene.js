import { EMF } from "../map";
import { CommandInvoker } from "../command/command";
import { SetGraphicCommand, FillCommand } from "../command/map-command";
import { TilePos } from "../tilepos";
import { EvictingTextureCache } from "../gfx/texture-cache";
import { ToolBar } from "../toolbar";
import { Eyedrop } from "../eyedrop";

import "../gameobjects/eomap";

export class EditorScene extends Phaser.Scene {
  constructor() {
    super("editor");
    this.commandInvoker = new CommandInvoker();
    this.firstUpdate = true;
    this.ctrlKeyDown = false;

    this.textureCache = null;
    this.map = null;
    this.toolBar = null;
    this.cursorSprite = null;
    this.cursors = null;
    this.yKey = null;
    this.zKey = null;
    this.cameraControls = null;
  }

  preload() {
    // TODO: Drag the map up to the editor component
    this.load.path = "https://game.bones-underground.org/";
    this.load.json("map", "map/660");
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
      EMF.from_json(this.cache.json.get("map")),
      this.cameras.main.width,
      this.cameras.main.height
    );

    this.toolBar = new ToolBar(this);

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
      this.cull();
    });

    this.scale.on("resize", this.resize, this);
    this.resize();

    this.resetCameraPosition();
  }

  getTileCursorAsset() {
    return this.textureCache.get(2, 124);
  }

  createTileCursor() {
    let asset = this.getTileCursorAsset();
    asset.incRef();

    let cursorSprite = this.add.sprite(0, 0);
    cursorSprite.visible = false;
    cursorSprite.setDepth(1.0);
    cursorSprite.setOrigin(0);
    cursorSprite.setTexture(asset.data.textureKey, asset.data.frames[0].name);

    return cursorSprite;
  }

  update(time, delta) {
    this.cameraControls.update(delta);
    this.textureCache.update();
    this.map.update(time, delta);

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
    this.toolBar.currentTool.pointerMove(this, pointer);
  }

  handlePointerDown(pointer) {
    this.ctrlKeyDown = pointer.event.ctrlKey;
    this.toolBar.currentTool.pointerDown(this, pointer);
  }

  handlePointerUp(pointer) {
    this.toolBar.currentTool.pointerUp(this, pointer);
    this.commandInvoker.finalizeAggregate();
  }

  doSetGraphicCommand(x, y, newGfx) {
    let oldGfx = this.map.emf.getTile(x, y).gfx[this.selectedLayer];

    if (newGfx === oldGfx) {
      return;
    }

    this.commandInvoker.add(
      new SetGraphicCommand(this.map, x, y, this.selectedLayer, oldGfx, newGfx),
      true
    );
  }

  doFillCommand(x, y, newGfx) {
    let oldGfx = this.map.emf.getTile(x, y).gfx[this.selectedLayer];

    if (newGfx === oldGfx) {
      return;
    }

    this.commandInvoker.add(
      new FillCommand(this.map, x, y, this.selectedLayer, oldGfx, newGfx)
    );
  }

  doEyeDropper(x, y) {
    let asset = this.getTileCursorAsset();
    this.cursorSprite.play(asset.data.animation);
    let graphic = this.map.emf.getTile(x, y).gfx[this.selectedLayer];
    this.data.set("eyedrop", new Eyedrop(graphic));
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

  get currentPos() {
    return this.data.get("currentPos");
  }

  set currentPos(value) {
    this.data.set("currentPos", value);
  }

  get selectedLayer() {
    return this.data.get("selectedLayer");
  }

  get selectedGraphic() {
    return this.data.get("selectedGraphic");
  }
}
