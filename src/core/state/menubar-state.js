export class MenuItemState {
  constructor(label) {
    this.label = label;
    this.type = "normal";
    this.eventType = null;
    this.eventDetail = null;
    this.accelerator = null;
    this.registerAccelerator = false;
    this.enabled = true;
  }

  copy() {
    let copy = new MenuItemState(this.label);
    copy.eventType = this.eventType;
    copy.eventDetail = this.eventDetail;
    copy.accelerator = this.accelerator;
    copy.registerAccelerator = this.registerAccelerator;
    copy.enabled = this.enabled;
    return copy;
  }

  withEventType(eventType) {
    let copy = this.copy();
    copy.eventType = eventType;
    return copy;
  }

  withEventDetail(eventDetail) {
    let copy = this.copy();
    copy.eventDetail = eventDetail;
    return copy;
  }

  withAccelerator(accelerator) {
    let copy = this.copy();
    copy.accelerator = accelerator;
    return copy;
  }

  withRegisterAccelerator(registerAccelerator) {
    let copy = this.copy();
    copy.registerAccelerator = registerAccelerator;
    return copy;
  }

  withEnabled(enabled) {
    let copy = this.copy();
    copy.enabled = enabled;
    return copy;
  }
}

export class CheckboxMenuItemState extends MenuItemState {
  constructor(label) {
    super(label);
    this.type = "checkbox";
    this.checked = false;
  }

  copy() {
    let copy = new CheckboxMenuItemState(this.label);
    copy.eventType = this.eventType;
    copy.eventDetail = this.eventDetail;
    copy.accelerator = this.accelerator;
    copy.registerAccelerator = this.registerAccelerator;
    copy.enabled = this.enabled;
    copy.checked = this.checked;
    return copy;
  }

  withChecked(checked) {
    let copy = this.copy();
    copy.checked = checked;
    return copy;
  }
}

export class SubmenuMenuItemState {
  constructor(label, menu) {
    this.type = "submenu";
    this.label = label;
    this.menu = menu;
    this.enabled = true;
  }

  copy() {
    let copy = new SubmenuMenuItemState(this.label, this.menu);
    copy.enabled = this.enabled;
    return copy;
  }

  withEnabled(enabled) {
    let copy = this.copy();
    copy.enabled = enabled;
    return copy;
  }
}

export class DividerMenuItemState {
  constructor() {
    this.enabled = true;
    this.type = "separator";
  }
}

export class MenuState {
  constructor(items) {
    this.items = items;
    this.width = null;
  }

  copy() {
    let copy = new MenuState(this.items);
    copy.width = this.width;
    return copy;
  }

  withWidth(width) {
    let copy = this.copy();
    copy.width = width;
    return copy;
  }
}

export class MenubarState {
  constructor() {
    this.menus = [];
  }

  copy() {
    let copy = new MenubarState();
    copy.menus = [...this.menus];
    return copy;
  }

  withMenu(label, menu) {
    let copy = this.copy();
    copy.menus.push({ label, menu });
    return copy;
  }
}
