export class ContextMenuActionItem {
  constructor(label, action, disabled) {
    if (disabled === undefined) {
      disabled = false;
    }
    this.label = label;
    this.action = action;
    this.disabled = disabled;
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
