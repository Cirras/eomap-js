import { Tool } from "./tool";
import { Eyedrop } from "./eyedrop";

export class EyeDropperTool extends Tool {
  handleLeftPointerDown(mapEditor, _pointer) {
    let x = mapEditor.currentPos.x;
    let y = mapEditor.currentPos.y;
    let layer = mapEditor.selectedLayer;

    let graphic = mapEditor.map.emf.getTile(x, y).gfx[layer];
    if (graphic === null && layer !== 0) {
      return;
    }

    let asset = mapEditor.getTileCursorAsset();
    mapEditor.cursorSprite.play(asset.data.animation);

    mapEditor.data.set("eyedrop", new Eyedrop(graphic));
  }

  shouldMoveTileCursor(_mapEditor) {
    return !this.isLeftPointerDown();
  }
}
