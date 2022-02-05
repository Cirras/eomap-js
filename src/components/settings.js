import {
  customElement,
  html,
  LitElement,
  property,
  state,
  query,
  queryAll,
} from "lit-element";

import "@spectrum-web-components/field-label/sp-field-label.js";
import "@spectrum-web-components/field-group/sp-field-group.js";
import "@spectrum-web-components/overlay/overlay-trigger.js";
import "@spectrum-web-components/accordion/sp-accordion.js";
import "@spectrum-web-components/accordion/sp-accordion-item.js";

import "./modal";
import "./folderfield";
import "./textfield";

import { SettingsState } from "../settings-state";

@customElement("eomap-settings")
export class Settings extends LitElement {
  @queryAll("sp-accordion-item")
  accordianItems;

  @query("#gfx", true)
  gfx;

  @query("#assets", true)
  assets;

  @query("#connected-mode-enabled", true)
  connectedModeEnabled;

  @query("#connected-mode-url", true)
  connectedModeURL;

  @property({ type: Boolean, reflect: true })
  open = false;

  @state({ type: Boolean })
  connectedModeEnabledState = false;

  @state({ type: String })
  connectedModeURLState = false;

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
        <eomap-folderfield id="gfx" label="Path to GFX"></eomap-folderfield>
        <eomap-folderfield
          id="assets"
          label="Path to Mapper Assets"
          placeholder="<Use default>"
        ></eomap-folderfield>
      </sp-field-group>
    `;
  }

  renderConnectedMode() {
    return html`
      <sp-field-group vertical>
        <sp-field-label for="connected-mode-enabled"> Enabled </sp-field-label>
        <sp-switch
          id="connected-mode-enabled"
          .checked=${!!FORCE_CONNECTED_MODE_URL ||
          this.connectedModeEnabledState}
          .disabled=${!!FORCE_CONNECTED_MODE_URL}
          @click=${() => {
            this.connectedModeEnabledState = !this.connectedModeEnabledState;
            if (this.connectedModeEnabledState) {
              this.gfx.invalid = false;
            } else if (!this.connectedModeURL.value) {
              this.connectedModeURL.invalid = false;
            }
          }}
          emphasized
        >
        </sp-switch>
        <sp-field-label for="connected-mode-url">
          Mapper Service URL
        </sp-field-label>
        <eomap-textfield
          id="connected-mode-url"
          placeholder="https://example.com"
          pattern="https://.*"
          .disabled=${!!FORCE_CONNECTED_MODE_URL}
          @input=${(e) => {
            this.connectedModeURLState = e.target.value;
          }}
        >
        </eomap-textfield>
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
          style="--spectrum-dialog-confirm-min-width: 500px"
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
              --spectrum-folderfield-min-width: 388px;
              margin-bottom: 10px;
            }
            eomap-textfield {
              --spectrum-textfield-min-width: 388px;
              margin-bottom: 10px;
            }
          </style>
          <sp-accordion
            allow-multiple
            @sp-accordion-item-toggle=${this.onAccordianItemToggle}
          >
            <sp-accordion-item
              label="Graphics"
              style="${!!FORCE_CONNECTED_MODE_URL ? "display: none;" : ""}"
            >
              ${this.renderGraphics()}
            </sp-accordion-item>
            <sp-accordion-item label="Connected Mode">
              ${this.renderConnectedMode()}
            </sp-accordion-item>
          </sp-accordion>
        </eomap-modal>
        <div slot="trigger"></div>
      </overlay-trigger>
    `;
  }

  populate(settingsState) {
    this.gfx.selected = settingsState.gfxDirectory;
    this.gfx.invalid = false;
    this.assets.selected = settingsState.customAssetsDirectory;
    this.connectedModeURL.value =
      FORCE_CONNECTED_MODE_URL || settingsState.connectedModeURL;
    this.connectedModeURL.invalid = false;

    this.connectedModeEnabledState = settingsState.connectedModeEnabled;
    this.connectedModeURLState = settingsState.connectedModeURL;
  }

  validateFields() {
    if (FORCE_CONNECTED_MODE_URL || this.connectedModeEnabledState) {
      this.gfx.invalid = false;
      if (!this.connectedModeURL.value) {
        this.connectedModeURL.invalid = true;
      }
    } else {
      if (!this.gfx.selected) {
        this.gfx.invalid = true;
      }
      if (!this.connectedModeURL.value) {
        this.connectedModeURL.invalid = false;
      }
    }

    return !this.gfx.invalid && !this.connectedModeURL.invalid;
  }

  confirm(_event) {
    if (this.validateFields()) {
      this.open = false;
      this.dispatchEvent(
        new CustomEvent("save", {
          detail: SettingsState.fromValues(
            this.gfx.selected,
            this.assets.selected,
            this.connectedModeEnabledState,
            this.connectedModeURLState
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
