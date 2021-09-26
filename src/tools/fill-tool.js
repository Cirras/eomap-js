import { Tool } from "./tool";

export class FillTool extends Tool {
  handleLeftPointerDown(mapEditor) {
    if (mapEditor.selectedDrawID === null && mapEditor.selectedLayer !== 0) {
      return;
    }

    mapEditor.doFillCommand(
      mapEditor.currentPos.x,
      mapEditor.currentPos.y,
      mapEditor.selectedDrawID
    );
  }
}
