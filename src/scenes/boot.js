import icon from "../assets/icon.png";

export class Boot extends Phaser.Scene {
  preload() {
    this.load.image("icon", icon);
  }

  create() {
    this.scene.start("preloader");
  }
}
