import { Palette, PaletteColor, PaletteSize } from "../palette";
import { ToolBar } from "../toolbar";
import { MapEditor } from "./map-editor";

export class Controller extends Phaser.Scene {
  constructor() {
    super("controller");
    this.devicePixelRatio = window.devicePixelRatio;
    this.scaleRatio = 1;
  }

  create() {
    this.setupCanvas();

    this.palette = new Palette(this);
    this.toolBar = new ToolBar(this);
    this.mapEditor = new MapEditor(this);

    this.masterAnimation = this.add
      .sprite(0, -100)
      .setVisible(false)
      .play("masterMapAnimation").anims;

    this.ctrlKeyDown = false;
    this.input.on("pointermove", (pointer) => this.handlePointerMove(pointer));
    this.input.on("pointerdown", (pointer) => this.handlePointerDown(pointer));

    this.palette.addFile("tile");
    this.palette.addFile("object");
    this.palette.addFile("overlay");
    this.palette.addFile("wall");
    this.palette.addFile("roof");
    this.palette.addFile("shadow");

    this.palette.addLayer("Ground", "tile");
    this.palette.addLayer("Objects", "object");
    this.palette.addLayer("Overlay", "overlay");
    this.palette.addLayer("Down Wall", "wall");
    this.palette.addLayer("Right Wall", "wall");
    this.palette.addLayer("Roof", "roof");
    this.palette.addLayer("Top", "tile");
    this.palette.addLayer(
      "Shadow",
      "shadow",
      PaletteColor.AssetBackgroundLight
    );
    this.palette.addLayer("Overlay 2", "overlay");

    this.scene.add("map-editor", this.mapEditor, true);
    this.input.setTopOnly(false); // Necessary for palette scroller

    this.scale.on("resize", this.resize, this);
    this.resize();
    this.handlePixelRatioChange();

    this.mapEditor.resetCameraPosition();
    this.palette.selectLayer(0);
  }

  setupCanvas() {
    Phaser.Display.Canvas.CanvasPool.disableSmoothing();
    Phaser.Display.Canvas.CanvasInterpolation.setCrisp(this.game.canvas);
  }

  update() {
    if (window.devicePixelRatio !== this.devicePixelRatio) {
      this.devicePixelRatio = window.devicePixelRatio;
      this.handlePixelRatioChange();
    }
  }

  handlePointerMove(pointer) {
    this.ctrlKeyDown = pointer.event.ctrlKey;
  }

  handlePointerDown(pointer) {
    this.ctrlKeyDown = pointer.event.ctrlKey;
  }

  handlePixelRatioChange() {
    let newScaleRatio = this.calculateScaleRatio();

    if (newScaleRatio !== this.scaleRatio) {
      this.scaleRatio = newScaleRatio;
      this.handleScaleChange();
    }
  }

  handleScaleChange() {
    // this.mapEditor.cameras.main.setZoom(this.scaleRatio);
    // this.palette.scaleRatio = this.scaleRatio;
  }

  calculateScaleRatio() {
    // Phaser's camera zooming absolutely does not play nicely with pixel art
    // We trunctuate the device pixel ratio to avoid hideous little lines between every tile and wall
    return Math.max(1, Math.trunc(this.devicePixelRatio));
  }

  resize(gameSize, _baseSize, _displaySize, _resolution) {
    let width, height;

    if (gameSize === undefined) {
      width = this.sys.scale.width;
      height = this.sys.scale.height;
    } else {
      width = gameSize.width;
      height = gameSize.height;
    }

    this.cameras.main.setSize(width, height);

    let paletteWidth = width;
    let paletteHeight = height;
    let mapEditorWidth = width;
    let mapEditorHeight = height;

    if (this.scale.isGameLandscape) {
      paletteWidth = Math.min(
        width * PaletteSize.LandscapeWidthRatio,
        this.palette.maxLandscapeWidth
      );
      mapEditorWidth -= paletteWidth;
    } else {
      paletteHeight = height * PaletteSize.PortraitHeightRatio;
      mapEditorHeight -= paletteHeight;
    }

    let mapEditorCenterXDiff =
      this.mapEditor.cameras.main.scrollX + this.mapEditor.cameras.main.centerX;
    let mapEditorCenterYDiff =
      this.mapEditor.cameras.main.scrollY + this.mapEditor.cameras.main.centerY;

    this.palette.width = paletteWidth;
    this.palette.height = paletteHeight;
    this.palette.x = width - paletteWidth;
    this.palette.y = height - paletteHeight;

    if (this.palette.currentLayer) {
      this.palette.currentLayer.layout();
    }

    this.mapEditor.cameras.resize(mapEditorWidth, mapEditorHeight);
    this.mapEditor.cameras.main.scrollX =
      -this.mapEditor.cameras.main.centerX + mapEditorCenterXDiff;
    this.mapEditor.cameras.main.scrollY =
      -this.mapEditor.cameras.main.centerY + mapEditorCenterYDiff;
    this.mapEditor.cull();
  }

  syncToMasterAnimation(sprite) {
    if (sprite.anims.isPlaying) {
      sprite.anims.setProgress(this.masterAnimation.getProgress());
      sprite.anims.accumulator = this.masterAnimation.accumulator;
    }
  }
}
