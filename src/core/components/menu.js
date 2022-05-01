import { css, html, SpectrumElement } from "@spectrum-web-components/base";
import { customElement, query } from "lit/decorators.js";

import menuStyles from "@spectrum-web-components/menu/src/menu.css.js";
import { MenuItem } from "@spectrum-web-components/menu/src/MenuItem.js";

import { SubmenuItem } from "./submenu-item";

@customElement("eomap-menu")
export class Menu extends SpectrumElement {
  static get styles() {
    return [
      menuStyles,
      css`
        :host {
          width: max-content;
          padding-top: 4px;
          padding-bottom: 4px;
          margin: 0px;
          overflow: visible;
          box-shadow: 0px 3px 5px rgb(0 0 0 / 40%);
        }
      `,
    ];
  }

  @query("slot:not([name])")
  menuSlot;

  focusedItemIndex = 0;
  menuItems = [];

  closeSubmenuTimeout = null;
  openSubmenuTimeout = null;
  pointerInSubmenu = false;

  handleMenuItemPointerMove = (event) => {
    let menuItem = event.currentTarget;

    if (menuItem !== event.target) {
      this.pointerInSubmenu = true;
      this.cancelCloseSubmenu();
    }

    if (menuItem.focused) {
      return;
    }

    let index = this.menuItems.indexOf(menuItem);
    if (index === -1) {
      return;
    }

    if (menuItem.disabled) {
      this.blurFocusedMenuItem();
      this.focusedItemIndex = index;
      if (this.submenu) {
        this.scheduleCloseSubmenu();
      }
      return;
    }

    const oldFocusedItem = this.menuItems[this.focusedItemIndex];
    const newFocusedItem = this.focusMenuItemByIndex(index);
    if (
      newFocusedItem instanceof SubmenuItem &&
      oldFocusedItem !== newFocusedItem &&
      this.submenu !== newFocusedItem
    ) {
      this.scheduleOpenSubmenu();
    }
  };

  handleMenuItemPointerUp = (event) => {
    const focusedMenuItem = this.menuItems[this.focusedItemIndex];
    if (focusedMenuItem instanceof SubmenuItem) {
      return;
    }
    if (event.target === focusedMenuItem) {
      this.pressFocusedMenuItem(true);
    }
  };

  handleWindowPointerDown = (_event) => {
    this.closeSubmenu(true);
  };

  handleWindowBlur = (_event) => {
    this.closeSubmenu(true);
  };

  constructor() {
    super();
    this.tabIndex = -1;
    this.addEventListener("pointerenter", this.handlePointerEnter);
    this.addEventListener("pointerleave", this.handlePointerLeave);
  }

  focus(options) {
    if (
      !this.menuItems.length ||
      this.menuItems.every((menuItem) => menuItem.disabled)
    ) {
      return;
    }
    super.focus(options);
    this.focusMenuItemByIndex(this.focusedItemIndex);
    this.startListeningToKeyboard();
  }

  isDescendant(element) {
    return (
      this === element ||
      this.menuItems.includes(element) ||
      (this.submenu && this.submenu.menu.isDescendant(element))
    );
  }

  handleFocusOut(event) {
    if (this.isDescendant(event.relatedTarget)) {
      return;
    }
    this.stopListeningToKeyboard();
    this.closeSubmenu(true);
    this.blurFocusedMenuItem();
    this.focusedItemIndex = 0;
    this.removeAttribute("aria-activedescendant");
  }

  handlePointerEnter(event) {
    if (this.pointerInSubmenu && event.target === this) {
      this.pointerInSubmenu = false;
    }
    if (!this.menuItems.some((item) => item.focused)) {
      this.focus();
      this.blurFocusedMenuItem();
    }
  }

  handlePointerLeave(_event) {
    if (this.pointerInSubmenu) {
      return;
    }
    this.stopListeningToKeyboard();
    this.scheduleCloseSubmenu(true);
    this.blurFocusedMenuItem();
    this.focusedItemIndex = 0;
  }

  handleSubmenuKeyDown(event) {
    const focusedItem = this.menuItems[this.focusedItemIndex];

    if (focusedItem instanceof SubmenuItem) {
      if (this.submenu === focusedItem) {
        const menu = this.submenu.menu;
        switch (event.key) {
          case "ArrowDown":
          case "Home":
            menu.focusMenuItemByIndex(0);
            menu.focus();
            return true;
          case "ArrowUp":
          case "End":
            menu.focusMenuItemByIndex(menu.menuItems.length - 1, -1);
            menu.focus();
            return true;
          case "Escape":
          case "ArrowLeft":
            this.focus();
            this.closeSubmenu(true);
            return true;
        }
      }

      if (event.key === "ArrowRight" && focusedItem !== this.submenu) {
        this.pressFocusedMenuItem(false);
        return true;
      }
    }

    return false;
  }

  handleKeyDown(event) {
    if (this.handleSubmenuKeyDown(event)) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const focusedItem = this.menuItems[this.focusedItemIndex];
    if (focusedItem && !focusedItem.focused) {
      return;
    }

    switch (event.code) {
      case "Enter":
      case "Space":
        this.pressFocusedMenuItem(false);
        event.preventDefault();
        event.stopPropagation();
        return;
    }

    let itemToFocus = null;

    switch (event.key) {
      case "Tab":
        itemToFocus = this.focusMenuItemByOffset(event.shiftKey ? -1 : 1);
        break;
      case "ArrowDown":
        itemToFocus = this.focusMenuItemByOffset(1);
        break;
      case "ArrowUp":
        itemToFocus = this.focusMenuItemByOffset(-1);
        break;
      case "Home":
        itemToFocus = this.focusMenuItemByIndex(0);
        break;
      case "End":
        itemToFocus = this.focusMenuItemByIndex(this.menuItems.length - 1, -1);
        break;
      case "PageUp":
      case "PageDown":
        // do nothing
        break;
      default:
        return;
    }

    if (itemToFocus) {
      itemToFocus.scrollIntoView({ block: "nearest" });
    }

    event.preventDefault();
    event.stopPropagation();
  }

