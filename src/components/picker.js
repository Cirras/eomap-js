import { css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import "@spectrum-web-components/icon/sp-icon.js";
import pickerStyles from "@spectrum-web-components/picker/src/picker.css.js";
import chevronStyles from "@spectrum-web-components/icon/src/spectrum-icon-chevron.css.js";

import { Dropdown } from "./dropdown";
import { MenuItem } from "@spectrum-web-components/menu/src/MenuItem.js";
import { Overlay } from "@spectrum-web-components/overlay/src/overlay.js";

const chevronClass = {
  s: "spectrum-UIIcon-ChevronDown75",
  m: "spectrum-UIIcon-ChevronDown100",
  l: "spectrum-UIIcon-ChevronDown200",
  xl: "spectrum-UIIcon-ChevronDown300",
};
@customElement("eomap-picker")
export class Picker extends Dropdown {
  static get styles() {
    return [
      pickerStyles,
      chevronStyles,
      ...super.styles,
      css`
        :host {
          --spectrum-picker-m-texticon-background-color: var(
            --spectrum-global-color-gray-50
          );
          --spectrum-picker-m-texticon-background-color-hover: var(
            --spectrum-global-color-gray-75
          );
          --spectrum-picker-m-texticon-background-color-down: var(
            --spectrum-global-color-gray-100
          );
        }
        :host([open]) #button {
          border-bottom-left-radius: 0px;
          border-bottom-right-radius: 0px;
        }
        #menu {
          background-color: var(--spectrum-global-color-gray-50);
          border-color: var(--spectrum-alias-component-border-color-default);
        }
        #button {
          --spectrum-actionbutton-label-flex-grow: 1;
        }
        :host([open]) #button {
          --spectrum-actionbutton-focus-ring-size: 0px;
        }
      `,
    ];
  }

  @property({ type: String })
  value = "";

  @state({ type: MenuItem })
  selectedItem = null;

  allowEscapeKeyUp = true;

  resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      let menu = this.menu;
      if (menu) {
        menu.style.width = `${entry.borderBoxSize[0].inlineSize}px`;
      }
    }
  });

  onWindowPointerDown = (event) => {
    if (event.target !== this) {
      this.open = false;
    }
  };

  onWindowBlur = (_event) => {
    this.open = false;
  };

  onWindowKeyUp = (event) => {
    if (event.code === "Escape") {
      this.undoEvilHackToPreventOverlaysFromClosingUnexpectedly();
    }
  };

  onButtonClick = (_event) => {
    this.open = !this.open;
  };

  onButtonBlur = (_event) => {
    this.focused = false;
  };

  onMenuItemPress = (event) => {
    this.value = event.target.value;
    this.open = false;
  };

  onKeyDown = (event) => {
    if (event.code === "Space") {
      this.open = true;
    }

    switch (event.key) {
      case "Enter":
      case "ArrowDown":
        if (this.open) {
          this.menu.focus();
          this.menu.focusMenuItemByOffset(0);
        } else {
          this.open = true;
        }
        break;
      case "Tab":
      case "Home":
        this.menu.focus();
        this.menu.focusMenuItemByOffset(0);
        break;
      case "ArrowUp":
      case "End":
        this.menu.focus();
        this.menu.focusMenuItemByOffset(-1);
        break;
      case "Escape":
        if (this.open) {
          this.doEvilHackToPreventOverlaysFromClosingUnexpectedly();
          this.open = false;
        }
        break;
      default:
        return;
    }

    event.preventDefault();
    event.stopPropagation();
  };

  constructor() {
    super();
    this.addEventListener("keydown", this.onKeyDown);
  }

  static overlayEscapeHacked = false;

  // See: https://github.com/adobe/spectrum-web-components/issues/1853
  doEvilHackToPreventOverlaysFromClosingUnexpectedly() {
    const overlayStack = Overlay.overlayStack;
    if (!Picker.overlayEscapeHacked) {
      Picker.overlayEscapeHacked = true;
      overlayStack.document.removeEventListener(
        "keyup",
        overlayStack.handleKeyUp
      );
    }
  }

  undoEvilHackToPreventOverlaysFromClosingUnexpectedly() {
    const overlayStack = Overlay.overlayStack;
    if (Picker.overlayEscapeHacked) {
      Picker.overlayEscapeHacked = false;
      overlayStack.document.addEventListener("keyup", overlayStack.handleKeyUp);
    }
  }

  forceFocusVisible() {
    this.focused = true;
  }

  focus(options) {
    super.focus(options);

    if (!this.disabled && this.focusElement) {
      this.focused = this.hasVisibleFocusInTree();
    }
  }

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    this.resizeObserver.observe(this.button);
    this.button.addEventListener("click", this.onButtonClick);
    this.button.addEventListener("blur", this.onButtonBlur);
    this.menu.addEventListener("menu-item-press", this.onMenuItemPress);
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has("value")) {
      this.select(
        this.menu.menuItems.find((m) => m.value === this.value) || null
      );
    }
    if (changedProperties.has("open")) {
      if (this.open) {
        this.menu.focusMenuItem(this.selectedItem);
        this.focus();
      }
      this.focused = false;
    }
  }

  select(item) {
    if (this.selectedItem) {
      this.selectedItem.selected = false;
    }
    this.selectedItem = item;
    if (this.selectedItem) {
      this.selectedItem.selected = true;
    }
  }

  getButtonContent() {
    return html`
      ${super.getButtonContent()}
      <sp-icon-chevron100
        class="picker ${chevronClass[this.size]}"
      ></sp-icon-chevron100>
    `;
  }

  getLabel() {
    if (this.value) {
      if (this.selectedItem) {
        return this.selectedItem.itemChildren.content;
      } else {
        return "Unknown (" + this.value + ")";
      }
    }
    return super.getLabel();
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("pointerdown", this.onWindowPointerDown);
    window.addEventListener("blur", this.onWindowBlur);
    window.addEventListener("keyup", this.onWindowKeyUp);
  }

  disconnectedCallback() {
    window.removeEventListener("pointerdown", this.onWindowPointerDown);
    window.removeEventListener("blur", this.onWindowBlur);
    window.removeEventListener("keyup", this.onWindowKeyUp);
    super.disconnectedCallback();
  }
}
