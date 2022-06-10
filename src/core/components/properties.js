import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import "@spectrum-web-components/overlay/overlay-trigger.js";
import "@spectrum-web-components/field-group/sp-field-group.js";
import "@spectrum-web-components/field-label/sp-field-label.js";
import "@spectrum-web-components/switch/sp-switch.js";
import "@spectrum-web-components/accordion/sp-accordion-item.js";

import "./accordion";
import "./modal";
import "./number-field";
import "./picker";
import "./textfield";
import "./menu-item";
import "./menu-divider";

import { CHAR_MAX, SHORT_MAX } from "../data/eo-numeric-limits";
import { MapEffect, MapType, MusicControl } from "../data/emf";
import { MapPropertiesState } from "../state/map-properties-state";

@customElement("eomap-properties")
export class Properties extends LitElement {
  @query("eomap-accordion")
  accordion;

  @query("#width", true)
  width;

  @query("#height", true)
  height;

  @query("#name", true)
  name;

  @query("#type", true)
  type;

  @query("#effect", true)
  effect;

  @query("#minimap", true)
  minimap;

  @query("#scrolls", true)
  scrolls;

  @query("#music", true)
  music;

  @query("#ambient-sound", true)
  ambientSound;

  @query("#music-control", true)
  musicControl;

  @query("#respawn-x", true)
  respawnX;

  @query("#respawn-y", true)
  respawnY;

  @property({ type: Boolean, reflect: true })
  open = false;

  updated(changed) {
    if (changed.has("open")) {
      this.manageOpen();
    }
  }

  manageOpen() {
    if (this.open) {
      this.accordion.expand();
    }
  }

  renderGeneral() {
    return html`
      <sp-field-group>
        <div>
          <sp-field-label for="name">Name</sp-field-label>
          <eomap-textfield id="name" maxlength="24"></eomap-textfield>
        </div>
        <div>
          <sp-field-label for="width">Width</sp-field-label>
          <eomap-number-field
            id="width"
            max="${CHAR_MAX - 1}"
          ></eomap-number-field>
        </div>
        <div>
          <sp-field-label for="height">Height</sp-field-label>
          <eomap-number-field
            id="height"
            max="${CHAR_MAX - 1}"
          ></eomap-number-field>
        </div>
      </sp-field-group>
      <sp-field-group>
        <div class="picker-container">
          <sp-field-label for="type">Type</sp-field-label>
          <eomap-picker id="type">
            <eomap-menu-item value="${MapType.Normal}">
              Normal
            </eomap-menu-item>
            <eomap-menu-divider></eomap-menu-divider>
            <eomap-menu-item value="${MapType.PK}">
              Hostile (PK)
            </eomap-menu-item>
          </eomap-picker>
        </div>
        <div class="picker-container">
          <sp-field-label for="effect">Effect</sp-field-label>
          <eomap-picker id="effect">
            <eomap-menu-item value="${MapEffect.None}"> None </eomap-menu-item>
            <eomap-menu-divider></eomap-menu-divider>
            <eomap-menu-item value="${MapEffect.HPDrain}">
              Poison (HP Drain)
            </eomap-menu-item>
            <eomap-menu-item value="${MapEffect.TPDrain}">
              Vortex (TP Drain)
            </eomap-menu-item>
            <eomap-menu-divider></eomap-menu-divider>
            <eomap-menu-item value="${MapEffect.Quake1}">
              Quake 1 (Weakest)
            </eomap-menu-item>
            <eomap-menu-item value="${MapEffect.Quake2}">
              Quake 2
            </eomap-menu-item>
            <eomap-menu-item value="${MapEffect.Quake3}">
              Quake 3
            </eomap-menu-item>
            <eomap-menu-item value="${MapEffect.Quake4}">
              Quake 4 (Strongest)
            </eomap-menu-item>
          </eomap-picker>
        </div>
      </sp-field-group>
      <sp-field-group>
        <div>
          <sp-field-label for="minimap">Mini-map Allowed</sp-field-label>
          <div class="switch-container">
            <sp-switch id="minimap" emphasized></sp-switch>
          </div>
        </div>
        <div>
          <sp-field-label for="scrolls">Scrolls Allowed</sp-field-label>
          <div class="switch-container">
            <sp-switch id="scrolls" emphasized></sp-switch>
          </div>
        </div>
      </sp-field-group>
    `;
  }

