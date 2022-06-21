import { html, LitElement } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";

import "@spectrum-web-components/overlay/overlay-trigger.js";
import "@spectrum-web-components/field-group/sp-field-group.js";
import "@spectrum-web-components/field-label/sp-field-label.js";
import "@spectrum-web-components/checkbox/sp-checkbox.js";

import "./modal";
import "./number-field";

import { CHAR_MAX, SHORT_MAX } from "../data/eo-numeric-limits";

@customElement("eomap-entity-warp")
export class EntityWarp extends LitElement {
  @query("#map", true)
  map;

  @query("#x", true)
  x;

  @query("#y", true)
  y;

  @query("#level", true)
  level;

  @query("#key", true)
  key;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, reflect: true })
  headline;

  @state({ type: Boolean })
  isDoor = false;

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
              <sp-field-label for="map">Map</sp-field-label>
              <eomap-number-field
                id="map"
                max="${SHORT_MAX - 1}"
              ></eomap-number-field>
            </div>
            <div>
              <sp-field-label for="x">X</sp-field-label>
              <eomap-number-field
                id="x"
                max="${CHAR_MAX - 1}"
              ></eomap-number-field>
            </div>
            <div>
              <sp-field-label for="y">Y</sp-field-label>
              <eomap-number-field
                id="y"
                max="${CHAR_MAX - 1}"
              ></eomap-number-field>
            </div>
          </sp-field-group>
          <sp-field-group>
            <div>
              <sp-field-label for="level"> Level </sp-field-label>
              <eomap-number-field
                id="level"
                max="${CHAR_MAX - 1}"
              ></eomap-number-field>
            </div>
            <div>
              <sp-field-label for="key">Key</sp-field-label>
              <eomap-number-field
                id="key"
                max="${SHORT_MAX - 1}"
                .disabled=${!this.isDoor}
              ></eomap-number-field>
            </div>
            <div>
              <sp-field-label for="door">Door</sp-field-label>
              <sp-checkbox
                id="door"
                style="width: var(--spectrum-global-dimension-size-1200);"
                emphasized
                .checked=${this.isDoor}
                @click=${(_event) => {
                  if (isNaN(this.key.value)) {
                    this.key.value = 0;
                    this.key.invalid = false;
                  }
                  this.isDoor = !this.isDoor;
                }}
              >
              </sp-checkbox>
            </div>
          </sp-field-group>
        </eomap-modal>
        <div slot="trigger"></div>
      </overlay-trigger>
    `;
  }

  onFieldChange(event) {
    event.target.invalid = false;
  }

  reset() {
    this.map.value = undefined;
    this.map.invalid = false;
    this.x.value = undefined;
    this.x.invalid = false;
    this.y.value = undefined;
    this.y.invalid = false;
    this.level.value = 0;
    this.level.invalid = false;
    this.key.value = 0;
    this.key.invalid = false;
    this.isDoor = false;
  }

  populate(warp) {
    this.reset();
    this.map.value = warp.map;
    this.x.value = warp.x;
    this.y.value = warp.y;
    this.level.value = warp.level;
    this.key.value = Math.max(0, warp.door - 1);
    this.isDoor = warp.door > 0;
  }

  validateRequired(field) {
    field.invalid = isNaN(field.value);
  }

  validateFields() {
    this.validateRequired(this.map);
    this.validateRequired(this.x);
    this.validateRequired(this.y);
    this.validateRequired(this.level);
    this.validateRequired(this.key);

    return (
      !this.map.invalid &&
      !this.x.invalid &&
      !this.y.invalid &&
      !this.level.invalid &&
      !this.key.invalid
    );
  }

  confirm(_event) {
    if (this.validateFields()) {
      this.open = false;
      this.dispatchEvent(
        new CustomEvent("save", {
          detail: {
            map: this.map.value,
            x: this.x.value,
            y: this.y.value,
            level: this.level.value,
            door: this.isDoor ? this.key.value + 1 : 0,
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
