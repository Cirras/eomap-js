import * as Tool from "./tool";

export class ToolBar {
  constructor(controller) {
    this.controller = controller;
    this._currentTool = null;
    this.tools = new Map([
      ["draw", new Tool.Pencil()],
      ["erase", new Tool.Eraser()],
      ["eyedropper", new Tool.EyeDropper()],
      ["move", new Tool.Hand()],
      ["fill", new Tool.Fill()],
      ["entity", new Tool.Entity()],
    ]);

    controller.data.events.on("changedata-tool", () => {
      this.updateCurrentTool();
    });
  }

  updateCurrentTool() {
    this._currentTool = this.tools.get(this.controller.data.get("tool"));
  }

  get currentTool() {
    if (!this._currentTool) {
      this.updateCurrentTool();
    }
    return this._currentTool;
  }
}