  renderAudio() {
    return html`
      <sp-field-group>
        <div>
          <sp-field-label for="music">Music</sp-field-label>
          <eomap-number-field
            id="music"
            max="${CHAR_MAX - 1}"
          ></eomap-number-field>
        </div>
        <div>
          <sp-field-label for="ambient-sound">Ambient Sound</sp-field-label>
          <eomap-number-field
            id="ambient-sound"
            max="${SHORT_MAX - 1}"
          ></eomap-number-field>
        </div>
        <div class="picker-container">
          <sp-field-label for="music-control">Music Control</sp-field-label>
          <eomap-picker id="music-control">
            <eomap-menu-item
              value="${MusicControl.InterruptIfDifferentPlayOnce}"
            >
              Stop different - Play once
            </eomap-menu-item>
            <eomap-menu-item value="${MusicControl.InterruptPlayOnce}">
              Stop any - Play once
            </eomap-menu-item>
            <eomap-menu-item value="${MusicControl.FinishPlayOnce}">
              Wait - Play once
            </eomap-menu-item>
            <eomap-menu-divider></eomap-menu-divider>
            <eomap-menu-item
              value="${MusicControl.InterruptIfDifferentPlayRepeat}"
            >
              Stop different - Play repeat
            </eomap-menu-item>
            <eomap-menu-item value="${MusicControl.InterruptPlayRepeat}">
              Stop any - Play repeat
            </eomap-menu-item>
            <eomap-menu-item value="${MusicControl.FinishPlayRepeat}">
              Wait - Play repeat
            </eomap-menu-item>
            <eomap-menu-divider></eomap-menu-divider>
            <eomap-menu-item value="${MusicControl.InterruptPlayNothing}">
              Stop any - Play nothing
            </eomap-menu-item>
          </eomap-picker>
        </div>
      </sp-field-group>
    `;
  }

  renderRespawn() {
    return html`
      <sp-field-group>
        <div>
          <sp-field-label for="respawn-x">X</sp-field-label>
          <eomap-number-field
            id="respawn-x"
            max="${CHAR_MAX - 1}"
          ></eomap-number-field>
        </div>
        <div>
          <sp-field-label for="respawn-y">Y</sp-field-label>
          <eomap-number-field
            id="respawn-y"
            max="${CHAR_MAX - 1}"
          ></eomap-number-field>
        </div>
      </sp-field-group>
    `;
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
          style="--eomap-modal-width: 544px"
          underlay
          confirm-label="Save"
          cancel-label="Cancel"
          headline="Map Properties"
          .open=${this.open}
          @confirm=${this.confirm}
          @cancel=${this.cancel}
          @sp-closed=${(e) => e.stopPropagation()}
        >
          <style>
            eomap-textfield {
              --spectrum-textfield-texticon-min-width: 208px;
              padding-bottom: var(--spectrum-global-dimension-size-200);
            }
            eomap-number-field {
              padding-bottom: var(--spectrum-global-dimension-size-200);
            }
            eomap-picker {
              --spectrum-picker-min-width: 208px;
            }
            .switch-container {
              width: 208px;
              padding-bottom: var(--spectrum-global-dimension-size-200);
            }
            .picker-container {
              padding-bottom: var(--spectrum-global-dimension-size-200);
            }
          </style>
          <eomap-accordion>
            <sp-accordion-item label="General">
              ${this.renderGeneral()}
            </sp-accordion-item>
            <sp-accordion-item label="Audio">
              ${this.renderAudio()}
            </sp-accordion-item>
            <sp-accordion-item label="Respawn">
              ${this.renderRespawn()}
            </sp-accordion-item>
          </eomap-accordion>
        </eomap-modal>
        <div slot="trigger"></div>
      </overlay-trigger>
    `;
  }

  populate(emf) {
    this.width.invalid = false;
    this.height.invalid = false;
    this.music.invalid = false;
    this.ambientSound.invalid = false;
    this.respawnX.invalid = false;
    this.respawnY.invalid = false;

    this.name.value = emf.name;
    this.width.value = emf.width;
    this.height.value = emf.height;
    this.type.value = emf.type.toString();
    this.effect.value = emf.effect.toString();
    this.minimap.checked = emf.mapAvailable;
    this.scrolls.checked = emf.canScroll;
    this.music.value = emf.musicID;
    this.ambientSound.value = emf.ambientSoundID;
    this.musicControl.value = emf.musicControl.toString();
    this.respawnX.value = emf.relogX;
    this.respawnY.value = emf.relogY;
  }

  validateRequired(field) {
    field.invalid = isNaN(field.value);
  }

  validateFields() {
    this.validateRequired(this.width);
    this.validateRequired(this.height);
    this.validateRequired(this.music);
    this.validateRequired(this.ambientSound);
    this.validateRequired(this.respawnX);
    this.validateRequired(this.respawnY);

    return (
      !this.width.invalid &&
      !this.height.invalid &&
      !this.music.invalid &&
      !this.ambientSound.invalid &&
      !this.respawnX.invalid &&
      !this.respawnY.invalid
    );
  }

  confirm(_event) {
    if (this.validateFields()) {
      this.open = false;
      this.dispatchEvent(
        new CustomEvent("save", {
          detail: new MapPropertiesState(
            this.name.value,
            this.width.value,
            this.height.value,
            Number.parseInt(this.type.value),
            Number.parseInt(this.effect.value),
            this.minimap.checked,
            this.scrolls.checked,
            this.music.value,
            this.ambientSound.value,
            Number.parseInt(this.musicControl.value),
            this.respawnX.value,
            this.respawnY.value
          ),
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
