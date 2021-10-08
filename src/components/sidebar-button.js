import "@spectrum-web-components/action-button/sp-action-button";
import "@spectrum-web-components/icon/sp-icon";
import "@spectrum-web-components/overlay/overlay-trigger";
import "@spectrum-web-components/overlay/src/popper";
import "@spectrum-web-components/tooltip/sp-tooltip";
import { css, customElement, html, LitElement, property } from "lit-element";

@customElement("eomap-sidebar-button")
export class SidebarButton extends LitElement {
  static get styles() {
    return css`
      sp-action-button {
        --spectrum-actionbutton-m-icon-color-disabled: var(
          --spectrum-global-color-gray-300
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
          style="--spectrum-tooltip-background-color: var(--spectrum-global-color-gray-200);"
          slot="hover-content"
          open
        >
          ${this.label}
        </sp-tooltip>
      </overlay-trigger>
    `;
  }
}
