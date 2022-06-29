import { css, html } from "@spectrum-web-components/base";
import {
  customElement,
  property,
} from "@spectrum-web-components/base/src/decorators.js";

import "@spectrum-web-components/icons-ui/icons/sp-icon-checkmark100.js";
import { Focusable } from "@spectrum-web-components/shared/src/focusable.js";

import menuItemStyles from "@spectrum-web-components/menu/src/menu-item.css.js";
import checkmarkStyles from "@spectrum-web-components/icon/src/spectrum-icon-checkmark.css.js";

import "./mnemonic-label";

import { MnemonicData } from "../util/mnemonic-data";

@customElement("eomap-menu-item")
export class MenuItem extends Focusable {
  static get styles() {
    return [
      menuItemStyles,
      checkmarkStyles,
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

  @property({ type: Boolean, reflect: true })
  focused = false;

  @property({ type: Boolean, reflect: true })
  selected = false;

  @property({ type: Boolean })
  showMnemonics = false;

  @property({ type: String })
  get value() {
    return this._value || this.displayLabel;
  }

  set value(value) {
    if (value === this._value) {
      return;
    }
    this._value = value || "";
    if (this._value) {
      this.setAttribute("value", this._value);
    } else {
      this.removeAttribute("value");
    }
    this.requestUpdate();
  }

  _value = "";

  @property({ type: String })
  get label() {
    return this._label;
  }

  set label(label) {
    if (label === this._label) {
      return;
    }
    this._label = label || "";
    this._mnemonicData = new MnemonicData(this._label);
    if (this.displayLabel) {
      this.setAttribute("aria-label", this.displayLabel);
    } else {
      this.removeAttribute("aria-label");
    }
    this.requestUpdate();
  }

  _label = "";
  _mnemonicData = new MnemonicData("");

  click() {
    if (this.disabled) {
      return;
    }
    super.click();
  }

  firstUpdated(changes) {
    super.firstUpdated(changes);
    this.setAttribute("tabindex", "-1");
  }

  renderCheckmark() {
    if (this.selected) {
      return html`
        <sp-icon-checkmark100
          id="selected"
          class="spectrum-UIIcon-Checkmark100 icon checkmark"
        ></sp-icon-checkmark100>
      `;
    }
  }

  render() {
    return html`
      <slot name="icon"></slot>
      <div id="label">
        <eomap-mnemonic-label
          .data=${this._mnemonicData}
          .showMnemonics=${this.showMnemonics}
        ></eomap-mnemonic-label>
      </div>
      <slot name="value"></slot>
      ${this.renderCheckmark()}
    `;
  }

  get focusElement() {
    return this;
  }

  get displayLabel() {
    return this._mnemonicData.string;
  }

  hasMnemonic(key) {
    if (this._mnemonicData.mnemonic === null) {
      return false;
    }
    return this._mnemonicData.mnemonic.toUpperCase() === key.toUpperCase();
  }
}
