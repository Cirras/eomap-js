import * as Tool from "./tool";

export class ToolBar {
  constructor(controller) {
    this.controller = controller;
    this.pencil = new Tool.Pencil();
    this.eraser = new Tool.Eraser();
    this.eyeDropper = new Tool.EyeDropper();
    this.hand = new Tool.Hand();
    this.selection = new Tool.Selection();
    this.fill = new Tool.Fill();

    this._selectedTool = this.pencil;
  }

  get currentTool() {
    if (this.controller.ctrlKeyDown) {
      return this.eyeDropper;
    }

    return this._selectedTool;
  }
}
