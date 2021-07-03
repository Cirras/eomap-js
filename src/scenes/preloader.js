const LogoSize = {
  WidthRatio: 0.35,
  MaxWidth: 200,
};

export class Preloader extends Phaser.Scene {
  constructor() {
    super("preloader");
  }

  preload() {
    this.icon = this.add.image(0, 0, "icon");
    this.outline = this.rexUI.add.roundRectangle(0, 0, 0, 0, 0, 0x211f24);
    this.progress = this.rexUI.add.roundRectangle(0, 0, 0, 0, 0, 0xffffff);
    this.progressValue = 0;
    this.progressTween = undefined;

    this.cameras.main.setBackgroundColor("#303338");
    this.progress.setOrigin(0, 0);
    this.outline.setOrigin(0, 0);
    this.outline.setStrokeStyle(2, 0xffffff);

    this.setupEventListeners();
    this.resize();

    this.load.path = "https://game.bones-underground.org/";

    this.load.multiatlas("gui", "gfx/2/all.json");
    this.load.multiatlas("tile", "gfx/3/all.json");
    this.load.multiatlas("object", "gfx/4/all.json");
    this.load.multiatlas("overlay", "gfx/5/all.json");
    this.load.multiatlas("wall", "gfx/6/all.json");
    this.load.multiatlas("roof", "gfx/7/all.json");
    this.load.multiatlas("shadow", "gfx/22/all.json");

    this.load.json("map", "map/660");
  }

  setupEventListeners() {
    this.scale.on("resize", this.resize, this);
    this.load.on("progress", this.updateTween, this);
    this.events.on("shutdown", this.removeEventListeners, this);
  }

  removeEventListeners() {
    this.load.removeListener("progress", this.updateTween, this);
    this.scale.removeListener("resize", this.resize, this);
  }

  updateTween(value) {
    let newWidth = this.outline.width * value;

    if (newWidth > this.progress.width) {
      if (this.progressTween) {
        this.progressTween.complete();
      }

      this.progressTween = this.tweens.add({
        targets: this.progress,
        width: newWidth,
        ease: "Quad.easeIn",
        duration: 500,
      });
    }
  }

  create() {
    if (this.progressTween.complete) {
      this.scene.start("controller");
    } else {
      this.progressTween.setCallback(
        "onComplete",
        () => this.scene.start("controller"),
        [],
        this
      );
    }
  }

  resize(gameSize, baseSize, displaySize, resolution) {
    let width, height;

    if (gameSize === undefined) {
      width = this.scale.width;
      height = this.scale.height;
    } else {
      width = gameSize.width;
      height = gameSize.height;
    }

    this.cameras.resize(width, height);

    let iconCalcWidth =
      (this.scale.isGameLandscape ? height : width) * LogoSize.WidthRatio;
    let iconWidth = Math.min(iconCalcWidth, LogoSize.MaxWidth);
    let iconSizeRatio = iconWidth / this.icon.width;
    let iconHeight = this.icon.height * iconSizeRatio;
    let iconX = this.cameras.main.centerX;
    let iconY = this.cameras.main.centerY - iconHeight / 2;
    let outlineWidth = iconWidth * 1.4;
    let outlineHeight = iconHeight * 0.15;
    let outlineX = this.cameras.main.centerX - outlineWidth / 2;
    let outlineY = iconY + iconHeight / 2 + iconHeight * 0.2;
    let progressPercentage =
      this.progress.width > 0 ? this.progress.width / this.outline.width : 0;
    let progressTarget = outlineWidth * this.load.progress;

    this.icon.setDisplaySize(iconWidth, iconHeight);
    this.icon.setPosition(iconX, iconY);

    this.outline.setSize(outlineWidth, outlineHeight);
    this.outline.setPosition(outlineX, outlineY);

    this.progress.setSize(outlineWidth * progressPercentage, outlineHeight);
    this.progress.setPosition(outlineX, outlineY);

    if (this.progressTween && this.progressTween.isPlaying()) {
      this.progressTween.data[0].current = this.progress.width;
      this.progressTween.updateTo("width", progressTarget, true);
    }
  }
}
