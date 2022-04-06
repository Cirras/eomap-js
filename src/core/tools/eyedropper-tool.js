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

    mapEditor.playCursorAnimation();

    mapEditor.data.set("eyedrop", new Eyedrop(drawID));
  }

  shouldMoveCursor() {
    return !this.isLeftPointerDown();
  }
}
