import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

import EllipsisIcon from "@vscode/codicons/src/icons/ellipsis.svg";

import { MenubarButton } from "./menubar-button";
import { MenubarController } from "../../../core/controllers/menubar-controller";
import {
  MenubarState,
  SubmenuMenuItemState,
} from "../../../core/state/menubar-state";
import { renderMenuItem } from "../../../core/util/menu-utils";

@customElement("eomap-menubar")
export class Menubar extends LitElement {
  static get styles() {
    return css`
      :host {
        height: var(--eomap-menubar-height, 30px);
        display: flex;
        flex-shrink: 1;
        overflow: hidden;
        align-items: center;
      }
      eomap-menubar-button,
      eomap-more-button {
        --eomap-menubar-button-height: var(--eomap-menubar-height, 30px);
      }
      eomap-menubar-button[hidden],
      eomap-more-button[hidden] {
        visibility: hidden;
      }
      :host([inactive]) eomap-menubar-button,
      :host([inactive]) eomap-more-button {
        --spectrum-actionbutton-m-quiet-textonly-text-color: rgba(
          200,
          200,
          200,
          0.6
        );
      }
    `;
  }

  @property({ type: MenubarController })
  controller = null;

  @property({ type: Boolean, reflect: true })
  inactive = false;

  @state({ type: MenubarState })
  state = new MenubarState();

  @state({ type: Boolean })
  showMnemonics = false;

  selectedMenu = null;
  openMenuOnSelect = false;
  closeMenuOnPointerUp = false;
  focusOnAltKeyUp = false;

  resizeObserver = new ResizeObserver((_entries) => {
    this.requestUpdate();
  });

  onWindowKeyDown = (event) => {
    if (
      this.handleAltKeyDown(event) ||
      this.handleMnemonicsKeyDown(event) ||
      this.handleSelectedMenuKeyDown(event)
    ) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  };

  onWindowKeyUp = (event) => {
    if (this.handleAltKeyUp(event)) {
      event.preventDefault();
      event.stopPropagation();
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

    if (this.selectedMenu) {
      this.unselectMenu();
      this.focusOnAltKeyUp = false;
      this.showMnemonics = false;
    } else {
      this.focusOnAltKeyUp = true;
      this.showMnemonics = !this.showMnemonics;
    }

    return true;
  }

  handleMnemonicsKeyDown = (event) => {
    const mnemonicsEnabled = this.showMnemonics || event.altKey;

    if (!mnemonicsEnabled || event.repeat || this.selectedMenu?.open) {
      return;
    }

    const openMenu = async (button, menuItemIndex) => {
      // Defer to next tick
      await new Promise((resolve) => setTimeout(resolve, 0));
      this.showMnemonics = true;
      this.openMenuOnSelect = true;
      this.selectMenu(button);
      button.menu.focusMenuItemByIndex(menuItemIndex);
    };

    let menuButtons = this.getVisibleMenus();
    for (let button of menuButtons) {
      if (button instanceof MoreButton) {
        let menuItems = button.menu.menuItems;
        for (let i = 0; i < menuItems.length; ++i) {
          let menuItem = menuItems[i];
          if (menuItem.hasMnemonic(event.key)) {
            openMenu(button, i);
          }
        }
      } else if (button.hasMnemonic(event.key)) {
        openMenu(button, 0);
      }
    }
  };

  handleSelectedMenuKeyDown(event) {
    if (!this.selectedMenu) {
      return false;
    }

    switch (event.key) {
      case "ArrowLeft":
        this.selectMenuByOffset(-1);
        break;
      case "ArrowRight":
        this.selectMenuByOffset(1);
        break;
      case "ArrowDown":
        if (!this.selectedMenu.open) {
          this.openMenuOnSelect = true;
          this.selectedMenu.open = true;
        } else {
          this.selectedMenu.focus();
        }
        break;
      case "Tab":
      case "Home":
        if (this.selectedMenu.open) {
          this.selectedMenu.focus();
        }
        break;
      case "ArrowUp":
      case "End":
        if (this.selectedMenu.open) {
          this.selectedMenu.focus();
          this.selectedMenu.menu.focusMenuItemByOffset(-1);
        }
        break;
      case "Escape":
        this.showMnemonics = false;
        this.unselectMenu();
        break;
      default:
        return false;
    }

    return true;
  }

  handleAltKeyUp(event) {
    if (event.key === "Alt" && this.showMnemonics) {
      if (this.focusOnAltKeyUp) {
        this.openMenuOnSelect = false;
        this.selectMenuByIndex(0);
      } else if (!this.selectedMenu?.open) {
        this.showMnemonics = false;
      }
      return true;
    }
    return false;
  }

  getVisibleMenus() {
    return this.shadowRoot.querySelectorAll(
      "eomap-menubar-button:not([hidden]), eomap-more-button:not([hidden])",
    );
  }

  selectMenuByOffset(offset, autofocus) {
    if (autofocus === undefined) {
      autofocus = true;
    }

    let index = null;
    let menus = this.getVisibleMenus();

    for (let i = 0; i < menus.length; ++i) {
      if (this.selectedMenu === menus[i]) {
        index = i;
      }
    }

    index += offset;

    if (index < 0) {
      index = menus.length - 1;
    } else if (index >= menus.length) {
      index = 0;
    }

    this.selectMenuByIndex(index, autofocus);
  }

  selectMenuByIndex(index, autofocus) {
    if (autofocus === undefined) {
      autofocus = true;
    }
    let menus = this.getVisibleMenus();
    if (index < menus.length) {
      this.selectMenu(menus[index], autofocus);
    }
  }

  onWindowPointerDown = (event) => {
    if (event.altKey && !this.selectedMenu?.open) {
      this.focusOnAltKeyUp = false;
      return;
    }
    this.unselectMenu();
    this.showMnemonics = false;
  };

  onWindowBlur = (_event) => {
    this.unselectMenu();
    this.showMnemonics = false;
  };

  onMenubarStateUpdated = (menubarState) => {
    this.state = menubarState;
  };

  onKeybindingHandled = () => {
    this.showMnemonics = false;
    this.unselectMenu();
  };

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
    if (changed.has("state")) {
      // We might need to re-render on the next tick if the width of the menu
      // buttons has changed.
      this.requestUpdate();
    }
    if (changed.has("showMnemonics")) {
      this.dispatchEvent(new CustomEvent("show-mnemonics-changed"));
    }
  }

