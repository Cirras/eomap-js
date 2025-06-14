import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

import {
  DrawIcon,
  EraseIcon,
  SamplerIcon,
  HandIcon,
  MagnifyIcon,
  ColorFillIcon,
  StarIcon,
  UndoIcon,
  RedoIcon,
} from "@spectrum-web-components/icons-workflow";

import "./action-group";
import "./sidebar-menubar";
import "./sidebar-button";

import { MenubarController } from "../controllers/menubar-controller";
import { KeybindingState } from "../state/keybinding-state";

const TOOLS = [
  { label: "Draw", key: "draw", icon: DrawIcon, kbd: "D" },
  { label: "Erase", key: "erase", icon: EraseIcon, kbd: "R" },
  { label: "Eyedropper", key: "eyedropper", icon: SamplerIcon, kbd: "I" },
  { label: "Move", key: "move", icon: HandIcon, kbd: "M" },
  { label: "Zoom", key: "zoom", icon: MagnifyIcon, kbd: "Z" },
  { label: "Fill", key: "fill", icon: ColorFillIcon, kbd: "F" },
  { label: "Entity", key: "entity", icon: StarIcon, kbd: "E" },
];

const KEYBINDING_MAP = TOOLS.reduce((map, tool) => {
  map.set(new KeybindingState(tool.kbd), tool.key);
  return map;
}, new Map());

@customElement("eomap-sidebar")
export class Sidebar extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
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
    `;
  }

  @property({ type: MenubarController })
  menubarController;

  @property({ type: String })
  selectedTool;

  @property({ type: Boolean })
  canUndo;

  @property({ type: Boolean })
  canRedo;

  renderMenubar() {
    if (this.menubarController) {
      return html`
        <eomap-sidebar-menubar .controller=${this.menubarController}>
        </eomap-sidebar-menubar>
      `;
    }
  }

  renderToolButtons() {
    return TOOLS.map(
      (tool) => html`
        <eomap-sidebar-button
          .value=${tool.key}
          .label=${`${tool.label} (${tool.kbd})`}
          .icon=${tool.icon}
          ?selected=${tool.key === this.selectedTool}
          @click=${this.onToolClick}
        >
        </eomap-sidebar-button>
      `,
    );
  }

  render() {
    return html`
      <eomap-action-group vertical>
        ${this.renderMenubar()}
        ${this.renderToolButtons()}
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
      </eomap-action-group>
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

  getToolKeyForKeybinding(event) {
    for (let keybinding of KEYBINDING_MAP.keys()) {
      if (keybinding.triggeredBy(event)) {
        return KEYBINDING_MAP.get(keybinding);
      }
    }
    return null;
  }
}
