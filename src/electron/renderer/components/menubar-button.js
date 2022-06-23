import { customElement, property } from "lit/decorators.js";
import { html, css } from "@spectrum-web-components/base";

import "../../../core/components/menu";
import "../../../core/components/mnemonic-label";
import { Dropdown } from "../../../core/components/dropdown";

import { MnemonicData } from "../../../core/util/mnemonic-data";

@customElement("eomap-menubar-button")
export class MenubarButton extends Dropdown {
  static get styles() {
    return [
      ...super.styles,
      css`
        #button {
          cursor: unset;
          --spectrum-actionbutton-quiet-textonly-text-size: 13px;
          --spectrum-actionbutton-textonly-height: var(
            --eomap-menubar-button-height,
            30px
          );
          --spectrum-actionbutton-textonly-padding-left-adjusted: var(
            --spectrum-global-dimension-size-100
          );
          --spectrum-actionbutton-textonly-padding-right-adjusted: var(
            --spectrum-global-dimension-size-100
          );
          --spectrum-actionbutton-m-quiet-textonly-background-color-hover: var(
            --spectrum-alias-component-background-color-quiet-down
          );
          --spectrum-actionbutton-m-quiet-textonly-background-color-selected: var(
            --spectrum-alias-component-background-color-quiet-down
          );
          --spectrum-actionbutton-m-quiet-textonly-background-color-selected-hover: var(
            --spectrum-alias-component-background-color-quiet-down
          );
          --spectrum-actionbutton-m-quiet-textonly-background-color-selected-down: var(
            --spectrum-alias-component-background-color-quiet-down
          );
          --spectrum-actionbutton-m-quiet-textonly-background-color-selected-key-focus: var(
            --spectrum-alias-component-background-color-quiet-down
          );
          --spectrum-actionbutton-m-quiet-textonly-border-color-key-focus: var(
            --spectrum-alias-component-border-color-quiet-default
          );
          --spectrum-actionbutton-m-quiet-textonly-border-color-selected: var(
            --spectrum-alias-component-border-color-quiet-down
          );
          --spectrum-actionbutton-m-quiet-textonly-border-color-selected-down: var(
            --spectrum-alias-component-border-color-quiet-down
          );
          --spectrum-actionbutton-m-quiet-textonly-border-color-selected-hover: var(
            --spectrum-alias-component-border-color-quiet-down
          );
          --spectrum-actionbutton-m-quiet-textonly-border-color-selected-key-focus: var(
            --spectrum-alias-component-border-color-quiet-down
          );
          --spectrum-actionbutton-m-quiet-textonly-text-color-down: var(
            --spectrum-alias-component-text-color-default
          );
          --spectrum-actionbutton-m-quiet-textonly-text-color-hover: var(
            --spectrum-alias-component-text-color-default
          );
          --spectrum-actionbutton-m-quiet-textonly-text-color-key-focus: var(
            --spectrum-alias-component-text-color-default
          );
          --spectrum-actionbutton-m-quiet-textonly-text-color-selected-down: var(
            --spectrum-alias-component-text-color-default
          );
          --spectrum-actionbutton-m-quiet-textonly-text-color-selected-hover: var(
            --spectrum-alias-component-text-color-default
          );
          --spectrum-actionbutton-m-quiet-textonly-text-color-selected: var(
            --spectrum-alias-component-text-color-default
          );
          --spectrum-actionbutton-m-quiet-textonly-text-color-selected-key-focus: var(
            --spectrum-alias-component-text-color-default
          );
          --spectrum-actionbutton-focus-ring-size: 2px;
        }
        #button::after {
          inset: 2px;
          border-radius: 3px;
          box-shadow: unset !important;
        }
        :host([focused]) #button {
          --spectrum-actionbutton-m-quiet-textonly-background-color: var(
            --spectrum-alias-component-background-color-quiet-down
          );
          --spectrum-actionbutton-m-quiet-textonly-background-color-key-focus: var(
            --spectrum-alias-component-background-color-quiet-down
          );
        }
        :host([focused]:not([open])) #button::after {
          box-shadow: 0 0 0 var(--spectrum-actionbutton-focus-ring-size)
            var(--spectrum-actionbutton-focus-ring-color) !important;
        }
      `,
    ];
  }

  @property({ type: Boolean })
  autofocus = false;

  @property({ type: Number })
  menuWidth = null;

  @property({ type: Boolean })
  showMnemonics = false;

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
    this.requestUpdate();
  }

  _label = "";
  _mnemonicData = new MnemonicData("");

  constructor() {
    super();
    this.quiet = true;
  }

  onButtonPointerEnter = (_event) => {
    this.dispatchEvent(new CustomEvent("button-pointerenter"));
  };

  onButtonPointerDown = (event) => {
    event.stopPropagation();
    this.dispatchEvent(new CustomEvent("button-pointerdown"));
  };

  onButtonPointerUp = (event) => {
    event.stopPropagation();
    this.dispatchEvent(new CustomEvent("button-pointerup"));
  };

  firstUpdated(_changes) {
    super.firstUpdated();
    this.button.tabIndex = -1;
    this.button.addEventListener("pointerenter", this.onButtonPointerEnter);
    this.button.addEventListener("pointerdown", this.onButtonPointerDown);
    this.button.addEventListener("pointerup", this.onButtonPointerUp);
  }

  updated(changed) {
    super.updated(changed);

    if (changed.has("open") && this.open && this.autofocus) {
      this.focus();
    }

    if (changed.has("menuWidth")) {
      if (this.menuWidth !== null) {
        this.menu.style.width = `${this.menuWidth}px`;
      } else {
        this.menu.style.width = "";
      }
    }

    if (changed.has("showMnemonics") || changed.has("open")) {
      this.menu.showMnemonics = this.showMnemonics && this.open;
    }
  }

  renderLabel() {
    return html`
      <eomap-mnemonic-label
        .data=${this._mnemonicData}
        .showMnemonics=${this.showMnemonics}
      ></eomap-mnemonic-label>
    `;
  }

  getAriaLabel() {
    return this._mnemonicData.string;
  }

  focus(options) {
    super.focus(options);
    this.focused = true;
  }

  blur() {
    this.focused = false;
    this.button.blur();
  }

  hasMnemonic(key) {
    if (this._mnemonicData.mnemonic === null) {
      return false;
    }
    return this._mnemonicData.mnemonic.toUpperCase() === key.toUpperCase();
  }
}
