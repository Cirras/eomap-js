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

  pointerUp(mapEditor, pointer) {
    if (pointer.leftButtonReleased()) {
      this.handleLeftPointerUp(mapEditor, pointer);
    } else if (pointer.rightButtonReleased()) {
      this.handleRightPointerUp(mapEditor, pointer);
    }
  }

  handlePointerMove(_mapEditor, _pointer) {
    return;
  }

  handleLeftPointerDown(_mapEditor, _pointer) {
    return;
  }

  handleRightPointerDown(_mapEditor, _pointer) {
    return;
  }

  handleLeftPointerUp(_mapEditor, _pointer) {
    return;
  }

  handleRightPointerUp(_mapEditor, _pointer) {
    return;
  }

  shouldMoveTileCursor(_mapEditor, _pointer) {
    return true;
  }

  get pointerDownOnMove() {
    return false;
  }
}

export class Pencil extends Tool {
  handleLeftPointerDown(mapEditor) {
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
      0
    );
  }

  get pointerDownOnMove() {
    return true;
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

  get pointerDownOnMove() {
    return true;
  }
}

export class EyeDropper extends Tool {
  handleLeftPointerDown(mapEditor, _pointer) {
    mapEditor.doEyeDropper(mapEditor.currentPos.x, mapEditor.currentPos.y);
  }

  handleRightPointerDown(mapEditor, _pointer) {
    mapEditor.doEyeDropper(mapEditor.currentPos.x, mapEditor.currentPos.y);
  }

  shouldMoveTileCursor(_mapEditor, pointer) {
    return !pointer.isDown;
  }
}

export class Hand extends Tool {
  constructor() {
    super();
    this.startX = 0;
    this.startY = 0;
  }

  handlePointerMove(mapEditor, pointer) {
    if (this.dragging) {
      let camera = mapEditor.cameras.main;
      camera.scrollX = this.startX + (pointer.downX - pointer.x);
      camera.scrollY = this.startY + (pointer.downY - pointer.y);
    }
  }

  handleLeftPointerDown(mapEditor, _pointer) {
    if (!this.dragging) {
      let camera = mapEditor.cameras.main;
      this.startX = camera.scrollX;
      this.startY = camera.scrollY;
      this.dragging = true;

      let asset = mapEditor.getTileCursorAsset();
      mapEditor.cursorSprite.setFrame(asset.data.frames[1].name);
    }
  }

  handleLeftPointerUp(mapEditor, _pointer) {
    if (this.dragging) {
      this.dragging = false;
      let asset = mapEditor.getTileCursorAsset();
      mapEditor.cursorSprite.setFrame(asset.data.frames[0].name);
    }
  }

  shouldMoveTileCursor(_mapEditor, _pointer) {
    return !this.dragging;
  }
}

export class Fill extends Tool {
  handleLeftPointerDown(mapEditor) {
    mapEditor.doFillCommand(
      mapEditor.currentPos.x,
      mapEditor.currentPos.y,
      mapEditor.selectedGraphic
    );
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
