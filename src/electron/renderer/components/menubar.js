import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

import EllipsisIcon from "@vscode/codicons/src/icons/ellipsis.svg";

import { MenubarButton } from "./menubar-button";
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

  @property({ type: MenubarState })
  state = new MenubarState();

  @property({ type: Boolean, reflect: true })
  inactive = false;

  openMenu = null;

  resizeObserver = new ResizeObserver((_entries) => {
    this.requestUpdate();
  });

  onKeyDown = (event) => {
    if (!this.openMenu) {
      return;
    }

    switch (event.key) {
      case "ArrowLeft":
        this.selectMenuByOffset(-1);
        this.openMenu.autofocus = true;
        break;
      case "ArrowRight":
        this.selectMenuByOffset(1);
        this.openMenu.autofocus = true;
        break;
      case "ArrowDown":
      case "Tab":
      case "Home":
        this.openMenu.focus();
        break;
      case "ArrowUp":
      case "End":
        this.openMenu.focus();
        this.openMenu.menu.focusMenuItemByOffset(-1);
        break;
      case "Escape":
        this.closeOpenMenu();
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  selectMenuByOffset(offset) {
    let menuIndex = null;
    let menus = this.shadowRoot.querySelectorAll(
      "eomap-menubar-button, eomap-more-button"
    );

    for (let i = 0; i < menus.length; ++i) {
      if (this.openMenu === menus[i]) {
        menuIndex = i;
      }
    }

    menuIndex += offset;

    if (menuIndex < 0) {
      menuIndex = menus.length - 1;
    } else if (menuIndex >= menus.length) {
      menuIndex = 0;
    }

    this.toggleMenu(menus[menuIndex]);
  }

  onWindowPointerDown = (_event) => {
    this.closeOpenMenu();
  };

  onWindowBlur = (_event) => {
    this.closeOpenMenu();
  };

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has("state")) {
      // We might need to re-render on the next tick if the width of the menu
      // buttons has changed.
      this.requestUpdate();
    }
  }

  calculateVisibleButtons() {
    let result = 0;
    let currentSize = 0;
    let menuButtons = this.shadowRoot.querySelectorAll("eomap-menubar-button");

    for (let i = 0; i < this.state.menus.length; ++i) {
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
        .menuWidth=${menuState.menu.width}
        tabindex="-1"
        ?hidden=${!visible}
        @button-pointerenter=${this.onButtonPointerEnter}
        @button-pointerdown=${this.onButtonPointerDown}
        @menu-item-press=${this.onMenuItemPress}
      >
        ${menuState.menu.items.map(renderMenuItem)}
      </eomap-menubar-button>
    `;
  }

  render() {
    let visibleButtonCount = this.calculateVisibleButtons();

    let overflowMenus = [];
    for (let i = visibleButtonCount; i < this.state.menus.length; ++i) {
      let { label, menu } = this.state.menus[i];
      let submenu = renderMenuItem(new SubmenuMenuItemState(label, menu));
      overflowMenus.push(submenu);
    }

    let result = [];

    for (let i = 0; i < visibleButtonCount; ++i) {
      result.push(this.renderMenubarButton(this.state.menus[i], true));
    }

    result.push(html`
      <eomap-more-button
        label="More"
        tabindex="-1"
        ?hidden=${visibleButtonCount === this.state.menus.length}
        @button-pointerenter=${this.onButtonPointerEnter}
        @button-pointerdown=${this.onButtonPointerDown}
        @menu-item-press=${this.onMenuItemPress}
      >
        ${overflowMenus}
      </eomap-more-button>
    `);

    for (let i = visibleButtonCount; i < this.state.menus.length; ++i) {
      result.push(this.renderMenubarButton(this.state.menus[i], false));
    }

    return result;
  }

  onButtonPointerEnter(event) {
    if (this.openMenu && this.openMenu !== event.target) {
      this.toggleMenu(event.target);
    }
  }

  onButtonPointerDown(event) {
    this.toggleMenu(event.target);
  }

  onMenuItemPress(_event) {
    this.closeOpenMenu();
  }

  toggleMenu(menu) {
    let open = !menu.open;
    let togglingOpenMenu = this.openMenu === menu;

    if (open !== togglingOpenMenu) {
      this.closeOpenMenu();
    }

    if (open) {
      this.openMenu = menu;
      this.openMenu.focus();
      this.openMenu.autofocus = false;
    }

    menu.open = open;
  }

  closeOpenMenu() {
    if (this.openMenu) {
      this.openMenu.open = false;
      this.openMenu.blur();
      this.openMenu = null;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    ro.observe(this);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    ro.unobserve(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.resizeObserver.observe(this);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("pointerdown", this.onWindowPointerDown);
    window.addEventListener("blur", this.onWindowBlur);
  }

  disconnectedCallback() {
    this.resizeObserver.unobserve(this);
    window.removeEventListener("keydown", this.onKeyDown);
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
