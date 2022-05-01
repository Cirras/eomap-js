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
        ::slotted(eomap-menu) {
          background-color: var(--spectrum-global-color-gray-200);
          border: 1px solid var(--spectrum-global-color-gray-100);
          position: absolute;
          top: -5px;
          animation: fadeIn 0.083s linear;
          z-index: 1000;
        }
        slot[hidden]::slotted(eomap-menu) {
          display: none;
          opacity: 0;
        }
        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
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
          top: 11px;
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

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has("open")) {
      this.setAttribute("aria-expanded", this.open);
    }
  }

  render() {
    return html`
      ${super.render()}
      <sp-icon-chevron100 class="arrow"></sp-icon-chevron100>
      <slot
        id="menu"
        name="menu"
        role="menu"
        ?hidden=${!this.open}
        @pointerdown=${(event) => event.stopPropagation()}
      >
      </slot>
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
    return this.assignedNodes && this.assignedNodes[0];
  }
}
