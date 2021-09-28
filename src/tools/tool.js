import { Eyedrop } from "./eyedrop";

const PointerDownState = {
  None: 0,
  Left: 1,
  Middle: 2,
  Right: 3,
};

class PointerDistance {
  downX = 0;
  downY = 0;
  currentX = 0;
  currentY = 0;

  update(pointer) {
    this.downX = pointer.downX;
    this.downY = pointer.downY;
    this.currentX = pointer.x;
    this.currentY = pointer.y;
  }

  get x() {
    return this.downX - this.currentX;
  }

  get y() {
    return this.downY - this.currentY;
  }
}

export class Tool {
  pointerDownState = PointerDownState.None;
  pointerDownDistance = new PointerDistance();

  pointerMove(mapEditor, pointer) {
    this.pointerDownDistance.update(pointer);
    for (let pos of pointer.getInterpolatedPosition()) {
      mapEditor.updateCurrentPos(pos);

      if (this.shouldPointerDownOnMove() && pointer.isDown) {
        this.pointerDown(mapEditor, pointer, false);
        continue;
      }

      if (this.shouldMoveCursor(mapEditor, pointer)) {
        mapEditor.moveCursor(mapEditor.currentPos);
      }

      this.handlePointerMove(mapEditor);
    }
  }

  pointerDown(mapEditor, pointer, updatePosition) {
    if (updatePosition === undefined) {
      updatePosition = true;
    }

    if (updatePosition) {
      this.pointerDownDistance.update(pointer);
      mapEditor.updateCurrentPos(pointer);
    }

    if (this.shouldMoveCursor(mapEditor, pointer)) {
      mapEditor.moveCursor(mapEditor.currentPos);
    }

    if (pointer.leftButtonDown()) {
      this.updatePointerDownState(PointerDownState.Left, true);
    }

    if (pointer.middleButtonDown()) {
      this.updatePointerDownState(PointerDownState.Middle, true);
    }

    if (pointer.rightButtonDown()) {
      this.updatePointerDownState(PointerDownState.Right, true);
    }

    if (mapEditor.currentPos.valid) {
      switch (this.pointerDownState) {
        case PointerDownState.Left:
          this.handleLeftPointerDown(mapEditor, pointer);
          break;

        case PointerDownState.Middle:
          this.handleMiddlePointerDown(mapEditor, pointer);
          break;

        case PointerDownState.Right:
          this.handleRightPointerDown(mapEditor, pointer);
          break;
      }
    }
  }

  pointerUp(mapEditor, pointer) {
    const handleButtonUp = (state, down, handler) => {
      if (!down && this.updatePointerDownState(state, false)) {
        handler(mapEditor, pointer);
      }
    };

    handleButtonUp(
      PointerDownState.Left,
      pointer.leftButtonDown(),
      this.handleLeftPointerUp.bind(this)
    );

    handleButtonUp(
      PointerDownState.Middle,
      pointer.middleButtonDown(),
      this.handleMiddlePointerUp.bind(this)
    );

    handleButtonUp(
      PointerDownState.Right,
      pointer.rightButtonDown(),
      this.handleRightPointerUp.bind(this)
    );
  }

  updatePointerDownState(state, down) {
    if (down && this.pointerDownState === PointerDownState.None) {
      this.pointerDownState = state;
      return true;
    }

    if (!down && this.pointerDownState === state) {
      this.pointerDownState = PointerDownState.None;
      return true;
    }

    return false;
  }

  isLeftPointerDown() {
    return this.pointerDownState === PointerDownState.Left;
  }

  isMiddlePointerDown() {
    return this.pointerDownState === PointerDownState.Middle;
  }

  isRightPointerDown() {
    return this.pointerDownState === PointerDownState.Right;
  }

  handlePointerMove(_mapEditor) {
    return;
  }

  handleLeftPointerDown(_mapEditor) {
    return;
  }

  handleMiddlePointerDown(_mapEditor) {
    return;
  }

  handleRightPointerDown(_mapEditor) {
    return;
  }

  handleLeftPointerUp(_mapEditor) {
    return;
  }

  handleMiddlePointerUp(_mapEditor) {
    return;
  }

  handleRightPointerUp(_mapEditor) {
    return;
  }

  shouldMoveCursor(_mapEditor) {
    return true;
  }

  shouldPointerDownOnMove() {
    return false;
  }
}
