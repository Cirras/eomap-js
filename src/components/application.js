import { css, customElement, html, LitElement, state } from "lit-element";

import "@spectrum-web-components/theme/theme-darkest.js";
import "@spectrum-web-components/theme/scale-medium.js";
import "@spectrum-web-components/theme/sp-theme.js";

import "./menubar";
import "./sidebar";
import "./editor";
import "./palette";
import "./infobar";

import { TilePos } from "../tilepos";

@customElement("eomap-application")
export class Application extends LitElement {
  static get styles() {
    return css`
      sp-theme {
        --spectrum-divider-size: 1px;
        background-color: var(--spectrum-global-color-gray-200);
        color: var(--spectrum-global-color-gray-800);
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-rows: min-content 1fr;
        grid-template-columns: min-content minmax(0, 1fr) min-content;
        grid-row-gap: var(--spectrum-divider-size);
        grid-column-gap: var(--spectrum-divider-size);
        overflow: hidden;
      }

      eomap-menubar {
        grow-row: 1 / 2;
        grid-column: 1 / 3;
      }

      eomap-sidebar {
        grid-row: 2 / 5;
        grid-column: 1;
      }

      eomap-editor {
        grid-row: 2 / 4;
        grid-column: 2;
      }

      eomap-palette {
        grid-row: 2 / 5;
        grid-column: 3;
      }

      eomap-infobar {
        grid-row: 4 / 5;
        grid-column: 2;
      }
    `;
  }

  @state({ type: String })
  tool = "draw";

  @state({ type: Object })
  currentPos = new TilePos();

  @state({ type: Array })
  layerVisibility = Array(11).fill(true);

  constructor() {
    super();
    this.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "ArrowDown":
        case "ArrowUp":
        case "ArrowLeft":
        case "ArrowRight":
          document.activeElement.blur();
          break;
        default:
          return;
      }
    });
  }

  render() {
    return html`
      <sp-theme color="darkest" scale="medium">
        <eomap-menubar
          .layerVisibility=${this.layerVisibility}
          @layer-toggle=${this.onLayerToggle}
        ></eomap-menubar>
        <eomap-sidebar
          @tool-selected=${this.onToolSelected}
          .tool="${this.tool}"
        ></eomap-sidebar>
        <eomap-editor
          .layerVisibility=${this.layerVisibility}
          .tool=${this.tool}
          @changedata-currentPos=${this.onCurrentPosChanged}
        ></eomap-editor>
        <eomap-palette></eomap-palette>
        <eomap-infobar .tilePos=${this.currentPos}></eomap-infobar>
      </sp-theme>
    `;
  }

  onLayerToggle(event) {
    let layer = event.detail;
    let newLayerVisibility = [...this.layerVisibility];
    newLayerVisibility[layer] = !newLayerVisibility[layer];

    this.layerVisibility = newLayerVisibility;
  }

  onToolSelected(event) {
    this.tool = event.detail;
  }

  onCurrentPosChanged(event) {
    this.currentPos = event.detail;
  }
}
