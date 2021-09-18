import { Tool } from "./tool";

export class DrawTool extends Tool {
  handleLeftPointerDown(mapEditor) {
    if (!mapEditor.selectedGraphic && mapEditor.selectedLayer !== 0) {
      return;
    }

    mapEditor.doSetGraphicCommand(
      mapEditor.currentPos.x,
      mapEditor.currentPos.y,
      mapEditor.selectedGraphic
    );
  }

  handleRightPointerDown(mapEditor) {
    mapEditor.doSetGraphicCommand(
      mapEditor.currentPos.x,
      mapEditor.currentPos.y,
      null
    );
  }

  handleLeftPointerUp(mapEditor) {
    mapEditor.commandInvoker.finalizeAggregate();
  }

  handleRightPointerUp(mapEditor) {
    mapEditor.commandInvoker.finalizeAggregate();
  }

  shouldPointerDownOnMove() {
    return true;
  }
}
