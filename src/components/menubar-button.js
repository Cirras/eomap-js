import { customElement, property } from "lit/decorators.js";
import { css } from "@spectrum-web-components/base";

import "./menu";
import { Dropdown } from "./dropdown";

@customElement("eomap-menubar-button")
export class MenuBarButton extends Dropdown {
  static get styles() {
    return [
      ...super.styles,
      css`
        #button {
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
          --spectrum-actionbutton-focus-ring-size: 0px;
          --spectrum-actionbutton-quiet-textonly-border-radius: 0px;
        }
      `,
    ];
  }

  @property({ type: Boolean })
  autofocus = false;

  quiet = true;

  onButtonPointerEnter = (_event) => {
    this.dispatchEvent(new CustomEvent("button-pointerenter"));
  };

  onButtonPointerDown = (event) => {
    event.stopPropagation();
    this.dispatchEvent(new CustomEvent("button-pointerdown"));
  };

  firstUpdated(_changes) {
    super.firstUpdated();
    this.button.tabIndex = -1;
    this.button.addEventListener("pointerenter", this.onButtonPointerEnter);
    this.button.addEventListener("pointerdown", this.onButtonPointerDown);
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has("open") && this.open && this.autofocus) {
      this.focus();
    }
  }
}
