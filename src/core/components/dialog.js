import { css } from "lit";
import { customElement } from "lit/decorators.js";

import { Dialog as SpectrumDialog } from "@spectrum-web-components/dialog/src/Dialog.js";

import scrollbarStyles from "../styles/scrollbar";

@customElement("eomap-dialog")
export class Dialog extends SpectrumDialog {
  static get styles() {
    return [
      ...super.styles,
      scrollbarStyles,
      css`
        :host {
          --spectrum-dialog-confirm-overlay-background-color: rgba(
            0,
            0,
            0,
            0.75
          );
          --spectrum-button-m-secondary-texticon-background-color: var(
            --spectrum-global-color-gray-300
          );
          --spectrum-button-m-secondary-texticon-border-color: var(
            --spectrum-global-color-gray-300
          );
          --spectrum-button-m-secondary-texticon-background-color-hover: var(
            --spectrum-global-color-gray-400
          );
          --spectrum-button-m-secondary-texticon-border-color-hover: var(
            --spectrum-global-color-gray-400
          );
          --spectrum-button-m-secondary-texticon-background-color-down: var(
            --spectrum-global-color-gray-200
          );
          --spectrum-button-m-secondary-texticon-border-color-down: var(
            --spectrum-global-color-gray-200
          );
          --spectrum-button-m-secondary-texticon-background-color-key-focus: var(
            --spectrum-global-color-gray-300
          );
          --spectrum-button-m-secondary-texticon-border-color-key-focus: var(
            --spectrum-global-color-gray-300
          );
          --spectrum-button-m-secondary-texticon-text-color-down: var(
            --spectrum-global-color-gray-700
          );
          --spectrum-button-m-secondary-texticon-text-color-hover: var(
            --spectrum-global-color-gray-700
          );
          --spectrum-button-m-secondary-texticon-text-color-key-focus: var(
            --spectrum-global-color-gray-700
          );
        }
        .content {
          overflow: auto;
          scrollbar-gutter: stable;
          width: calc(100% + 33px);
          padding-right: 16px;
        }
      `,
    ];
  }
}
