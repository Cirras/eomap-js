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
      let camera = mapEditor.map.camera;
      this.startX = camera.scrollX;
      this.startY = camera.scrollY;
      this.dragging = true;
      mapEditor.cursor.stopAnimation();
      mapEditor.cursor.setFrame(1);
    }
  }

  stopDragging(mapEditor) {
    if (this.dragging) {
      this.dragging = false;
      mapEditor.cursor.stopAnimation();
      mapEditor.cursor.setFrame(0);
    }
  }

  handlePointerMove(mapEditor, _pointer) {
    if (this.dragging) {
      let camera = mapEditor.map.camera;
      camera.scrollX = this.startX + this.pointerDownDistance.x / camera.zoom;
      camera.scrollY = this.startY + this.pointerDownDistance.y / camera.zoom;
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
