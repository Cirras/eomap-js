import { css, customElement, html, LitElement } from "lit-element";

import "@spectrum-web-components/divider/sp-divider.js";

@customElement("eomap-infobar")
export class InfoBar extends LitElement {
  static get styles() {
    return css`
      footer {
        background-color: var(--spectrum-global-color-gray-400);
        color: var(--spectrum-global-color-gray-700);
        font-family: var(--spectrum-global-font-family-code);
        font-size: var(--spectrum-global-dimension-font-size-75);
        display: flex;
        position: relative;
        box-sizing: border-box;
        width: 100%;
      }
      .filler {
        flex-grow: 1;
      }
      .loc {
        width: 55px;
        background-color: var(--spectrum-global-color-gray-300);
        white-space: nowrap;
        overflow: auto;
      }
      .loc-axis {
        font-weight: var(--spectrum-global-font-weight-semi-bold);
        border-left: var(--spectrum-alias-border-size-thin) solid
          var(--spectrum-global-color-gray-200);
        border-right: var(--spectrum-alias-border-size-thin) solid
          var(--spectrum-global-color-gray-200);
        padding-left: var(--spectrum-global-dimension-size-75);
        padding-right: var(--spectrum-global-dimension-size-75);
        padding-top: var(--spectrum-global-dimension-size-25);
        padding-bottom: var(--spectrum-global-dimension-size-25);
        display: inline-block;
      }
      .loc-value {
        padding-right: var(--spectrum-global-dimension-size-25);
        padding-bottom: var(--spectrum-global-dimension-size-25);
        display: inline-block;
      }
    `;
  }

  render() {
    return html`
      <footer>
        <div class="filler"></div>
        <div class="loc">
          <div class="loc-axis">X</div>
          <div class="loc-value">0</div>
        </div>
        <div class="loc">
          <div class="loc-axis">Y</div>
          <div class="loc-value">0</div>
        </div>
      </footer>
    `;
  }
}
