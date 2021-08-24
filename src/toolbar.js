import * as Tool from "./tool";

export class ToolBar {
  constructor(scene) {
    this.scene = scene;
    this._currentTool = null;
    this.tools = new Map([
      ["draw", new Tool.Pencil()],
      ["erase", new Tool.Eraser()],
      ["eyedropper", new Tool.EyeDropper()],
      ["move", new Tool.Hand()],
      ["fill", new Tool.Fill()],
      ["entity", new Tool.Entity()],
    ]);

    scene.data.events.on("changedata-tool", () => {
      this.updateCurrentTool();
    });
  }

  updateCurrentTool() {
    this._currentTool = this.tools.get(this.scene.data.get("tool"));
  }

  get currentTool() {
    if (!this._currentTool) {
      this.updateCurrentTool();
    }
    return this._currentTool;
  }
}
