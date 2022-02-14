import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import "@spectrum-web-components/action-group/sp-action-group";
import {
  DrawIcon,
  EraseIcon,
  SamplerIcon,
  HandIcon,
  ColorFillIcon,
  StarIcon,
  UndoIcon,
  RedoIcon,
} from "@spectrum-web-components/icons-workflow";

import "./sidebar-button";

@customElement("eomap-sidebar")
export class Sidebar extends LitElement {
  static get styles() {
    return css`
      * {
        box-sizing: border-box;
      }
      :host {
        display: block;
        width: var(--spectrum-global-dimension-size-600);
        background-color: var(--spectrum-global-color-gray-400);
        padding-left: var(--spectrum-global-dimension-size-100);
        padding-right: var(--spectrum-global-dimension-size-100);
        position: relative;
        box-sizing: border-box;
      }
      sp-action-group {
        padding-top: var(--spectrum-global-dimension-size-100);
        padding-bottom: var(--spectrum-global-dimension-size-100);
      }
      sp-action-group:not(:first-child) {
        border-top: solid 1px var(--spectrum-global-color-gray-300);
      }
      sp-menu-item {
        white-space: nowrap;
      }
    `;
  }

  @property({ type: String })
  selectedTool;

  @property({ type: Boolean })
  canUndo;

  @property({ type: Boolean })
  canRedo;

  render() {
    return html`
      <sp-action-group vertical>
        <eomap-sidebar-button
          value="draw"
          label="Draw"
          .icon=${DrawIcon}
          ?selected=${"draw" === this.selectedTool}
          @click=${this.onToolClick}
        >
        </eomap-sidebar-button>
        <eomap-sidebar-button
          value="erase"
          label="Erase"
          .icon=${EraseIcon}
          ?selected=${"erase" === this.selectedTool}
          @click=${this.onToolClick}
        >
        </eomap-sidebar-button>
        <eomap-sidebar-button
          value="eyedropper"
          label="Eyedropper"
          .icon=${SamplerIcon}
          ?selected=${"eyedropper" === this.selectedTool}
          @click=${this.onToolClick}
        >
        </eomap-sidebar-button>
        <eomap-sidebar-button
          value="move"
          label="Move"
          .icon=${HandIcon}
          ?selected=${"move" === this.selectedTool}
          @click=${this.onToolClick}
        >
        </eomap-sidebar-button>
        <eomap-sidebar-button
          value="fill"
          label="Fill"
          .icon=${ColorFillIcon}
          ?selected=${"fill" === this.selectedTool}
          @click=${this.onToolClick}
        >
        </eomap-sidebar-button>
        <eomap-sidebar-button
          value="entity"
          label="Entity"
          .icon=${StarIcon}
          ?selected=${"entity" === this.selectedTool}
          @click=${this.onToolClick}
        >
        </eomap-sidebar-button>
      </sp-action-group>
      <sp-action-group vertical>
        <eomap-sidebar-button
          label="Undo"
          .icon=${UndoIcon}
          ?disabled=${!this.canUndo}
          @click=${this.onUndoClick}
        >
        </eomap-sidebar-button>
        <eomap-sidebar-button
          label="Redo"
          .icon=${RedoIcon}
          ?disabled=${!this.canRedo}
          @click=${this.onRedoClick}
        >
        </eomap-sidebar-button>
      </sp-action-group>
    `;
  }

  onToolClick(event) {
    const value = event.target.value;
    if (value) {
      event.preventDefault();
      this.dispatchEvent(new CustomEvent("tool-selected", { detail: value }));
    }
  }

  onUndoClick(event) {
    event.preventDefault();
    this.dispatchEvent(new CustomEvent("undo"));
  }

  onRedoClick(event) {
    event.preventDefault();
    this.dispatchEvent(new CustomEvent("redo"));
  }
}
