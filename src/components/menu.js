import { css, html, SpectrumElement } from "@spectrum-web-components/base";
import { customElement, query } from "lit/decorators.js";

import menuStyles from "@spectrum-web-components/menu/src/menu.css.js";
import { MenuItem } from "@spectrum-web-components/bundle";

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
          overflow: hidden;
        }
        ::slotted(sp-menu-item) {
          --spectrum-listitem-m-texticon-focus-indicator-color: transparent;
          --spectrum-listitem-m-texticon-text-color-key-focus: var(
            --spectrum-listitem-m-texticon-text-color,
            var(--spectrum-alias-component-text-color-default)
          );
          --spectrum-listitem-m-texticon-text-color-hover: var(
            --spectrum-listitem-m-texticon-text-color,
            var(--spectrum-alias-component-text-color-default)
          );
        }
        ::slotted(sp-menu-item:not([focused])) {
          --spectrum-listitem-m-texticon-background-color-hover: var(
            --spectrum-listitem-m-texticon-background-color,
            var(--spectrum-alias-background-color-transparent)
          );
          --spectrum-listitem-m-texticon-background-color-down: var(
            --spectrum-listitem-m-texticon-background-color,
            var(--spectrum-alias-background-color-transparent)
          );
        }
      `,
    ];
  }

  @query("slot:not([name])")
  menuSlot;

  focusedItemIndex = 0;
  menuItems = [];

  handleMenuItemPointerMove = (event) => {
    let menuItem = event.target;

    if (menuItem.focused) {
      return;
    }

    let index = this.menuItems.indexOf(event.target);
    if (index === -1) {
      return;
    }

    if (menuItem.disabled) {
      const focusedItem = this.menuItems[this.focusedItemIndex];
      focusedItem.focused = false;
      this.focusedItemIndex = index;
      return;
    }

    this.focusMenuItemByIndex(index);
  };

  handleMenuItemPointerUp = (event) => {
    if (event.target === this.menuItems[this.focusedItemIndex]) {
      this.pressFocusedMenuItem();
    }
  };

  constructor() {
    super();
    this.tabIndex = -1;
    this.addEventListener("pointerenter", this.handlePointerEnter);
    this.addEventListener("pointerout", this.handlePointerOut);
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

  handleFocusOut(event) {
    if (this.menuItems.includes(event.relatedTarget)) {
      return;
    }
    this.stopListeningToKeyboard();
    this.blurFocusedMenuItem();
    this.focusedItemIndex = 0;
    this.removeAttribute("aria-activedescendant");
  }

  handlePointerEnter(_event) {
    if (!this.menuItems.some((item) => item.focused)) {
      this.focus();
      this.blurFocusedMenuItem();
    }
  }

  handlePointerOut(_event) {
    this.blurFocusedMenuItem();
    this.focusedItemIndex = 0;
  }

  handleKeyDown(event) {
    switch (event.code) {
      case "Enter":
      case "Space":
        this.pressFocusedMenuItem();
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

    return itemToFocus;
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

  pressFocusedMenuItem() {
    const focusedItem = this.menuItems[this.focusedItemIndex];
    if (focusedItem && !focusedItem.disabled) {
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
    return html` <slot> </slot> `;
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
}
