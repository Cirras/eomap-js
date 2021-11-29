import { css, customElement, html, LitElement, property } from "lit-element";

import "@spectrum-web-components/action-button/sp-action-button.js";
import "@spectrum-web-components/overlay/overlay-trigger.js";
import "@spectrum-web-components/popover/sp-popover.js";
import "@spectrum-web-components/menu/sp-menu.js";
import "@spectrum-web-components/menu/sp-menu-item.js";
import "@spectrum-web-components/menu/sp-menu-divider.js";
import "@spectrum-web-components/theme/theme-dark.js";
import "@spectrum-web-components/theme/scale-medium.js";
import "./menubar-button";

import { LayerVisibilityState } from "../layer-visibility-state";
import { EMF } from "../data/emf";

@customElement("eomap-menubar")
export class MenuBar extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
      }
      header {
        background-color: var(--spectrum-global-color-gray-200);
        display: flex;
        align-items: center;
        padding-left: var(--spectrum-global-dimension-size-100);
        padding-right: var(--spectrum-global-dimension-size-100);
        position: relative;
        width: 100%;
      }
    `;
  }

  @property({ type: LayerVisibilityState })
  layerVisibility = new LayerVisibilityState();

  @property({ type: EMF })
  emf = null;

  @property({ type: Boolean })
  canUndo = false;

  @property({ type: Boolean })
  canRedo = false;

  renderFileMenuItems() {
    return html`
      <sp-menu-item
        class="menu-item"
        @click=${this.onNewClick}"
      >
        New
        <kbd slot="value">Ctrl+Alt+N</kbd>
      </sp-menu-item>
      <sp-menu-item
        class="menu-item"
        @click=${this.onOpenClick}"
      >
        Open
        <kbd slot="value">Ctrl+O</kbd>
      </sp-menu-item>
      <sp-menu-divider></sp-menu-divider>
      <sp-menu-item
        class="menu-item"
        ?disabled=${this.emf === null}
        @click=${this.onSaveClick}"
      >
        Save
        <kbd slot="value">Ctrl+S</kbd>
      </sp-menu-item>
      <sp-menu-item
        class="menu-item"
        ?disabled=${this.emf === null}
        @click=${this.onSaveAsClick}"
      >
        Save As
        <kbd slot="value">Ctrl+Shift+S</kbd>
      </sp-menu-item>
      <sp-menu-divider></sp-menu-divider>
      <sp-menu-item
        class="menu-item"
        style="min-width: 250px"
        ?disabled=${this.emf === null}
        @click=${this.onMapPropertiesClick}"
      >
        Map Properties
      </sp-menu-item>
      <sp-menu-divider></sp-menu-divider>
      <sp-menu-item
        class="menu-item"
        @click=${this.onSettingsClick}"
      >
        Settings
      </sp-menu-item>
    `;
  }

  renderEditMenuItems() {
    return html`
      <sp-menu-item
        class="menu-item"
        ?disabled=${!this.canUndo}
        @click=${this.onUndoClick}
      >
        Undo
        <kbd slot="value">Ctrl+Z</kbd>
      </sp-menu-item>
      <sp-menu-item
        class="menu-item"
        ?disabled=${!this.canRedo}
        @click=${this.onRedoClick}
      >
        Redo
        <kbd slot="value">Ctrl+Y</kbd>
      </sp-menu-item>
    `;
  }

  renderViewMenuItems() {
    // prettier-ignore
    const MENU_ITEM_DATA = [
      { label: "Ground",     kbd: "Alt+1" },
      { label: "Objects",    kbd: "Alt+2" },
      { label: "Overlay",    kbd: "Alt+3" },
      { label: "Down Wall",  kbd: "Alt+4" },
      { label: "Right Wall", kbd: "Alt+5" },
      { label: "Roof",       kbd: "Alt+6" },
      { label: "Top",        kbd: "Alt+7" },
      { label: "Shadow",     kbd: "Alt+8" },
      { label: "Overlay 2",  kbd: "Alt+9" },
      { label: "Special",    kbd: "Alt+0" },
      { label: "Entities",   kbd: "Alt+E" },
    ];

    return MENU_ITEM_DATA.map(
      (info, i) =>
        html`
          <sp-menu-item
            class="checkable-menu-item"
            ?selected=${this.layerVisibility.isFlagActive(i)}
            ?disabled=${this.layerVisibility.isFlagOverridden(i)}
            value=${i}
            @click=${this.onViewItemClick}"
          >
            ${info.label}
            <kbd slot="value">${info.kbd}</kbd>
          </sp-menu-item>
        `
    );
  }

  render() {
    return html`
      <header>
        <eomap-menubar-button>
          <span slot="label">File</span>
          ${this.renderFileMenuItems()}
        </eomap-menubar-button>
        <eomap-menubar-button>
          <span slot="label">Edit</span>
          ${this.renderEditMenuItems()}
        </eomap-menubar-button>
        <eomap-menubar-button>
          <span slot="label">View</span>
          ${this.renderViewMenuItems()}
        </eomap-menubar-button>
        <eomap-menubar-button>
          <span slot="label">Help</span>
        </eomap-menubar-button>
      </header>
    `;
  }

  onNewClick(_event) {
    this.dispatchEvent(new CustomEvent("new"));
  }

  onOpenClick(_event) {
    this.dispatchEvent(new CustomEvent("open"));
  }

  onSaveClick(_event) {
    this.dispatchEvent(new CustomEvent("save"));
  }

  onSaveAsClick(_event) {
    this.dispatchEvent(new CustomEvent("save-as"));
  }

  onMapPropertiesClick(_event) {
    this.dispatchEvent(new CustomEvent("map-properties"));
  }

  onSettingsClick(_event) {
    this.dispatchEvent(new CustomEvent("settings"));
  }

  onViewItemClick(event) {
    this.dispatchEvent(
      new CustomEvent("visibility-flag-toggle", {
        detail: parseInt(event.target.value),
      })
    );
  }

  onUndoClick(_event) {
    setTimeout(() => this.dispatchEvent(new CustomEvent("undo")));
  }

  onRedoClick(_event) {
    setTimeout(() => this.dispatchEvent(new CustomEvent("redo")));
  }
}
