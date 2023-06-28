import { Tool } from "./tool";

export class DrawTool extends Tool {
  handleLeftPointerDown(mapEditor) {
    mapEditor.doDrawCommand(mapEditor.selectedDrawID);
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
