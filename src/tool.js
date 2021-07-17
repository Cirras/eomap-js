class Tool {
  pointerMove(mapEditor, pointer) {
    for (let pos of pointer.getInterpolatedPosition()) {
      mapEditor.updateCurrentPos(pos);

      if (this.pointerDownOnMove && pointer.isDown) {
        this.pointerDown(mapEditor, pointer, false);
        continue;
      }

      if (this.shouldMoveTileCursor(mapEditor, pointer)) {
        mapEditor.moveTileCursor(mapEditor.currentPos);
      }

      this.handlePointerMove(mapEditor, pointer);
    }
  }

  pointerDown(mapEditor, pointer, updateCurrentPos) {
    if (updateCurrentPos === undefined) {
      updateCurrentPos = true;
    }

    if (updateCurrentPos) {
      mapEditor.updateCurrentPos(pointer);
    }

    if (this.shouldMoveTileCursor(mapEditor, pointer)) {
      mapEditor.moveTileCursor(mapEditor.currentPos);
    }

    if (mapEditor.currentPos.valid) {
      if (pointer.leftButtonDown()) {
        this.handleLeftPointerDown(mapEditor, pointer);
      } else if (pointer.rightButtonDown()) {
        this.handleRightPointerDown(mapEditor, pointer);
      }
    }
  }

  handlePointerMove(_mapEditor, _pointer) {
    return;
  }

  handleLeftPointerDown(_mapEditor, _pointer) {
    throw new Error("Method not implemented.");
  }

  handleRightPointerDown(_mapEditor, _pointer) {
    throw new Error("Method not implemented.");
  }

  shouldMoveTileCursor(_mapEditor, _pointer) {
    return true;
  }

  get pointerDownOnMove() {
    return true;
  }
}

export class Pencil extends Tool {
  handleLeftPointerDown(mapEditor) {
    let newGfx = parseInt(
      mapEditor.controller.palette.currentLayer.selectedEntryKey
    );

    if (newGfx > 0) {
      newGfx -= 100;
    }

    mapEditor.doSetGraphicCommand(
      mapEditor.currentPos.x,
      mapEditor.currentPos.y,
      newGfx
    );
  }

  handleRightPointerDown(mapEditor) {
    mapEditor.doSetGraphicCommand(
      mapEditor.currentPos.x,
      mapEditor.currentPos.y,
      0
    );
  }
}

export class Eraser extends Tool {
  handleLeftPointerDown(mapEditor) {
    mapEditor.doSetGraphicCommand(
      mapEditor.currentPos.x,
      mapEditor.currentPos.y,
      0
    );
  }

  handleRightPointerDown(mapEditor) {
    mapEditor.doSetGraphicCommand(
      mapEditor.currentPos.x,
      mapEditor.currentPos.y,
      0
    );
  }
}

export class EyeDropper extends Tool {
  handleLeftPointerDown(mapEditor, _pointer) {
    mapEditor.doEyeDropper(mapEditor.currentPos.x, mapEditor.currentPos.y);
  }

  handleRightPointerDown(mapEditor, _pointer) {
    mapEditor.doEyeDropper(mapEditor.currentPos.x, mapEditor.currentPos.y);
  }

  shouldMoveTileCursor(mapEditor, pointer) {
    return !pointer.isDown;
  }

  get pointerDownOnMove() {
    return false;
  }
}

export class Hand extends Tool {
  handlePointerMove(mapEditor, pointer) {
    // TODO: Implement
  }

  handleLeftPointerDown(mapEditor, pointer) {
    // TODO: Implement
  }

  handleRightPointerDown(mapEditor, pointer) {
    // TODO: Implement
  }

  shouldMoveTileCursor(mapEditor, pointer) {
    return !pointer.isDown;
  }

  get pointerDownOnMove() {
    return false;
  }
}

export class Fill extends Tool {
  handlePointerMove(mapEditor, pointer) {
    // TODO: Implement
  }

  handleLeftPointerDown(mapEditor, pointer) {
    // TODO: Implement
  }

  handleRightPointerDown(mapEditor, pointer) {
    // TODO: Implement
  }
}

export class Entity extends Tool {
  handlePointerMove(mapEditor, pointer) {
    // TODO: Implement
  }

  handleLeftPointerDown(mapEditor, pointer) {
    // TODO: Implement
  }

  handleRightPointerDown(mapEditor, pointer) {
    // TODO: Implement
  }
}
