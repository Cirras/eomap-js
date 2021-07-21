import { customElement, css, html } from "@spectrum-web-components/base";
import { PickerBase } from "@spectrum-web-components/picker";
import "@spectrum-web-components/action-button/sp-action-button.js";

@customElement("eomap-menubar-button")
export class MenuBarButton extends PickerBase {
  static get styles() {
    return css`
      :host {
        display: inline-flex;
      }

      :host([quiet]) {
        min-width: 0;
      }

      #popover {
        width: auto;
        max-width: none;
        display: none;
      }
    `;
  }

  constructor() {
    super();
    this.onKeydown = () => {
      // Do nothing.
      // If this component is focused and closed, it swallows arrow inputs.
      // We want these to be handled by phaser instead.
    };
    this.listRole = "menu";
    this.itemRole = "menuitem";
  }

  get renderButton() {
    return html`
      <sp-action-button
        quiet
        ?selected=${this.open}
        aria-haspopup="true"
        aria-controls="popover"
        aria-expanded=${this.open ? "true" : "false"}
        aria-label=${this.label}
        id="button"
        class="button"
        size=${this.size}
        @blur=${this.onButtonBlur}
        @click=${this.onButtonClick}
        @focus=${this.onButtonFocus}
        ?disabled=${this.disabled}
      >
        <slot name="label"></slot>
      </sp-action-button>
    `;
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has("invalid")) {
      this.invalid = false;
    }
  }

  async setValueFromItem(item) {
    const oldSelectedItem = this.selectedItem;
    const oldValue = this.value;
    this.selectedItem = item;
    this.value = item.value;
    this.open = false;
    await this.updateComplete;
    const applyDefault = this.dispatchEvent(
      new Event("change", {
        cancelable: true,
      })
    );
    if (!applyDefault) {
      this.selectedItem = oldSelectedItem;
      this.value = oldValue;
      this.open = true;
    }
  }

  manageSelection() {
    if (!this.open) {
      this.updateMenuItems();
    }

    if (this.menuItems.length === 0) {
      return;
    }

    let selectedItem = undefined;
    for (let item of this.menuItems) {
      if (this.value === item.value && !item.disabled) {
        selectedItem = item;
        break;
      }
    }

    if (selectedItem) {
      this.selectedItem = selectedItem;
    } else {
      this.value = "";
      this.selectedItem = undefined;
    }

    if (this.open) {
      for (let item of this.optionsMenu.menuItems) {
        item.focused = false;
      }
      this.optionsMenu.focusedItemIndex = 0;
      this.optionsMenu.focusInItemIndex = 0;
    }
  }
}
