import "@spectrum-web-components/action-button/sp-action-button";
import "@spectrum-web-components/icon/sp-icon";
import "@spectrum-web-components/overlay/overlay-trigger";
import "@spectrum-web-components/overlay/src/popper";
import "@spectrum-web-components/tooltip/sp-tooltip";
import { customElement, html, LitElement, property } from "lit-element";

@customElement("eomap-sidebar-button")
export class SidebarButton extends LitElement {
  @property()
  label = "";

  @property({ attribute: false })
  icon = undefined;

  @property({ type: Boolean })
  selected = false;

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
