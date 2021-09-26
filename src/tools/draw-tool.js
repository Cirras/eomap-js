import { Tool } from "./tool";

export class DrawTool extends Tool {
  handleLeftPointerDown(mapEditor) {
    if (mapEditor.selectedDrawID === null && mapEditor.selectedLayer !== 0) {
      return;
    }

    mapEditor.doDrawCommand(
      mapEditor.currentPos.x,
      mapEditor.currentPos.y,
      mapEditor.selectedDrawID
    );
  }

  handleRightPointerDown(mapEditor) {
    mapEditor.doDrawCommand(
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
