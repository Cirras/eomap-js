import { Tool } from "./tool";

export class EraseTool extends Tool {
  handleLeftPointerDown(mapEditor) {
    mapEditor.doEraseCommand();
  }

  handleRightPointerDown(mapEditor) {
    mapEditor.doEraseCommand();
  }

  handleLeftPointerUp(mapEditor) {
    mapEditor.finalizeDraw();
  }

  handleRightPointerUp(mapEditor) {
    mapEditor.finalizeDraw();
  }

  shouldPointerDownOnMove() {
    return true;
  }
}
