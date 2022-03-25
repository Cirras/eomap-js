import { DrawCommand } from "../command/draw-command";
import { FillCommand } from "../command/fill-command";
import { TilePos } from "../tilepos";
import { EvictingTextureCache } from "../gfx/texture-cache";

import { DrawTool } from "../tools/draw-tool";
import { EraseTool } from "../tools/erase-tool";
import { EyedropperTool } from "../tools/eyedropper-tool";
import { MoveTool } from "../tools/move-tool";
import { ZoomTool } from "../tools/zoom-tool";
import { FillTool } from "../tools/fill-tool";
import { EntityTool } from "../tools/entity-tool";

import "../gameobjects/eomap";
import { EntityState } from "../entity-state";
import { EntityCommand } from "../command/entity-command";
import { MapPropertiesState } from "../map-properties-state";
import { PropertiesCommand } from "../command/properties-command";

export class EditorScene extends Phaser.Scene {
  constructor() {
    super("editor");
    this.ctrlKeyDown = false;
    this.currentPosDirty = false;
    this.cursorDirty = false;

    this.currentPos = null;
    this.textureCache = null;
    this.map = null;
    this.tools = null;
    this.overrideTool = null;
    this.cursorSprite = null;
    this.cursors = null;
    this.yKey = null;
    this.zKey = null;
    this.cameraControls = null;

    this._tempMatrix1 = new Phaser.GameObjects.Components.TransformMatrix();
    this._tempMatrix2 = new Phaser.GameObjects.Components.TransformMatrix();
  }

  create() {
    this.currentPos = new TilePos();
    this.cursorPos = new TilePos();

    this.textureCache = new EvictingTextureCache(
      this,
      this.data.values.gfxLoader,
      1024,
      1024
    );

    this.map = this.add.eomap(
      this,
      this.textureCache,
      this.emf,
      this.layerVisibility
    );

    this.mapState.gameObject = this.map;

    this.tools = this.createTools();

    this.cursorSprite = this.createCursor();

    let cursorKeys = this.input.keyboard.createCursorKeys();
    this.cameraControls = new Phaser.Cameras.Controls.FixedKeyControl({
      camera: this.map.camera,
      left: cursorKeys.left,
      right: cursorKeys.right,
      up: cursorKeys.up,
      down: cursorKeys.down,
      speed: 1,
    });

    this.input.on("pointermove", (pointer) => this.handlePointerMove(pointer));
    this.input.on("pointerdown", (pointer) => this.handlePointerDown(pointer));
    this.input.on("pointerup", (pointer) => this.handlePointerUp(pointer));
    this.input.on("pointerupoutside", (pointer) =>
      this.handlePointerUp(pointer)
    );

    this.data.set("eyedrop", null);

    this.data.events.on("changedata-layerVisibility", () => {
      this.updateLayerVisibility();
    });

    this.data.events.on("changedata-selectedLayer", () => {
      this.updateSelectedLayer();
    });

    this.data.events.on("changedata-entityState", () => {
      this.updateEntityState();
    });

    this.data.events.on("changedata-mapPropertiesState", () => {
      this.updateMapPropertiesState();
    });

    this.data.events.on("changedata-updateZoom", () => {
      this.map.zoom = Math.min(
        ZoomTool.MAX_ZOOM,
        Math.max(ZoomTool.MIN_ZOOM, this.data.values.updateZoom)
      );
    });

    this.scale.on("resize", this.resize, this);

    this.updateLayerVisibility();
    this.updateSelectedLayer();
    this.resize();

    this.initCameraPosition();
  }

  createTools() {
    return new Map([
      ["draw", new DrawTool()],
      ["erase", new EraseTool()],
      ["eyedropper", new EyedropperTool()],
      ["move", new MoveTool()],
      ["zoom", new ZoomTool()],
      ["fill", new FillTool()],
      ["entity", new EntityTool()],
    ]);
  }

  createCursor() {
    let cursorSprite = this.add.sprite(0, 0);
    cursorSprite.visible = false;
    cursorSprite.setDepth(1.0);
    cursorSprite.setOrigin(0);

    let cacheEntry = this.textureCache.getCursor();
    cacheEntry.incRef();

    let onCursorLoad = () => {
      cursorSprite.setTexture(
        cacheEntry.asset.textureKey,
        cacheEntry.asset.getFrame(0).name
      );
      cursorSprite.on("animationupdate", () => {
        this.cursorDirty = true;
      });
      this.cursorDirty = true;
    };

    if (cacheEntry.loadingComplete) {
      cacheEntry.loadingComplete.then(onCursorLoad);
    } else {
      onCursorLoad();
    }

    return cursorSprite;
  }

  setCursorFrame(frameIndex) {
    let asset = this.textureCache.getCursor().asset;
    this.cursorSprite.setFrame(asset.getFrame(frameIndex).name);
    this.cursorDirty = true;
  }

  playCursorAnimation() {
    let asset = this.textureCache.getCursor().asset;
    mapEditor.cursorSprite.play(asset.animation);
  }

  update(time, delta) {
    this.render.shouldRender = false;

    this.cameraControls.update(delta);
    this.textureCache.update();

    if (this.map.camera.dirty) {
      this.mapState.scrollX = this.map.scrollX;
      this.mapState.scrollY = this.map.scrollY;
      if (this.mapState.zoom !== this.map.zoom) {
        this.mapState.zoom = this.map.zoom;
        this.events.emit("zoom-changed");
      }
      this.moveCursor(this.cursorPos);
    }

    this.map.update(time, delta);

    if (this.currentPosDirty) {
      this.data.set("currentPos", this.currentPos);
    }

    this.render.shouldRender =
      this.map.shouldRender || this.currentPosDirty || this.cursorDirty;
    this.currentPosDirty = false;
    this.cursorDirty = false;
  }

