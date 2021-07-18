import { css, customElement, html, LitElement, property } from "lit-element";
import "./menubar";
import "./sidebar";
import "./editor";
import "./infobar";

import "@spectrum-web-components/theme/theme-darkest.js";
import "@spectrum-web-components/theme/scale-medium.js";
import "@spectrum-web-components/theme/sp-theme.js";

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
        grid-template-columns: min-content 1fr min-content;
        grid-row-gap: var(--spectrum-divider-size);
        grid-column-gap: var(--spectrum-divider-size);
        overflow: hidden;
      }

      eomap-menubar {
        grow-row: 1 / 2;
        grid-column: 1 / 4;
      }

      eomap-sidebar {
        grid-row: 2 / 5;
        grid-column: 1 / 1;
      }

      eomap-editor {
        grid-row: 2 / 4;
        grid-column: 2 / 4;
      }

      eomap-infobar {
        grid-row: 4 / 5;
        grid-column: 2 / 4;
      }
    `;
  }

  render() {
    return html`
      <sp-theme color="darkest" scale="medium">
        <eomap-menubar></eomap-menubar>
        <eomap-sidebar></eomap-sidebar>
        <eomap-editor></eomap-editor>
        <eomap-infobar></eomap-infobar>
      </sp-theme>
    `;
  }
}
