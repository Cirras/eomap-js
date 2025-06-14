import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import "@spectrum-web-components/field-group/sp-field-group.js";
import "@spectrum-web-components/field-label/sp-field-label.js";

import "./modal";
import "./number-field";

import { CHAR_MAX, SHORT_MAX, THREE_MAX } from "../data/eo-numeric-limits";

@customElement("eomap-entity-item")
export class EntityItem extends LitElement {
  @query("#item-id", true)
  id;

  @query("#amount", true)
  amount;

  @query("#spawn-time", true)
  spawnTime;

  @query("#chest-slot", true)
  chestSlot;

  @query("#key", true)
  key;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, reflect: true })
  headline;

  render() {
    return html`
      <eomap-modal
        confirm-label="Save"
        cancel-label="Cancel"
        .headline=${this.headline}
        .open=${this.open}
        @confirm=${this.confirm}
        @cancel=${this.cancel}
        @close=${this.close}
      >
        <style>
          sp-field-group {
            justify-content: center;
          }
        </style>
        <sp-field-group>
          <div>
            <sp-field-label for="item-id">Item ID</sp-field-label>
            <eomap-number-field
              id="item-id"
              max="${SHORT_MAX - 1}"
            ></eomap-number-field>
          </div>
          <div>
            <sp-field-label for="amount">Amount</sp-field-label>
            <eomap-number-field
              id="amount"
              max="${THREE_MAX - 1}"
            ></eomap-number-field>
          </div>
        </sp-field-group>
        <sp-field-group>
          <div>
            <sp-field-label for="spawn-time">Spawn Time</sp-field-label>
            <eomap-number-field
              id="spawn-time"
              max="${SHORT_MAX - 1}"
            ></eomap-number-field>
          </div>
          <div>
            <sp-field-label for="chest-slot">Chest Slot</sp-field-label>
            <eomap-number-field
              id="chest-slot"
              max="${CHAR_MAX - 1}"
            ></eomap-number-field>
          </div>
        </sp-field-group>
        <div>
          <sp-field-label for="key">Key</sp-field-label>
          <eomap-number-field
            id="key"
            max="${SHORT_MAX - 1}"
          ></eomap-number-field>
        </div>
      </eomap-modal>
    `;
  }

  reset() {
    this.id.value = undefined;
    this.id.invalid = false;
    this.amount.value = undefined;
    this.amount.invalid = false;
    this.spawnTime.value = undefined;
    this.spawnTime.invalid = false;
    this.chestSlot.value = undefined;
    this.chestSlot.invalid = false;
    this.key.value = 0;
    this.key.invalid = false;
  }

  populate(item) {
    this.reset();
    this.id.value = item.id;
    this.amount.value = item.amount;
    this.spawnTime.value = item.spawnTime;
    this.chestSlot.value = item.chestSlot;
    this.key.value = item.key;
  }

  validateRequired(field) {
    field.invalid = isNaN(field.value);
  }

  validateFields() {
    this.validateRequired(this.id);
    this.validateRequired(this.amount);
    this.validateRequired(this.spawnTime);
    this.validateRequired(this.chestSlot);
    this.validateRequired(this.key);

    return (
      !this.id.invalid &&
      !this.amount.invalid &&
      !this.spawnTime.invalid &&
      !this.chestSlot.invalid &&
      !this.key.invalid
    );
  }

  confirm(_event) {
    if (this.validateFields()) {
      this.open = false;
      this.dispatchEvent(
        new CustomEvent("save", {
          detail: {
            id: this.id.value,
            amount: this.amount.value,
            spawnTime: this.spawnTime.value,
            chestSlot: this.chestSlot.value,
            key: this.key.value,
          },
        }),
      );
    }
  }

  cancel(_event) {
    this.open = false;
  }

  close(_event) {
    this.open = false;
    this.dispatchEvent(new CustomEvent("close"));
  }
}
