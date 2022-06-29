import { css, html } from "@spectrum-web-components/base";
import { customElement, property, queryAssignedNodes } from "lit/decorators.js";

import "@spectrum-web-components/icon/sp-icon.js";

import { MenuItem } from "./menu-item";

@customElement("eomap-submenu-item")
export class SubmenuItem extends MenuItem {
  static get styles() {
    return [
      ...super.styles,
      css`
        :host {
          padding-right: var(--spectrum-global-dimension-size-400);
        }
        ::slotted(eomap-menu) {
          background-color: var(--spectrum-global-color-gray-200);
          border: 1px solid var(--spectrum-global-color-gray-100);
          position: absolute;
          top: -5px;
          z-index: 1000;
        }
        :host([:not([open])]) #menu-container {
          visibility: hidden;
        }
        :host([open]) #menu-container {
          animation: fadeIn 0.083s linear;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .arrow {
          --spectrum-icon-tshirt-size-width: var(
            --spectrum-global-dimension-size-125
          );
          --spectrum-icon-tshirt-size-height: var(
            --spectrum-global-dimension-size-125
          );
          position: absolute;
          right: 11px;
          top: 8px;
        }
      `,
    ];
  }

  @queryAssignedNodes({ slot: "menu", flatten: true })
  assignedNodes;

  @property({ type: Boolean, reflect: true })
  open = false;

  resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      let menu = this.menu;
      if (menu) {
        menu.style.right = `-${entry.borderBoxSize[0].inlineSize}px`;
      }
    }
  });

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    this.resizeObserver.observe(this.menu);
    this.setAttribute("aria-controls", "menu");
  }

  updated(changed) {
    super.updated(changed);
    if (changed.has("open")) {
      this.setAttribute("aria-expanded", this.open);
    }
    if (changed.has("showMnemonics") || changed.has("open")) {
      let menu = this.menu;
      if (menu) {
        menu.showMnemonics = this.showMnemonics && this.open;
      }
    }
  }

  render() {
    return html`
      ${super.render()}
      <sp-icon-chevron100 class="arrow"></sp-icon-chevron100>
      <div id="menu-container">
        <slot
          id="menu"
          name="menu"
          role="menu"
          ?hidden=${!this.open}
          @pointerdown=${(event) => event.stopPropagation()}
        >
        </slot>
      </div>
    `;
  }

  disconnectedCallback() {
    this.open = false;
    super.disconnectedCallback();
  }

  get focusElement() {
    if (this.open && this.menu) {
      return this.menu;
    }
    return this;
  }

  get menu() {
    return this.assignedNodes[0] ?? null;
  }
}
