export class LayerVisibilityState {
  constructor() {
    this._flags = [
      /* [0]  Ground     */ true,
      /* [1]  Objects    */ true,
      /* [2]  Overlay    */ true,
      /* [3]  Down Wall  */ true,
      /* [4]  Right Wall */ true,
      /* [5]  Roof       */ true,
      /* [6]  Top        */ true,
      /* [7]  Shadow     */ true,
      /* [8]  Overlay 2  */ true,
      /* [9]  Tilespec   */ false,
      /* [10] Entity     */ true,
    ];
    this._selectedLayer = 0;
  }

  copy() {
    let copy = new LayerVisibilityState();
    copy._flags = this._flags;
    copy._selectedLayer = this._selectedLayer;
    return copy;
  }

  withFlagToggled(flag) {
    let copy = this.copy();
    copy._flags[flag] = !copy._flags[flag];
    return copy;
  }

  withSelectedLayer(layer) {
    let copy = this.copy();
    copy._selectedLayer = layer;
    return copy;
  }

  isFlagActive(flag) {
    return this._flags[flag] || this.isFlagOverridden(flag);
  }

  isFlagOverridden(flag) {
    return flag === this._selectedLayer;
  }

  isLayerVisible(layer) {
    switch (layer) {
      case 10:
        // Visibility flag 9 covers both of the Tilespec layers
        return this.isLayerVisible(9);
      case 11:
      case 12:
      case 13:
      case 14:
        // Visibility flag 10 covers all Entity layers
        return this._flags[10];
      default:
        return this._flags[layer] || this._selectedLayer === layer;
    }
  }
}
