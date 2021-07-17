import { css, customElement, html, LitElement } from "lit-element";

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

  render() {
    return html`
      <header>
        <eomap-menubar-button>
          <span slot="label">File</span>
        </eomap-menubar-button>
        <eomap-menubar-button>
          <span slot="label">Edit</span>
        </eomap-menubar-button>
        <eomap-menubar-button>
          <span slot="label">View</span>
          <sp-menu-item selected value="ground-layer">
            Ground
            <kbd slot="value">Alt+1</kbd>
          </sp-menu-item>
          <sp-menu-item selected value="objects-layer">
            Objects
            <kbd slot="value">Alt+2</kbd>
          </sp-menu-item>
          <sp-menu-item selected value="overlay-layer">
            Overlay
            <kbd slot="value">Alt+3</kbd>
          </sp-menu-item>
          <sp-menu-item selected value="down-wall-layer">
            Down Wall
            <kbd slot="value">Alt+4</kbd>
          </sp-menu-item>
          <sp-menu-item selected value="right-wall-layer">
            Right Wall
            <kbd slot="value">Alt+5</kbd>
          </sp-menu-item>
          <sp-menu-item selected value="roof-layer">
            Roof
            <kbd slot="value">Alt+6</kbd>
          </sp-menu-item>
          <sp-menu-item selected value="top-layer">
            Top
            <kbd slot="value">Alt+7</kbd>
          </sp-menu-item>
          <sp-menu-item selected value="shadow-layer">
            Shadow
            <kbd slot="value">Alt+8</kbd>
          </sp-menu-item>
          <sp-menu-item selected value="overlay-2-layer">
            Overlay 2
            <kbd slot="value">Alt+9</kbd>
          </sp-menu-item>
          <sp-menu-item selected value="special-layer">
            Special
            <kbd slot="value">Alt+0</kbd>
          </sp-menu-item>
        </eomap-menubar-button>
        <eomap-menubar-button>
          <span slot="label">Help</span>
        </eomap-menubar-button>
      </header>
    `;
  }
}
