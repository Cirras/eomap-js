import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import "@spectrum-web-components/overlay/overlay-trigger.js";
import "@spectrum-web-components/field-group/sp-field-group.js";
import "@spectrum-web-components/field-label/sp-field-label.js";
import "@spectrum-web-components/textfield/sp-textfield.js";

import "./modal";
import "./number-field";

import { CHAR_MAX, SHORT_MAX } from "../data/eo-numeric-limits";

@customElement("eomap-entity-npc")
export class EntityNPC extends LitElement {
  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, reflect: true })
  headline;

  @query("#npc-id", true)
  id;

  @query("#amount", true)
  amount;

  @query("#speed", true)
  speed;

  @query("#spawn-time", true)
  spawnTime;

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
          confirm-label="Save"
          cancel-label="Cancel"
          .headline=${this.headline}
          .open=${this.open}
          @confirm=${this.confirm}
          @cancel=${this.cancel}
        >
          <style>
            sp-field-group {
              justify-content: center;
            }
          </style>
          <sp-field-group>
            <div>
              <sp-field-label for="npc-id">NPC ID</sp-field-label>
              <eomap-number-field
                id="npc-id"
                max="${SHORT_MAX - 1}"
              ></eomap-number-field>
            </div>
            <div>
              <sp-field-label for="amount">Amount</sp-field-label>
              <eomap-number-field
                id="amount"
                max="${CHAR_MAX - 1}"
              ></eomap-number-field>
            </div>
          </sp-field-group>
          <sp-field-group>
            <div>
              <sp-field-label for="speed">Speed</sp-field-label>
              <eomap-number-field
                id="speed"
                max="${CHAR_MAX - 1}"
              ></eomap-number-field>
            </div>
            <div>
              <sp-field-label for="spawn-time"> Spawn Time </sp-field-label>
              <eomap-number-field
                id="spawn-time"
                max="${SHORT_MAX - 1}"
              ></eomap-number-field>
            </div>
          </sp-field-group>
        </eomap-modal>
        <div slot="trigger"></div>
      </overlay-trigger>
    `;
  }

  reset() {
    this.id.value = undefined;
    this.id.invalid = false;
    this.amount.value = undefined;
    this.amount.invalid = false;
    this.speed.value = undefined;
    this.speed.invalid = false;
    this.spawnTime.value = undefined;
    this.spawnTime.invalid = false;
  }

  populate(npc) {
    this.reset();
    this.id.value = npc.id;
    this.amount.value = npc.amount;
    this.speed.value = npc.spawnType;
    this.spawnTime.value = npc.spawnTime;
  }

  validateRequired(field) {
    field.invalid = isNaN(field.value);
  }

  validateFields() {
    this.validateRequired(this.id);
    this.validateRequired(this.amount);
    this.validateRequired(this.speed);
    this.validateRequired(this.spawnTime);

    return (
      !this.id.invalid &&
      !this.amount.invalid &&
      !this.speed.invalid &&
      !this.spawnTime.invalid
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
            speed: this.speed.value,
            spawnTime: this.spawnTime.value,
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
