export class EntityState {
  constructor(x, y, warp, sign, npcs, items) {
    this.x = x;
    this.y = y;
    this.warp = warp;
    this.sign = sign;
    this.npcs = npcs;
    this.items = items;
  }

  copy() {
    return new EntityState(
      this.x,
      this.y,
      this.warp,
      this.sign,
      [...this.npcs],
      [...this.items]
    );
  }

  withWarp(warp) {
    let copy = this.copy();
    copy.warp = warp;
    return copy;
  }

  withSign(sign) {
    let copy = this.copy();
    copy.sign = sign;
    return copy;
  }

  withNpcs(npcs) {
    let copy = this.copy();
    copy.npcs = npcs;
    return copy;
  }

  withItems(items) {
    let copy = this.copy();
    copy.items = items;
    return copy;
  }
}
