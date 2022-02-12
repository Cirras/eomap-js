import { Tool } from "./tool";

export class MoveTool extends Tool {
  constructor() {
    super();
    this.startX = 0;
    this.startY = 0;
    this.dragging = false;
  }

  startDragging(mapEditor) {
    if (!this.dragging) {
      let camera = mapEditor.cameras.main;
      this.startX = camera.scrollX;
      this.startY = camera.scrollY;
      this.dragging = true;

      let asset = mapEditor.textureCache.getCursor().asset;
      mapEditor.cursorSprite.setFrame(asset.getFrame(1).name);
    }
  }

  stopDragging(mapEditor) {
    if (this.dragging) {
      this.dragging = false;
      let asset = mapEditor.textureCache.getCursor().asset;
      mapEditor.cursorSprite.setFrame(asset.getFrame(0).name);
    }
  }

  handlePointerMove(mapEditor, _pointer) {
    if (this.dragging) {
      let camera = mapEditor.cameras.main;
      camera.scrollX = this.startX + this.pointerDownDistance.x;
      camera.scrollY = this.startY + this.pointerDownDistance.y;
    }
  }

  handleLeftPointerDown(mapEditor, _pointer) {
    this.startDragging(mapEditor);
  }

  handleLeftPointerUp(mapEditor, _pointer) {
    this.stopDragging(mapEditor);
  }

  handleMiddlePointerDown(mapEditor, _pointer) {
    this.startDragging(mapEditor);
  }

  handleMiddlePointerUp(mapEditor, _pointer) {
    this.stopDragging(mapEditor);
  }

  shouldMoveCursor() {
    return !this.dragging;
  }
}
