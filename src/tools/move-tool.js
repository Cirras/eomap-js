import { Tool } from "./tool";

export class MoveTool extends Tool {
  constructor() {
    super();
    this.startX = 0;
    this.startY = 0;
  }

  handlePointerMove(mapEditor, pointer) {
    if (this.dragging) {
      let camera = mapEditor.cameras.main;
      camera.scrollX = this.startX + this.pointerDownDistance.x;
      camera.scrollY = this.startY + this.pointerDownDistance.y;
    }
  }

  handleLeftPointerDown(mapEditor, _pointer) {
    if (!this.dragging) {
      let camera = mapEditor.cameras.main;
      this.startX = camera.scrollX;
      this.startY = camera.scrollY;
      this.dragging = true;

      let asset = mapEditor.textureCache.getCursor().asset;
      mapEditor.cursorSprite.setFrame(asset.frames[1].name);
    }
  }

  handleLeftPointerUp(mapEditor, _pointer) {
    if (this.dragging) {
      this.dragging = false;
      let asset = mapEditor.textureCache.getCursor().asset;
      mapEditor.cursorSprite.setFrame(asset.frames[0].name);
    }
  }

  shouldMoveCursor(_mapEditor, _pointer) {
    return !this.dragging;
  }
}
