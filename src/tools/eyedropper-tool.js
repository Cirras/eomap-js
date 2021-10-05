import { Tool } from "./tool";
import { Eyedrop } from "./eyedrop";

export class EyedropperTool extends Tool {
  handleLeftPointerDown(mapEditor, _pointer) {
    let x = mapEditor.currentPos.x;
    let y = mapEditor.currentPos.y;
    let layer = mapEditor.selectedLayer;

    let drawID = mapEditor.map.getDrawID(x, y, layer);
    if (drawID === null && layer !== 0) {
      return;
    }

    let asset = mapEditor.textureCache.getCursor().asset;
    mapEditor.cursorSprite.play(asset.animation);

    mapEditor.data.set("eyedrop", new Eyedrop(drawID));
  }

  shouldMoveCursor(_mapEditor) {
    return !this.isLeftPointerDown();
  }
}
