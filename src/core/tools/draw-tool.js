import { Tool } from "./tool";

export class DrawTool extends Tool {
  handleLeftPointerDown(mapEditor) {
    mapEditor.doDrawCommand(
      mapEditor.currentPos.x,
      mapEditor.currentPos.y,
      mapEditor.selectedDrawID
    );
  }

  handleRightPointerDown(mapEditor) {
    mapEditor.doEraseCommand(mapEditor.currentPos.x, mapEditor.currentPos.y);
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
