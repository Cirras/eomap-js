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
import { css, customElement, html, LitElement, property } from "lit-element";

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
        border-top: solid 2px var(--spectrum-global-color-gray-500);
      }
      sp-menu-item {
        white-space: nowrap;
      }
    `;
  }

  @property({ type: String })
  tool;

  render() {
    return html`
      <sp-action-group vertical>
        <eomap-sidebar-button
          value="draw"
          label="Draw"
          .icon=${DrawIcon}
          ?selected=${"draw" === this.tool}
          @click=${this.onToolClick}
        >
        </eomap-sidebar-button>
        <eomap-sidebar-button
          value="erase"
          label="Erase"
          .icon=${EraseIcon}
          ?selected=${"erase" === this.tool}
          @click=${this.onToolClick}
        >
        </eomap-sidebar-button>
        <eomap-sidebar-button
          value="eyedropper"
          label="Eyedropper"
          .icon=${SamplerIcon}
          ?selected=${"eyedropper" === this.tool}
          @click=${this.onToolClick}
        >
        </eomap-sidebar-button>
        <eomap-sidebar-button
          value="move"
          label="Move"
          .icon=${HandIcon}
          ?selected=${"move" === this.tool}
          @click=${this.onToolClick}
        >
        </eomap-sidebar-button>
        <eomap-sidebar-button
          value="fill"
          label="Fill"
          .icon=${ColorFillIcon}
          ?selected=${"fill" === this.tool}
          @click=${this.onToolClick}
        >
        </eomap-sidebar-button>
        <eomap-sidebar-button
          value="entity"
          label="Entity"
          .icon=${StarIcon}
          ?selected=${"entity" === this.tool}
          @click=${this.onToolClick}
        >
        </eomap-sidebar-button>
      </sp-action-group>
      <sp-action-group vertical>
        <eomap-sidebar-button label="Undo" .icon=${UndoIcon}>
        </eomap-sidebar-button>
        <eomap-sidebar-button label="Redo" .icon=${RedoIcon}>
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
}
