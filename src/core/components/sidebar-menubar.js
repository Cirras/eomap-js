import { css, html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

import MenuIcon from "@vscode/codicons/src/icons/menu.svg";

import { MenubarController } from "../controllers/menubar-controller";
import { MenubarState } from "../state/menubar-state";
import { renderMenuItem } from "../util/menu-utils";

@customElement("eomap-sidebar-menubar")
export class SidebarMenubar extends LitElement {
  static get styles() {
    return css`
      :host {
        display: inline-flex;
      }
      #button {
        padding: 0px;
        --spectrum-actionbutton-m-quiet-textonly-background-color-down: var(
          --spectrum-alias-component-background-color-quiet-default
        );
        --spectrum-actionbutton-m-textonly-border-color-down: var(
          --spectrum-alias-component-border-color-quiet-default
        );
        --spectrum-actionbutton-m-quiet-textonly-text-color: var(
          --spectrum-alias-component-icon-color-default
        );
        --spectrum-actionbutton-m-quiet-textonly-text-color-hover: var(
          --spectrum-alias-component-icon-color-hover
        );
        --spectrum-actionbutton-m-quiet-textonly-text-color-down: var(
          --spectrum-alias-component-icon-color-down
        );
        --spectrum-actionbutton-m-quiet-textonly-text-color-key-focus: var(
          --spectrum-alias-component-icon-color-key-focus
        );
      }
      :host([open]) #button {
        --spectrum-actionbutton-m-quiet-textonly-text-color: var(
          --spectrum-alias-component-icon-color-key-focus
        );
      }
      :host([focused]) #button {
        background-color: var(
          --spectrum-alias-component-background-color-quiet-key-focus
        ) !important;
        border-color: var(
          --spectrum-alias-component-border-color-quiet-key-focus
        ) !important;
        color: var(--spectrum-alias-component-text-color-key-focus) !important;
      }
      :host([focused]) #button::after {
        box-shadow: 0 0 0 var(--spectrum-actionbutton-focus-ring-size)
          var(--spectrum-actionbutton-focus-ring-color);
        border-radius: calc(
          var(--spectrum-actionbutton-quiet-textonly-border-radius) +
            var(--spectrum-actionbutton-focus-ring-gap)
        );
      }
      #menu-holder {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 1000;
      }
      #menu {
        width: var(--spectrum-global-dimension-size-1700);
        background-color: var(--spectrum-global-color-gray-200);
        border: 1px solid var(--spectrum-global-color-gray-100);
        position: fixed;
      }
      #menu[hidden] {
        visibility: hidden;
      }
      #button-content {
        display: flex;
        justify-content: center;
        align-items: center;
      }
    `;
  }

  @query("#button")
  button;

  @query("#menu-holder")
  menuHolder;

  @query("#menu")
  menu;

  @property({ type: MenubarController })
  controller = null;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Boolean, reflect: true })
  focused = false;

  @state({ type: MenubarState })
  state = new MenubarState();

  focusOnAltKeyUp = false;
  focusMenuOnOpen = false;
  closeMenuOnPointerUp = false;

  onWindowKeyDown = (event) => {
    if (this.handleAltKeyDown(event) || this.handleMenuKeyDown(event)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  };

  onWindowKeyUp = (event) => {
    if (this.handleAltKeyUp(event)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  };

  handleAltKeyDown(event) {
    if (event.repeat) {
      return false;
    }

    if (event.key !== "Alt") {
      this.focusOnAltKeyUp = false;
      return false;
    }

    this.focusOnAltKeyUp = !this.open;
    this.open = false;

    return true;
  }

  handleMenuKeyDown(event) {
    if (!this.open) {
      return false;
    }

    switch (event.key) {
      case "ArrowLeft":
        break;
      case "ArrowRight":
        this.open = false;
        break;
      case "ArrowDown":
      case "Tab":
      case "Home":
        this.menu.focus();
        break;
      case "ArrowUp":
      case "End":
        this.menu.focus();
        this.menu.focusMenuItemByOffset(-1);
        break;
      case "Escape":
        this.open = false;
        break;
      default:
        return false;
    }

    return true;
  }

  handleAltKeyUp(event) {
    if (event.key === "Alt" && this.focusOnAltKeyUp) {
      this.button.focus();
      this.focused = true;
      return true;
    }
    return false;
  }

  onWindowPointerDown = (_event) => {
    this.open = false;
    this.focusOnAltKeyUp = false;
  };

  onWindowBlur = (_event) => {
    this.open = false;
  };

  onMenubarStateUpdated = (menubarState) => {
    this.state = menubarState;
  };

  onKeybindingHandled = () => {
    this.open = false;
  };

  update(changed) {
    if (changed.has("open")) {
      this.manageOpen();
    }
    super.update(changed);
  }

  manageOpen() {
    let menu = this.menu;
    if (!menu) {
      return;
    }

    if (this.open) {
      this.buttonRect = this.button.getBoundingClientRect();
      let menuHolderRect = this.menuHolder.getBoundingClientRect();

      let top = -menuHolderRect.top + this.buttonRect.top;
      let left = -menuHolderRect.left + this.buttonRect.right + 8;

      menu.style.top = `${top}px`;
      menu.style.left = `${left}px`;
    } else {
      menu.blur();
    }
  }

  updated(changed) {
    super.updated(changed);
    if (changed.has("controller")) {
      const oldController = changed.get("controller");
      oldController?.off("menubar-state-updated", this.onMenubarStateUpdated);
      oldController?.off("keybinding-handled", this.onKeybindingHandled);
      this.controller?.on("menubar-state-updated", this.onMenubarStateUpdated);
      this.controller?.on("keybinding-handled", this.onKeybindingHandled);
      this.state = this.controller?.state ?? new MenubarState();
    }
    if (changed.has("open") && this.open && this.focusMenuOnOpen) {
      this.menu.focus();
    }
  }

  render() {
    return html`
      <sp-action-button
        id="button"
        quiet
        aria-haspopup="true"
        aria-controls="menu"
        aria-expanded=${this.open ? "true" : "false"}
        aria-label="Application Menu"
        title="Application Menu"
        role="menuitem"
        @pointerdown=${this.onButtonPointerDown}
        @pointerup=${this.onButtonPointerUp}
        @keydown=${this.onButtonKeyUp}
        @blur=${this.onButtonBlur}
      >
        <div id="button-content">${unsafeHTML(MenuIcon)}</div>
      </sp-action-button>
      <div id="menu-holder">
        <eomap-menu
          id="menu"
          role="menu"
          ?hidden=${!this.open}
          @pointerdown=${(event) => event.stopPropagation()}
          @menu-item-press=${this.onMenuItemPress}
        >
          ${this.state.items.map(renderMenuItem)}
        </eomap-menu>
      </div>
    `;
  }

  onButtonPointerDown(event) {
    if (!this.open) {
      this.focusMenuOnOpen = false;
      this.closeMenuOnPointerUp = false;
      this.open = true;
    } else {
      this.closeMenuOnPointerUp = true;
    }
    event.stopPropagation();
  }

  onButtonPointerUp(_event) {
    if (this.closeMenuOnPointerUp && this.open) {
      this.open = false;
    }
  }

  onButtonKeyUp(event) {
    if (event.code === "Enter" || event.code === "Space") {
      this.focusMenuOnOpen = true;
      this.open = true;
      event.stopPropagation();
      event.preventDefault();
    }
  }

  onButtonBlur(_event) {
    this.focused = false;
  }

  onMenuItemPress(_event) {
    this.open = false;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("keydown", this.onWindowKeyDown);
    window.addEventListener("keyup", this.onWindowKeyUp);
    window.addEventListener("pointerdown", this.onWindowPointerDown);
    window.addEventListener("blur", this.onWindowBlur);
  }

  disconnectedCallback() {
    window.removeEventListener("keydown", this.onWindowKeyDown);
    window.removeEventListener("keyup", this.onWindowKeyUp);
    window.removeEventListener("pointerdown", this.onWindowPointerDown);
    window.removeEventListener("blur", this.onWindowBlur);
    super.disconnectedCallback();
  }
}
