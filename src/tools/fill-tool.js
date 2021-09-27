import { Tool } from "./tool";

export class FillTool extends Tool {
  handleLeftPointerDown(mapEditor) {
    mapEditor.doFillCommand(
      mapEditor.currentPos.x,
      mapEditor.currentPos.y,
      mapEditor.selectedDrawID
    );
  }
}
