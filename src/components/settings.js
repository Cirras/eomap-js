import {
  customElement,
  html,
  LitElement,
  property,
  query,
  queryAll,
} from "lit-element";

import "@spectrum-web-components/field-group/sp-field-group.js";
import "@spectrum-web-components/overlay/overlay-trigger.js";
import "@spectrum-web-components/accordion/sp-accordion.js";
import "@spectrum-web-components/accordion/sp-accordion-item.js";

import "./modal";
import "./folderfield";

import { SettingsState } from "../settings-state";

@customElement("eomap-settings")
export class Settings extends LitElement {
  @queryAll("sp-accordion-item")
  accordianItems;

  @query("#gfx", true)
  gfx;

  @query("#assets", true)
  assets;

  @property({ type: Boolean, reflect: true })
  open = false;

  onAccordianItemToggle(event) {
    if (event.target !== document.activeElement) {
      // Enter or Space was pressed from within an accordian item
      event.preventDefault();
      document.activeElement.click();
    }
  }

  updated(changed) {
    if (changed.has("open")) {
      this.manageOpen();
    }
  }

  manageOpen() {
    if (this.open) {
      this.expandAccordianItems();
    }
  }

  expandAccordianItems() {
    for (let accordianItem of this.accordianItems) {
      accordianItem.open = true;
    }
  }

  renderGraphics() {
    return html`
      <sp-field-group vertical>
        <eomap-folderfield
          id="gfx"
          label="Path to GFX"
          required
        ></eomap-folderfield>
        <eomap-folderfield
          id="assets"
          label="Path to Mapper Assets"
          placeholder="<Use default>"
        ></eomap-folderfield>
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
          style="--spectrum-dialog-confirm-min-width: 380px"
          slot="click-content"
          underlay
          headline="Settings"
          confirm-label="Save"
          cancel-label="Cancel"
          .open=${this.open}
          @confirm=${this.confirm}
          @cancel=${this.cancel}
        >
          <style>
            eomap-folderfield {
              --spectrum-folderfield-min-width: 236px;
              padding-bottom: 10px;
            }
          </style>
          <sp-accordion
            allow-multiple
            @sp-accordion-item-toggle=${this.onAccordianItemToggle}
          >
            <sp-accordion-item label="Graphics">
              ${this.renderGraphics()}
            </sp-accordion-item>
          </sp-accordion>
        </eomap-modal>
        <div slot="trigger"></div>
      </overlay-trigger>
    `;
  }

  populate(settingsState) {
    this.gfx.selected = settingsState.gfxDirectory;
    this.assets.selected = settingsState.customAssetsDirectory;
  }

  confirm(_event) {
    this.dispatchEvent(
      new CustomEvent("save", {
        detail: SettingsState.fromValues(
          this.gfx.selected,
          this.assets.selected
        ),
      })
    );
    this.open = false;
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
