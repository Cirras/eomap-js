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
        #menu {
          margin-top: 31px;
          background-color: var(--spectrum-global-color-gray-200);
          border: 1px solid var(--spectrum-global-color-gray-100);
          position: absolute;
          z-index: 1000;
        }
        :host([quiet]) #menu {
          margin-top: 32px;
        }
        #menu[hidden] {
          display: none;
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

  getButtonContent() {
    return html`
      <span id="label">
        <slot name="label">${this.getLabel()}</slot>
      </span>
    `;
  }

  getLabel() {
    return this.label;
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
        aria-label=${this.label}
        ?disabled=${this.disabled}
      >
        <div id="button-content">${this.getButtonContent()}</div>
      </sp-action-button>
      <eomap-menu
        id="menu"
        ?hidden=${!this.open}
        @pointerdown=${(event) => event.stopPropagation()}
      >
        <slot></slot>
      </eomap-menu>
    `;
  }

  update(changedProperties) {
    super.update(changedProperties);
    if (changedProperties.has("open")) {
      if (!this.open) {
        this.menu.blur();
      }
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
}