  startListeningToKeyboard() {
    this.stopListeningToKeyboard();
    this.addEventListener("keydown", this.handleKeyDown);
    this.addEventListener("focusout", this.handleFocusOut);
  }

  stopListeningToKeyboard() {
    this.removeEventListener("keydown", this.handleKeyDown);
    this.removeEventListener("focusout", this.handleFocusOut);
  }

  focusMenuItemByOffset(offset) {
    let index =
      (this.menuItems.length + this.focusedItemIndex + offset) %
      this.menuItems.length;
    return this.focusMenuItemByIndex(index, Math.sign(offset));
  }

  focusMenuItemByIndex(index, step) {
    step = step || 1;
    this.blurFocusedMenuItem();
    const oldFocusedItem = this.menuItems[this.focusedItemIndex];
    this.focusedItemIndex = index;
    let itemToFocus = this.menuItems[this.focusedItemIndex];
    let availableItems = this.menuItems.length;

    while (availableItems && itemToFocus.disabled) {
      availableItems -= 1;
      this.focusedItemIndex =
        (this.menuItems.length + this.focusedItemIndex + step) %
        this.menuItems.length;
      itemToFocus = this.menuItems[this.focusedItemIndex];
    }

    if (itemToFocus) {
      itemToFocus.focused = true;
    }

    if (oldFocusedItem && oldFocusedItem !== itemToFocus) {
      if (oldFocusedItem === this.submenu) {
        this.scheduleCloseSubmenu();
      } else if (itemToFocus === this.submenu) {
        this.cancelCloseSubmenu();
      }
      this.cancelOpenSubmenu();
    }

    return itemToFocus;
  }

  scheduleOpenSubmenu() {
    if (this.openSubmenuTimeout === null) {
      this.openSubmenuTimeout = setTimeout(() => {
        this.closeSubmenu(false);
        this.openSubmenu(false);
      }, 250);
    }
  }

  scheduleCloseSubmenu() {
    if (this.closeSubmenuTimeout === null) {
      this.closeSubmenuTimeout = setTimeout(() => {
        this.closeSubmenu(true);
      }, 750);
    }
  }

  cancelCloseSubmenu() {
    clearTimeout(this.closeSubmenuTimeout);
    this.closeSubmenuTimeout = null;
  }

  cancelOpenSubmenu() {
    clearTimeout(this.openSubmenuTimeout);
    this.openSubmenuTimeout = null;
  }

  closeSubmenu(force) {
    this.cancelCloseSubmenu();
    if (force === undefined) {
      force = false;
    }
    if (!this.submenu) {
      return;
    }
    if (force || !this.submenu.focused) {
      this.submenu.open = false;
      this.submenu = null;
    }
  }

  openSubmenu(focus) {
    const focusedItem = this.menuItems[this.focusedItemIndex];
    if (focusedItem instanceof SubmenuItem && !focusedItem.open) {
      this.submenu = focusedItem;
      this.submenu.open = true;

      let menu = this.submenu.menu;
      menu.focusMenuItemByIndex(0);
      menu.blurFocusedMenuItem();

      if (focus) {
        setTimeout(() => {
          menu.focus();
        }, 1);
      }
    }
  }

  focusMenuItem(menuItem) {
    const index = this.menuItems.indexOf(menuItem);
    if (index !== -1) {
      this.focusMenuItemByIndex(index);
    }
  }

  blurFocusedMenuItem() {
    const focusedItem = this.menuItems[this.focusedItemIndex];
    if (focusedItem) {
      focusedItem.focused = false;
    }
  }

  pressFocusedMenuItem(pointer) {
    const focusedItem = this.menuItems[this.focusedItemIndex];
    if (focusedItem && !focusedItem.disabled) {
      if (focusedItem instanceof SubmenuItem) {
        this.closeSubmenu(false);
        this.openSubmenu(!pointer);
        return;
      }
      focusedItem.dispatchEvent(
        new CustomEvent("menu-item-press", {
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  firstUpdated(changes) {
    super.firstUpdated(changes);
    this.collectMenuItems();
  }

  render() {
    return html` <slot @slotchange=${this.collectMenuItems}> </slot> `;
  }

  collectMenuItems() {
    for (const menuItem of this.menuItems) {
      menuItem.removeEventListener(
        "pointermove",
        this.handleMenuItemPointerMove
      );
      menuItem.removeEventListener("pointerup", this.handleMenuItemPointerUp);
    }

    this.menuItems = [];

    const slotElements = this.menuSlot
      ? this.menuSlot.assignedElements({ flatten: true })
      : [];

    for (const slotElement of slotElements) {
      const childMenuItems =
        slotElement instanceof MenuItem
          ? [slotElement]
          : [...slotElement.querySelectorAll(`*`)];

      for (const childMenuItem of childMenuItems) {
        this.menuItems.push(childMenuItem);
      }
    }

    for (const menuItem of this.menuItems) {
      menuItem.addEventListener("pointermove", this.handleMenuItemPointerMove);
      menuItem.addEventListener("pointerup", this.handleMenuItemPointerUp);
    }
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("pointerdown", this.handleWindowPointerDown);
    window.addEventListener("blur", this.handleWindowBlur);
  }

  disconnectedCallback() {
    window.removeEventListener("pointerdown", this.handleWindowPointerDown);
    window.removeEventListener("blur", this.handleWindowBlur);
    super.disconnectedCallback();
  }
}
