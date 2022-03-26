import { css, html, SpectrumElement } from "@spectrum-web-components/base";
import { customElement, property, query, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

import "@spectrum-web-components/menu/sp-menu-item.js";
import "@spectrum-web-components/menu/sp-menu-divider.js";

import "./menu";

import {
  ContextMenuActionItem,
  ContextMenuDividerItem,
  ContextMenuState,
} from "../state/context-menu-state";

@customElement("eomap-context-menu")
export class ContextMenu extends SpectrumElement {
  static get styles() {
    return css`
      :host {
        position: absolute;
        x: 0;
        y: 0;
        z-index: 1000;
      }
      #menu {
        position: absolute;
        background-color: var(--spectrum-global-color-gray-200);
        border: 1px solid var(--spectrum-global-color-gray-100);
      }
      #menu:not([hidden]) {
        animation: fadeIn 0.083s linear;
      }
      #menu[hidden] {
        visibility: hidden;
      }
      @keyframes fadeIn {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }
      sp-menu-divider {
        --spectrum-listitem-m-texticon-divider-color: var(
          --spectrum-global-color-gray-300
        );
        --spectrum-listitem-texticon-divider-size: var(
          --spectrum-global-dimension-size-10
        );
      }
    `;
  }

  @query("eomap-menu")
  menu;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: ContextMenuState })
  state;

  @state({ type: Object })
  menuStyle = null;

  onKeyDown = (event) => {
    if (!this.open) {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
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
        this.open = false;
        break;
      default:
        return;
    }

    event.preventDefault();
    event.stopPropagation();
  };

  onResize = (_event) => {
    this.open = false;
  };

  constructor() {
    super();
    this.addEventListener("focusout", this.onFocusOut);
    this.addEventListener("menu-item-press", this.onMenuItemPress);
  }

  renderItems() {
    return this.state.items.map((item) => {
      if (item instanceof ContextMenuActionItem) {
        return html`
          <sp-menu-item @menu-item-press=${item.action}>
            ${item.label}
          </sp-menu-item>
        `;
      } else if (item instanceof ContextMenuDividerItem) {
        return html`<sp-menu-divider> </sp-menu-divider>`;
      }
    });
  }

  update(changedProperties) {
    if (changedProperties.has("state")) {
      this.menuStyle = null;
    }
    super.update(changedProperties);
  }

  render() {
    if (this.state) {
      return html`
        <eomap-menu
          id="menu"
          style=${styleMap(this.menuStyle || {})}
          ?hidden=${!this.open || !this.menuStyle}
          @pointerdown=${(event) => event.stopPropagation()}
        >
          ${this.renderItems()}
        </eomap-menu>
      `;
    }
  }

  async updated(changedProperties) {
    super.updated(changedProperties);

    if (changedProperties.has("open")) {
      this.dispatchOpenEvent();
    }

    const children = this.shadowRoot.querySelectorAll("*");
    await Promise.all(Array.from(children).map((c) => c.updateComplete));

    this.manageMenuStyle();
  }

  dispatchOpenEvent() {
    let eventName = this.open ? "context-menu-open" : "context-menu-close";
    this.dispatchEvent(
      new CustomEvent(eventName, {
        bubbles: true,
        composed: true,
      })
    );
  }

  manageMenuStyle() {
    if (!this.open || !this.state || this.menuStyle) {
      return;
    }

    let menu = this.menu;
    let menuRect = menu.getBoundingClientRect();
    let menuWidth = menuRect.width;
    let menuHeight = menuRect.height;

    let parent = this.getRootNode().host;
    let parentWidth = parent.clientWidth;
    let parentHeight = parent.clientHeight;

    let left;
    let top;

    if (this.state.x + menuWidth < parentWidth) {
      left = this.state.x;
    } else if (this.state.x - menuWidth > 0) {
      left = this.state.x - menuWidth;
    } else {
      this.open = false;
      return;
    }

    if (this.state.y + menuHeight < parentHeight) {
      top = this.state.y;
    } else if (this.state.y - menuHeight > 0) {
      top = this.state.y - menuHeight;
    } else {
      this.open = false;
      return;
    }

    this.menuStyle = {
      left: `${left}px`,
      top: `${top}px`,
    };
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("resize", this.onResize);
  }

  disconnectedCallback() {
    this.open = false;
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("resize", this.onResize);
    super.disconnectedCallback();
  }

  onFocusOut(event) {
    if (this.menu.isDescendant(event.relatedTarget)) {
      return;
    }
    this.open = false;
  }

  onMenuItemPress() {
    this.open = false;
  }
}
