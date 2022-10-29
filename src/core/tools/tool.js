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

  down(pointer) {
    this.downX = pointer.x;
    this.downY = pointer.y;
    this.currentX = 0;
    this.currentY = 0;
  }

  move(pointer) {
    this.currentX = pointer.x;
    this.currentY = pointer.y;
  }

  up() {
    this.downX = 0;
    this.downY = 0;
    this.currentX = 0;
    this.currentY = 0;
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
    this.pointerDownDistance.move(pointer);
    for (let pos of pointer.getInterpolatedPosition()) {
      mapEditor.updateCurrentPos(pos);

      if (this.shouldMoveCursor(mapEditor, pointer)) {
        mapEditor.moveCursor(mapEditor.currentPos);
      }

      if (
        this.shouldPointerDownOnMove() &&
        this.pointerDownState !== PointerDownState.None
      ) {
        this.pointerDown(mapEditor, pointer, false);
        continue;
      }

      this.handlePointerMove(mapEditor);
    }
  }

  pointerDown(mapEditor, pointer, updatePosition) {
    if (updatePosition === undefined) {
      updatePosition = true;
    }

    const moveCursor = this.shouldMoveCursor();
    const handleButtonDown = (state, down, handler) => {
      if (down && this.updatePointerDownState(state, true)) {
        if (updatePosition) {
          this.pointerDownDistance.down(pointer);
          mapEditor.updateCurrentPos(pointer);
          if (moveCursor) {
            mapEditor.moveCursor(mapEditor.currentPos);
          }
        }
      }
      if (this.pointerDownState === state && mapEditor.currentPos.valid) {
        handler(mapEditor, pointer);
      }
    };

    handleButtonDown(
      PointerDownState.Left,
      pointer.leftButtonDown(),
      this.handleLeftPointerDown.bind(this)
    );

    handleButtonDown(
      PointerDownState.Middle,
      pointer.middleButtonDown(),
      this.handleMiddlePointerDown.bind(this)
    );

    handleButtonDown(
      PointerDownState.Right,
      pointer.rightButtonDown(),
      this.handleRightPointerDown.bind(this)
    );
  }

  pointerUp(mapEditor, pointer) {
    const handleButtonUp = (state, down, handler) => {
      if (!down && this.updatePointerDownState(state, false)) {
        this.pointerDownDistance.up();
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

  shouldMoveCursor() {
    return true;
  }

  shouldPointerDownOnMove() {
    return false;
  }

  shouldUsePointerCapture() {
    return false;
  }

  get isBeingUsed() {
    return this.pointerDownState !== PointerDownState.None;
  }
}
