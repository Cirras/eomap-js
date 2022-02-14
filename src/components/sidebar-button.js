import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import "@spectrum-web-components/action-button/sp-action-button";
import "@spectrum-web-components/icon/sp-icon";
import "@spectrum-web-components/overlay/overlay-trigger";
import "@spectrum-web-components/tooltip/sp-tooltip";

@customElement("eomap-sidebar-button")
export class SidebarButton extends LitElement {
  static get styles() {
    return css`
      sp-action-button {
        --spectrum-actionbutton-m-texticon-icon-color-disabled: var(
          --spectrum-global-color-gray-300
        );
        --spectrum-actionbutton-m-texticon-icon-color-selected: var(
          --spectrum-alias-component-icon-color-default
        );
      }
      sp-action-button[quiet]:focus-visible {
        --spectrum-actionbutton-m-quiet-textonly-border-color-selected-hover: var(
          --spectrum-alias-component-border-color-quiet-selected-key-focus
        );
        --spectrum-actionbutton-m-quiet-textonly-border-color-down: var(
          --spectrum-alias-component-border-color-quiet-selected-key-focus
        );
        --spectrum-actionbutton-m-quiet-textonly-border-color-selected-down: var(
          --spectrum-alias-component-border-color-quiet-selected-key-focus
        );
      }
    `;
  }

  @property()
  label = "";

  @property({ attribute: false })
  icon = undefined;

  @property({ type: Boolean })
  selected = false;

  @property({ type: Boolean })
  disabled = false;

  @property()
  value = "";

  render() {
    return html`
      <overlay-trigger placement="right"">
        <sp-action-button
          quiet=true
          label=${this.label}
          slot="trigger"
          ?selected=${this.selected}
          ?disabled=${this.disabled}
          value=${this.value}
        >
          <sp-icon slot="icon">${this.icon()}</sp-icon>
        </sp-action-button>
        <sp-tooltip
          style="--spectrum-tooltip-background-color: var(--spectrum-global-color-gray-200); --spectrum-tooltip-neutral-background-color: var(--spectrum-global-color-gray-200);"
          slot="hover-content"
          open
        >
          ${this.label}
        </sp-tooltip>
      </overlay-trigger>
    `;
  }
}
