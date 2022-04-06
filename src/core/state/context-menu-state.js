export class ContextMenuActionItem {
  constructor(label, action) {
    this.label = label;
    this.action = action;
  }
}

export class ContextMenuDividerItem {}

export class ContextMenuState {
  constructor(x, y, items) {
    this.x = x;
    this.y = y;
    this.items = items;
  }
}
