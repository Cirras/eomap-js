import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

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
        height: 18px;
        contain: strict style;
        overflow: hidden;
      }
      .filler {
        flex-grow: 1;
      }
      .loc {
        background-color: var(--spectrum-global-color-gray-300);
        width: 110px;
        height: 18px;
        display: flex;
        contain: strict style;
        overflow: hidden;
      }
      .loc-box {
        width: 55px;
        height: 18px;
        white-space: nowrap;
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
        padding-right: var(--spectrum-global-dimension-size-75);
        display: inline-block;
      }
    `;
  }

  @property({ type: Object })
  tilePos;

  render() {
    return html`
      <footer>
        <div class="filler"></div>
        <div class="loc">
          <div class="loc-box">
            <div class="loc-axis">X</div>
            <div class="loc-value">
              ${this.tilePos.valid ? this.tilePos.x : ""}
            </div>
          </div>
          <div class="loc-box">
            <div class="loc-axis">Y</div>
            <div class="loc-value">
              ${this.tilePos.valid ? this.tilePos.y : ""}
            </div>
          </div>
        </div>
      </footer>
    `;
  }
}