  resize() {
    this.map.setSize(this.cameras.main.width + 1, this.cameras.main.height + 1);
  }

  moveCursor(tilePos) {
    this.cursorPos = tilePos;

    if (!tilePos.valid) {
      this.cursorSprite.setVisible(false);
      return false;
    }

    let x = tilePos.x * 32 - tilePos.y * 32;
    let y = tilePos.x * 16 + tilePos.y * 16;

    let camera = this.map.camera;

    let cameraDirty = camera.dirty;
    camera.preRender();
    camera.dirty = cameraDirty;

    let camMatrix = this._tempMatrix1;
    camMatrix.copyFrom(camera.matrix);

    let spriteMatrix = this._tempMatrix2;
    spriteMatrix.applyITRS(x, y, 0, 1, 1);
    spriteMatrix.e -= camera.scrollX;
    spriteMatrix.f -= camera.scrollY;

    camMatrix.multiply(spriteMatrix);

    this.cursorSprite
      .setVisible(true)
      .setScale(this.map.zoom)
      .setPosition(camMatrix.e, camMatrix.f);

    return true;
  }

  handlePointerMove(pointer) {
    this.updateOverrideTool(pointer);
    this.tool.pointerMove(this, pointer);
  }

  handlePointerDown(pointer) {
    this.updateOverrideTool(pointer);
    this.tool.pointerDown(this, pointer);
  }

  handlePointerUp(pointer) {
    this.tool.pointerUp(this, pointer);
    this.updateOverrideTool(pointer);
  }

  canDraw(drawID) {
    if (drawID === 0 && this.selectedLayer !== 0 && this.selectedLayer !== 9) {
      return false;
    }
    return drawID !== null;
  }

  doDrawCommand(x, y, drawID) {
    if (!this.canDraw(drawID)) {
      return;
    }

    let oldDrawID = this.map.getDrawID(x, y, this.selectedLayer);

    if (drawID === oldDrawID) {
      return;
    }

    this.commandInvoker.add(
      new DrawCommand(
        this.mapState,
        x,
        y,
        this.selectedLayer,
        oldDrawID,
        drawID
      ),
      true
    );
  }

  doFillCommand(x, y, drawID) {
    if (!this.canDraw(drawID)) {
      return;
    }

    let oldDrawID = this.map.getDrawID(x, y, this.selectedLayer);

    if (drawID === oldDrawID) {
      return;
    }

    this.commandInvoker.add(
      new FillCommand(
        this.mapState,
        x,
        y,
        this.selectedLayer,
        oldDrawID,
        drawID
      )
    );
  }

  doEraseCommand(x, y) {
    let drawID = this.selectedLayer === 0 ? 0 : null;
    let oldDrawID = this.map.getDrawID(x, y, this.selectedLayer);

    if (drawID === oldDrawID) {
      return;
    }

    this.commandInvoker.add(
      new DrawCommand(
        this.mapState,
        x,
        y,
        this.selectedLayer,
        oldDrawID,
        drawID
      ),
      true
    );
  }

  canUpdateOverrideTool(pointer) {
    return (
      this.overrideTool === null ||
      (!pointer.leftButtonDown() && !pointer.rightButtonDown())
    );
  }

  updateOverrideTool(pointer) {
    if (!this.canUpdateOverrideTool(pointer)) {
      return;
    }

    if (pointer.middleButtonDown()) {
      this.overrideTool = "move";
    } else if (pointer.event.ctrlKey) {
      this.overrideTool = "eyedropper";
    } else {
      this.overrideTool = null;
    }
  }

  updateCurrentPos(pointerPos) {
    let worldPos = this.map.camera.getWorldPoint(pointerPos.x, pointerPos.y);
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

  updateEntityState() {
    let newEntityState = this.data.get("entityState");
    let x = newEntityState.x;
    let y = newEntityState.y;

    let oldEntityState = new EntityState(
      x,
      y,
      this.map.getWarp(x, y),
      this.map.getSign(x, y),
      this.map.getNPCs(x, y),
      this.map.getItems(x, y)
    );

    this.commandInvoker.add(
      new EntityCommand(this.mapState, x, y, oldEntityState, newEntityState)
    );
  }

  updateMapPropertiesState() {
    let newMapPropertiesState = this.data.get("mapPropertiesState");

    let oldMapPropertiesState = new MapPropertiesState(
      this.emf.name,
      this.emf.width,
      this.emf.height,
      this.emf.type,
      this.emf.effect,
      this.emf.mapAvailable,
      this.emf.canScroll,
      this.emf.musicID,
      this.emf.ambientSoundID,
      this.emf.musicControl,
      this.emf.relogX,
      this.emf.relogY
    );

    this.commandInvoker.add(
      new PropertiesCommand(
        this.mapState,
        oldMapPropertiesState,
        newMapPropertiesState
      )
    );
  }

  getTilePosFromPointerPos(pointerPos) {
    let worldPos = this.map.camera.getWorldPoint(pointerPos.x, pointerPos.y);

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

  initCameraPosition() {
    this.map.scrollX = this.mapState.scrollX || -this.map.camera.centerX + 32;
    this.map.scrollY = this.mapState.scrollY || -64;
    this.map.zoom = this.mapState.zoom || 1.0;
  }

  get tool() {
    return this.tools.get(this.overrideTool || this.selectedTool);
  }

  get emf() {
    return this.mapState.emf;
  }

  get commandInvoker() {
    return this.mapState.commandInvoker;
  }

  get mapState() {
    return this.data.get("mapState");
  }

  get selectedTool() {
    return this.data.get("selectedTool");
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
