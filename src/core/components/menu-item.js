import { css } from "@spectrum-web-components/base";
import { customElement } from "lit/decorators.js";

import { MenuItem as SpectrumMenuItem } from "@spectrum-web-components/menu/src/MenuItem.js";

@customElement("eomap-menu-item")
export class MenuItem extends SpectrumMenuItem {
  static get styles() {
    return [
      super.styles,
      css`
        :host {
          height: 26px;
          min-height: 26px;
          cursor: unset;
          --spectrum-listitem-texticon-padding-y: 4px;
          --spectrum-listitem-texticon-ui-icon-margin-top: 7px;
          --spectrum-listitem-texticon-text-size: 13px;
          --spectrum-listitem-m-texticon-focus-indicator-color: transparent;
          --spectrum-listitem-m-texticon-text-color-key-focus: var(
            --spectrum-listitem-m-texticon-text-color,
            var(--spectrum-alias-component-text-color-default)
          );
          --spectrum-listitem-m-texticon-text-color-hover: var(
            --spectrum-listitem-m-texticon-text-color,
            var(--spectrum-alias-component-text-color-default)
          );
        }
        :host(:not([focused])) {
          --spectrum-listitem-m-texticon-background-color-hover: var(
            --spectrum-listitem-m-texticon-background-color,
            var(--spectrum-alias-background-color-transparent)
          );
          --spectrum-listitem-m-texticon-background-color-down: var(
            --spectrum-listitem-m-texticon-background-color,
            var(--spectrum-alias-background-color-transparent)
          );
        }
        ::slotted([slot="value"]) {
          font-family: var(--spectrum-alias-body-text-font-family);
          font-size: 13px;
          color: var(--spectrum-global-color-gray-600);
          padding-left: 15px;
          pointer-events: none;
        }
        :host([disabled]) ::slotted([slot="value"]) {
          color: var(
            --spectrum-listitem-m-texticon-text-color-disabled,
            var(--spectrum-alias-component-text-color-disabled)
          );
        }
        :host([disabled]) .checkmark {
          color: var(
            --spectrum-listitem-m-texticon-text-color-disabled,
            var(--spectrum-alias-component-text-color-disabled)
          );
        }
        :host([role="menuitemcheckbox"]:not([selected]))
          ::slotted([slot="value"]) {
          padding-right: calc(
            var(--spectrum-alias-ui-icon-checkmark-size-100) +
              var(--spectrum-listitem-texticon-icon-gap) - 1px
          );
        }
      `,
    ];
  }
}
