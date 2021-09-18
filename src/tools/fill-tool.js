import { Tool } from "./tool";

export class FillTool extends Tool {
  handleLeftPointerDown(mapEditor) {
    if (!mapEditor.selectedGraphic && mapEditor.selectedLayer !== 0) {
      return;
    }

    mapEditor.doFillCommand(
      mapEditor.currentPos.x,
      mapEditor.currentPos.y,
      mapEditor.selectedGraphic
    );
  }
}
