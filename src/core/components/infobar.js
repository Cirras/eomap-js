import { css, html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import "@spectrum-web-components/divider/sp-divider.js";

import "./number-field";

import { TilePosState } from "../state/tilepos-state";

@customElement("eomap-infobar")
export class InfoBar extends LitElement {
  static get styles() {
    return css`
      footer {
        background-color: var(--spectrum-global-color-gray-400);
        color: var(--spectrum-global-color-gray-700);
        font-family: var(--spectrum-global-font-family-code);
        font-size: var(--spectrum-global-dimension-font-size-75);
        line-height: var(--spectrum-global-dimension-size-175);
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
        min-width: 1px;
      }
      .zoom {
        --spectrum-textfield-m-texticon-text-size: var(
          --spectrum-global-dimension-font-size-75
        );
        --spectrum-alias-body-text-font-family: var(
          --spectrum-global-font-family-code
        );
        --number-field-text-align: center;
        background-color: var(--spectrum-global-color-gray-300);
        width: 65px;
        height: 18px;
        flex-shrink: 0;
        contain: strict style;
        overflow: hidden;
        border-right: var(--spectrum-alias-border-size-thin) solid
          var(--spectrum-global-color-gray-200);
      }
      .loc {
        background-color: var(--spectrum-global-color-gray-300);
        min-width: 110px;
        height: 18px;
        display: flex;
        contain: strict style;
        overflow: hidden;
      }
      .loc-box {
        width: 55px;
        height: 18px;
        display: inline-block;
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

  @query("#zoom-field")
  zoomField;

  @property({ type: TilePosState })
  tilePos = new TilePosState();

  @property({ type: Number })
  zoom = null;

  updated(changedProperties) {
    if (changedProperties.has("zoom")) {
      let zoom = this.zoom;
      if (zoom === null) {
        zoom = NaN;
      }
      this.zoomField.value = zoom;
    }
  }

  render() {
    return html`
      <footer>
        <div class="zoom">
          <eomap-number-field
            id="zoom-field"
            min="0.25"
            max="16"
            format-options='{"style": "percent", "maximumFractionDigits": 2, "useGrouping": false}'
            quiet
            style="--spectrum-textfield-texticon-height: 18px;
                 --spectrum-textfield-quiet-texticon-padding-right: var(--spectrum-global-dimension-size-75);
                 --spectrum-textfield-quiet-texticon-padding-left: var(--spectrum-global-dimension-size-75);
                 --spectrum-textfield-texticon-padding-top: var(--spectrum-global-dimension-size-25);
                 --spectrum-textfield-texticon-padding-bottom: var(--spectrum-global-dimension-size-25);
                 --spectrum-textfield-quiet-texticon-border-bottom-size: 0px;
                 --spectrum-stepper-width: 100%;
                 --spectrum-textfield-m-texticon-text-color: var(--spectrum-global-color-gray-700);
                 --spectrum-textfield-m-textonly-focus-ring-border-color-key-focus: transparent;"
            .disabled=${this.zoom === null}
            @keydown=${this.onZoomKeyDown}
            @blur=${this.onZoomBlur}
          >
          </eomap-number-field>
        </div>
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

  onZoomKeyDown(event) {
    if (event.code === "Space") {
      return;
    }
    if (event.key === "Shift") {
      return;
    }
    if (event.key === "Enter") {
      document.activeElement.blur();
    }
    event.stopPropagation();
  }

  onZoomBlur(_event) {
    if (Number.isNaN(this.zoomField.value)) {
      this.zoomField.value = this.zoom;
    }
    if (this.zoomField.value !== this.zoom) {
      this.dispatchEvent(
        new CustomEvent("zoom-changed", { detail: this.zoomField.value }),
      );
    }
  }
}