  calculateVisibleButtons() {
    let result = 0;
    let currentSize = 0;
    let menuButtons = this.shadowRoot.querySelectorAll("eomap-menubar-button");

    for (let i = 0; i < this.state.items.length; ++i) {
      if (i === menuButtons.length) {
        break;
      }

      let buttonElement = menuButtons[i];
      if (currentSize + buttonElement.offsetWidth > this.offsetWidth) {
        break;
      }

      currentSize += buttonElement.offsetWidth;
      ++result;
    }

    if (result < menuButtons.length) {
      let more = this.shadowRoot.querySelector("eomap-more-button");
      if (more && currentSize + more.offsetWidth > this.offsetWidth) {
        result = Math.max(0, result - 1);
      }
    }

    return result;
  }

  renderMenubarButton(menuState, visible) {
    return html`
      <eomap-menubar-button
        .label=${menuState.label}
        .showMnemonics=${this.showMnemonics}
        .menuWidth=${menuState.menu.width}
        tabindex="-1"
        ?hidden=${!visible}
        @button-pointerenter=${this.onButtonPointerEnter}
        @button-pointerdown=${this.onButtonPointerDown}
        @button-pointerup=${this.onButtonPointerUp}
        @menu-item-press=${this.onMenuItemPress}
      >
        ${menuState.menu.items.map(renderMenuItem)}
      </eomap-menubar-button>
    `;
  }

  render() {
    let visibleButtonCount = this.calculateVisibleButtons();

    let overflowMenus = [];
    for (let i = visibleButtonCount; i < this.state.items.length; ++i) {
      let { label, menu } = this.state.items[i];
      let submenu = renderMenuItem(
        new SubmenuMenuItemState().withLabel(label).withMenu(menu),
      );
      overflowMenus.push(submenu);
    }

    let result = [];

    for (let i = 0; i < visibleButtonCount; ++i) {
      result.push(this.renderMenubarButton(this.state.items[i], true));
    }

    result.push(html`
      <eomap-more-button
        label="More"
        tabindex="-1"
        .showMnemonics=${this.showMnemonics}
        ?hidden=${visibleButtonCount === this.state.items.length}
        @button-pointerenter=${this.onButtonPointerEnter}
        @button-pointerdown=${this.onButtonPointerDown}
        @button-pointerup=${this.onButtonPointerUp}
        @menu-item-press=${this.onMenuItemPress}
      >
        ${overflowMenus}
      </eomap-more-button>
    `);

    for (let i = visibleButtonCount; i < this.state.items.length; ++i) {
      result.push(this.renderMenubarButton(this.state.items[i], false));
    }

    return result;
  }

  onButtonPointerEnter(event) {
    if (this.selectedMenu && this.selectedMenu !== event.target) {
      this.selectMenu(event.target, false);
    }
  }

  onButtonPointerDown(event) {
    if (!event.target.open) {
      this.closeMenuOnPointerUp = false;
      this.openMenuOnSelect = true;
      this.selectMenu(event.target, false);
    } else {
      this.closeMenuOnPointerUp = true;
    }
  }

  onButtonPointerUp(event) {
    if (this.closeMenuOnPointerUp && event.target.open) {
      this.unselectMenu();
    }
  }

  onMenuItemPress(_event) {
    this.showMnemonics = false;
    this.unselectMenu();
  }

  selectMenu(menu, autofocus) {
    if (autofocus === undefined) {
      autofocus = true;
    }

    if (this.selectedMenu !== menu) {
      this.unselectMenu();
    }

    this.selectedMenu = menu;
    this.selectedMenu.focus();
    this.selectedMenu.autofocus = autofocus;
    this.selectedMenu.open = this.openMenuOnSelect;
  }

  unselectMenu() {
    if (this.selectedMenu) {
      this.selectedMenu.open = false;
      this.selectedMenu.blur();
      this.selectedMenu = null;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.resizeObserver.observe(this);
    window.addEventListener("keydown", this.onWindowKeyDown);
    window.addEventListener("keyup", this.onWindowKeyUp);
    window.addEventListener("pointerdown", this.onWindowPointerDown);
    window.addEventListener("blur", this.onWindowBlur);
  }

  disconnectedCallback() {
    this.resizeObserver.unobserve(this);
    window.removeEventListener("keydown", this.onWindowKeyDown);
    window.removeEventListener("keyup", this.onWindowKeyUp);
    window.removeEventListener("pointerdown", this.onWindowPointerDown);
    window.removeEventListener("blur", this.onWindowBlur);
    super.disconnectedCallback();
  }
}

@customElement("eomap-more-button")
export class MoreButton extends MenubarButton {
  getButtonContent() {
    return unsafeHTML(EllipsisIcon);
  }
}
