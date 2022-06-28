import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import "@spectrum-web-components/overlay/overlay-trigger.js";
import "@spectrum-web-components/field-group/sp-field-group.js";
import "@spectrum-web-components/field-label/sp-field-label.js";

import "./modal";
import "./number-field";
import "./textfield";

import { CHAR_MAX } from "../data/eo-numeric-limits";

@customElement("eomap-new-map")
export class NewMap extends LitElement {
  @query("#width", true)
  width;

  @query("#height", true)
  height;

  @query("#name", true)
  name;

  @property({ type: Boolean, reflect: true })
  open = false;

  updated(changed) {
    if (changed.has("open")) {
      this.manageOpen();
    }
  }

  manageOpen() {
    if (this.open) {
      this.width.value = undefined;
      this.width.invalid = false;
      this.height.value = undefined;
      this.height.invalid = false;
      this.name.value = "";
    }
  }

  render() {
    return html`
      <overlay-trigger
        type="modal"
        placement="none"
        .open=${this.open ? "click" : "none"}
        @sp-closed=${this.closed}
      >
        <eomap-modal
          slot="click-content"
          underlay
          confirm-label="Confirm"
          cancel-label="Cancel"
          headline="New Map"
          .open=${this.open}
          @confirm=${this.confirm}
          @cancel=${this.cancel}
          @sp-closed=${(e) => e.stopPropagation()}
        >
          <style>
            eomap-textfield {
              --spectrum-textfield-texticon-min-width: 208px;
            }
            #name {
              padding-bottom: 1px;
            }
          </style>
          <sp-field-group>
            <div>
              <sp-field-label for="width">Width</sp-field-label>
              <eomap-number-field
                id="width"
                min="1"
                max="${CHAR_MAX - 1}"
              ></eomap-number-field>
            </div>
            <div>
              <sp-field-label for="height">Height</sp-field-label>
              <eomap-number-field
                id="height"
                min="1"
                max="${CHAR_MAX - 1}"
              ></eomap-number-field>
            </div>
          </sp-field-group>
          <sp-field-group>
            <div>
              <sp-field-label for="name">Name</sp-field-label>
              <eomap-textfield id="name" maxlength="24"></eomap-textfield>
            </div>
          </sp-field-group>
        </eomap-modal>
        <div slot="trigger"></div>
      </overlay-trigger>
    `;
  }

  validateRequired(field) {
    field.invalid = isNaN(field.value);
  }

  validateFields() {
    this.validateRequired(this.width);
    this.validateRequired(this.height);

    return !this.width.invalid && !this.height.invalid;
  }

  confirm(_event) {
    if (this.validateFields()) {
      this.open = false;
      this.dispatchEvent(
        new CustomEvent("confirm", {
          detail: {
            width: this.width.value,
            height: this.height.value,
            name: this.name.value,
          },
        })
      );
    }
  }

  cancel(_event) {
    this.open = false;
  }

  closed(event) {
    event.stopPropagation();
    this.open = false;
    this.dispatchEvent(new CustomEvent("close"));
  }
}
