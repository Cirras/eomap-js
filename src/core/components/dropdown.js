import { css, html, SizedMixin } from "@spectrum-web-components/base";
import {
  customElement,
  property,
  query,
} from "@spectrum-web-components/base/src/decorators.js";

import { Focusable } from "@spectrum-web-components/shared/src/focusable.js";

import "@spectrum-web-components/action-button/sp-action-button.js";
import "@spectrum-web-components/popover/sp-popover.js";

import "./menu";

@customElement("eomap-dropdown")
export class Dropdown extends SizedMixin(Focusable) {
  static get styles() {
    return [
      css`
        :host {
          display: inline-flex;
        }
        #menu-holder {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1;
        }
        #menu {
          background-color: var(--spectrum-global-color-gray-200);
          border: 1px solid var(--spectrum-global-color-gray-100);
          position: fixed;
          z-index: 1000;
        }
        #menu[hidden] {
          visibility: hidden;
        }
        #button-content {
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `,
    ];
  }

  @query("#button")
  button;

  @query("#menu-holder")
  menuHolder;

  @query("#menu")
  menu;

  @property({ type: Boolean, reflect: true })
  disabled = false;

  @property({ type: Boolean, reflect: true })
  focused = false;

  @property({ type: Boolean, reflect: true })
  invalid = false;

  @property({ type: String })
  label;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Boolean, reflect: true })
  quiet = false;

  @property({ type: String, reflect: true })
  direction = "down";

  buttonRect = null;

  getButtonContent() {
    return html`
      <span id="label">
        <slot name="label">${this.renderLabel()}</slot>
      </span>
    `;
  }

  renderLabel() {
    throw new Error("Dropdown.renderLabel() must be implemented");
  }

  getAriaLabel() {
    throw new Error("Dropdown.getAriaLabel() must be implemented");
  }

  render() {
    return html`
      <sp-action-button
        id="button"
        quiet
        ?selected=${this.open}
        ?quiet=${this.quiet}
        aria-haspopup="true"
        aria-controls="menu"
        aria-expanded=${this.open ? "true" : "false"}
        aria-label=${this.getAriaLabel()}
        ?disabled=${this.disabled}
      >
        <div id="button-content">${this.getButtonContent()}</div>
      </sp-action-button>
      <div id="menu-holder">
        <eomap-menu
          id="menu"
          role="menu"
          ?hidden=${!this.open}
          @pointerdown=${(event) => event.stopPropagation()}
        >
          <slot></slot>
        </eomap-menu>
      </div>
    `;
  }

  update(changedProperties) {
    if (changedProperties.has("open")) {
      this.manageOpen();
    }
    super.update(changedProperties);
  }

  manageOpen() {
    let menu = this.menu;

    if (!menu) {
      return;
    }

    if (this.open) {
      this.button.scrollIntoView({ block: "nearest" });
      this.buttonRect = this.button.getBoundingClientRect();

      let menuHeight = menu.getBoundingClientRect().height;
      this.updateDirection(
        menuHeight,
        this.buttonRect.top,
        this.buttonRect.height + this.menuTopOffset
      );

      let menuHolderRect = this.menuHolder.getBoundingClientRect();
      let top = -menuHolderRect.top;
      let left = -menuHolderRect.left + this.buttonRect.left;

      if (this.direction === "down") {
        top += this.buttonRect.bottom + this.menuTopOffset;
      } else {
        top += this.buttonRect.top - menuHeight - this.menuTopOffset;
      }

      menu.style.top = `${top}px`;
      menu.style.left = `${left}px`;

      requestAnimationFrame(() => this.checkButtonPosition());
    } else {
      menu.blur();
    }
  }

  checkButtonPosition() {
    let newButtonRect = this.button.getBoundingClientRect();
    if (
      newButtonRect.top !== this.buttonRect.top ||
      newButtonRect.left !== this.buttonRect.left
    ) {
      this.open = false;
    }

    if (this.open) {
      requestAnimationFrame(() => this.checkButtonPosition());
    }
  }

  updateDirection(menuHeight, buttonTop, buttonHeight) {
    if (
      menuHeight > window.innerHeight - buttonTop + buttonHeight &&
      menuHeight <= buttonTop
    ) {
      this.direction = "up";
    } else {
      this.direction = "down";
    }
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has("disabled") && this.disabled) {
      this.open = false;
    }
  }

  disconnectedCallback() {
    this.open = false;
    super.disconnectedCallback();
  }

  get focusElement() {
    if (this.open) {
      return this.menu;
    }
    return this.button;
  }

  get menuTopOffset() {
    return 0;
  }
}
