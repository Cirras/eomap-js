import { css, customElement, html } from "lit-element";

import { Picker as SpectrumPicker } from "@spectrum-web-components/picker";

@customElement("eomap-picker")
export class Picker extends SpectrumPicker {
  static get styles() {
    return [
      ...super.styles,
      css`
        :host {
          --spectrum-picker-m-background-color: var(
            --spectrum-global-color-gray-50
          );
          --spectrum-picker-m-background-color-hover: var(
            --spectrum-global-color-gray-75
          );
          --spectrum-picker-m-background-color-down: var(
            --spectrum-global-color-gray-100
          );
        }
      `,
    ];
  }

  manageSelection() {
    let selectedItem;
    this.menuItems.forEach((item) => {
      if (this.value === item.value && !item.disabled) {
        selectedItem = item;
      } else {
        item.selected = false;
      }
    });
    if (selectedItem) {
      selectedItem.selected = !!this.selects;
      this.selectedItem = selectedItem;
    } else {
      this.selectedItem = undefined;
    }
    if (this.open) {
      this.optionsMenu.updateComplete.then(() => {
        this.optionsMenu.updateSelectedItemIndex();
      });
    }
  }

  renderLabelContent(content) {
    if (this.value) {
      if (this.selectedItem) {
        return content;
      } else {
        return "Unknown (" + this.value + ")";
      }
    }
    return html` <slot name="label">${this.label}</slot> `;
  }
}
