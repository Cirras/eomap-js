import { Tool } from "./tool";

export class EraseTool extends Tool {
  handleLeftPointerDown(mapEditor) {
    mapEditor.doEraseCommand(mapEditor.currentPos.x, mapEditor.currentPos.y);
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
