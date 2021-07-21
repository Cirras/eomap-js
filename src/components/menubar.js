import { css, customElement, html, LitElement, property } from "lit-element";

import "@spectrum-web-components/action-button/sp-action-button.js";
import "@spectrum-web-components/overlay/overlay-trigger.js";
import "@spectrum-web-components/popover/sp-popover.js";
import "@spectrum-web-components/menu/sp-menu.js";
import "@spectrum-web-components/menu/sp-menu-item.js";
import "@spectrum-web-components/menu/sp-menu-divider.js";
import "@spectrum-web-components/theme/theme-dark.js";
import "@spectrum-web-components/theme/scale-medium.js";
import "./menubar-button";

@customElement("eomap-menubar")
export class MenuBar extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
      }
      header {
        background-color: var(--spectrum-global-color-gray-200);
        display: flex;
        align-items: center;
        padding-left: var(--spectrum-global-dimension-size-100);
        padding-right: var(--spectrum-global-dimension-size-100);
        position: relative;
        width: 100%;
      }
    `;
  }

  @property({ type: Array })
  layerVisibility;

  renderViewMenu() {
    // prettier-ignore
    const MENU_ITEM_DATA = [
      { label: "Ground",     kbd: "Alt+1" },
      { label: "Objects",    kbd: "Alt+2" },
      { label: "Overlay",    kbd: "Alt+3" },
      { label: "Down Wall",  kbd: "Alt+4" },
      { label: "Right Wall", kbd: "Alt+5" },
      { label: "Roof",       kbd: "Alt+6" },
      { label: "Top",        kbd: "Alt+7" },
      { label: "Shadow",     kbd: "Alt+8" },
      { label: "Overlay 2",  kbd: "Alt+9" },
      { label: "Special",    kbd: "Alt+0" },
      { label: "Entities",   kbd: "Alt+E" },
    ];

    let menuItems = MENU_ITEM_DATA.map(
      (info, i) =>
        html`
          <sp-menu-item ?selected=${this.layerVisibility[i]} value=${i} @click=${this.onViewItemClick}">
            ${info.label}
            <kbd slot="value">${info.kbd}</kbd>
          </sp-menu-item>
        `
    );

    return html`
      <eomap-menubar-button>
        <span slot="label">View</span>
        ${menuItems}
      </eomap-menubar-button>
    `;
  }

  render() {
    return html`
      <header>
        <eomap-menubar-button>
          <span slot="label">File</span>
        </eomap-menubar-button>
        <eomap-menubar-button>
          <span slot="label">Edit</span>
        </eomap-menubar-button>
        ${this.renderViewMenu()}
        <eomap-menubar-button>
          <span slot="label">Help</span>
        </eomap-menubar-button>
      </header>
    `;
  }

  onViewItemClick(event) {
    this.dispatchEvent(
      new CustomEvent("layer-toggle", { detail: parseInt(event.target.value) })
    );
  }
}
