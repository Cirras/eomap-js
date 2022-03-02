import { css, html, LitElement } from "lit";
import { customElement, property, queryAll } from "lit/decorators.js";

import "@spectrum-web-components/action-button/sp-action-button.js";
import "@spectrum-web-components/overlay/overlay-trigger.js";
import "@spectrum-web-components/popover/sp-popover.js";
import "@spectrum-web-components/menu/sp-menu-item.js";
import "@spectrum-web-components/menu/sp-menu-divider.js";
import "@spectrum-web-components/theme/theme-dark.js";
import "@spectrum-web-components/theme/scale-medium.js";

import "./menubar-button";
import "./submenu-item";

import { LayerVisibilityState } from "../layer-visibility-state";

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
      sp-menu-divider {
        --spectrum-listitem-m-texticon-divider-color: var(
          --spectrum-global-color-gray-300
        );
        --spectrum-listitem-texticon-divider-size: var(
          --spectrum-global-dimension-size-10
        );
      }
      kbd {
        font-family: var(--spectrum-alias-body-text-font-family);
        font-size: 13px;
        color: var(--spectrum-global-color-gray-600);
        padding-left: 15px;
        pointer-events: none;
      }
      .view-kbd-container {
        display: inline;
        min-width: 47px;
        pointer-events: none;
      }
      .view-menu-item:not([selected]) .view-kbd-container {
        padding-right: calc(
          var(--spectrum-alias-ui-icon-checkmark-size-100) +
            var(--spectrum-listitem-texticon-icon-gap) - 1px
        );
      }
    `;
  }

  @queryAll("eomap-menubar-button", true)
  menus;

  @property({ type: LayerVisibilityState })
  layerVisibility = new LayerVisibilityState();

  @property({ type: Boolean })
  canOpenMaps = false;

  @property({ type: Boolean })
  canSaveMaps = false;

  @property({ type: Boolean })
  canAccessMapProperties = false;

  @property({ type: Boolean })
  canReloadGraphics = false;

  @property({ type: Boolean })
  canAccessSettings = false;

  @property({ type: Boolean })
  canUndo = false;

  @property({ type: Boolean })
  canRedo = false;

  @property({ type: Boolean })
  keyboardEnabled = true;

  @property({ type: Array })
  recentFiles = [];

  openMenu = null;

  onKeyDown = (event) => {
    if (!this.keyboardEnabled) {
      return;
    }

    if (!this.openMenu) {
      return;
    }

    switch (event.key) {
      case "ArrowLeft":
        this.selectMenuByOffset(-1);
        this.openMenu.autofocus = true;
        break;
      case "ArrowRight":
        this.selectMenuByOffset(1);
        this.openMenu.autofocus = true;
        break;
      case "ArrowDown":
      case "Tab":
      case "Home":
        this.openMenu.focus();
        break;
      case "ArrowUp":
      case "End":
        this.openMenu.focus();
        this.openMenu.menu.focusMenuItemByOffset(-1);
        break;
      case "Escape":
        this.closeOpenMenu();
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  selectMenuByOffset(offset) {
    let menuIndex = null;
    for (let i = 0; i < this.menus.length; ++i) {
      if (this.openMenu === this.menus[i]) {
        menuIndex = i;
      }
    }

    menuIndex += offset;

    if (menuIndex < 0) {
      menuIndex = this.menus.length - 1;
    } else if (menuIndex >= this.menus.length) {
      menuIndex = 0;
    }

    this.toggleMenu(this.menus[menuIndex]);
  }

  onWindowPointerDown = (_event) => {
    this.closeOpenMenu();
  };

  onWindowBlur = (_event) => {
    this.closeOpenMenu();
  };

  renderFileMenuItems() {
    return html`
      <sp-menu-item
        ?disabled=${!this.canOpenMaps}
        @pointerup=${this.onNewPress}
      >
        New
        <kbd slot="value">Ctrl+Alt+N</kbd>
      </sp-menu-item>
      <sp-menu-item
        ?disabled=${!this.canOpenMaps}
        @menu-item-press=${this.onOpenPress}
      >
        Open
        <kbd slot="value">Ctrl+O</kbd>
      </sp-menu-item>
      <eomap-submenu-item
        ?disabled=${!this.canOpenMaps || this.recentFiles.length === 0}
      >
        Open Recent ${this.renderRecentFiles()}
      </eomap-submenu-item>
      <sp-menu-divider></sp-menu-divider>
      <sp-menu-item
        ?disabled=${!this.canSaveMaps}
        @menu-item-press=${this.onSavePress}
      >
        Save
        <kbd slot="value">Ctrl+S</kbd>
      </sp-menu-item>
      <sp-menu-item
        ?disabled=${!this.canSaveMaps}
        @menu-item-press=${this.onSaveAsPress}
      >
        Save As
        <kbd slot="value">Ctrl+Shift+S</kbd>
      </sp-menu-item>
      <sp-menu-divider></sp-menu-divider>
      <sp-menu-item
        style="min-width: 250px"
        ?disabled=${!this.canAccessMapProperties}
        @menu-item-press=${this.onMapPropertiesPress}
      >
        Map Properties
      </sp-menu-item>
      <sp-menu-divider></sp-menu-divider>
      <sp-menu-item
        ?disabled=${!this.canAccessSettings}
        @menu-item-press=${this.onSettingsPress}
      >
        Settings
        <kbd slot="value">Ctrl+,</kbd>
      </sp-menu-item>
      <sp-menu-divider></sp-menu-divider>
      <sp-menu-item
        ?disabled=${!this.canReloadGraphics}
        @menu-item-press=${this.onReloadGraphicsPress}
      >
        Reload Graphics
      </sp-menu-item>
    `;
  }

  renderRecentFiles() {
    let menuItems = this.recentFiles.map((handle) => {
      return html`
        <sp-menu-item
          @menu-item-press=${() => {
            this.dispatchEvent(
              new CustomEvent("open-recent", { detail: handle })
            );
          }}
        >
          ${handle.name}
        </sp-menu-item>
      `;
    });

    return html` <eomap-menu slot="menu"> ${menuItems} </eomap-menu> `;
  }

  renderEditMenuItems() {
    return html`
      <sp-menu-item
        ?disabled=${!this.canUndo}
        @menu-item-press=${this.onUndoPress}
      >
        Undo
        <kbd slot="value">Ctrl+Z</kbd>
      </sp-menu-item>
      <sp-menu-item
        ?disabled=${!this.canRedo}
        @menu-item-press=${this.onRedoPress}
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
            class="view-menu-item"
            ?selected=${this.layerVisibility.isFlagActive(i)}
            ?disabled=${this.layerVisibility.isFlagOverridden(i)}
            value=${i}
            @menu-item-press=${this.onViewItemPress}
          >
            ${info.label}
            <div class="view-kbd-container" slot="value">
              <kbd>${info.kbd}</kbd>
            </div>
          </sp-menu-item>
        `
    );
  }

  render() {
    return html`
      <header>
        <eomap-menubar-button
          label="File"
          @button-pointerenter=${this.onButtonPointerEnter}
          @button-pointerdown=${this.onButtonPointerDown}
          @menu-item-press=${this.onMenuItemPress}
        >
          ${this.renderFileMenuItems()}
        </eomap-menubar-button>
        <eomap-menubar-button
          label="Edit"
          @button-pointerenter=${this.onButtonPointerEnter}
          @button-pointerdown=${this.onButtonPointerDown}
          @menu-item-press=${this.onMenuItemPress}
        >
          ${this.renderEditMenuItems()}
        </eomap-menubar-button>
        <eomap-menubar-button
          label="View"
          @button-pointerenter=${this.onButtonPointerEnter}
          @button-pointerdown=${this.onButtonPointerDown}
          @menu-item-press=${this.onMenuItemPress}
        >
          ${this.renderViewMenuItems()}
        </eomap-menubar-button>
        <eomap-menubar-button
          label="Help"
          @button-pointerenter=${this.onButtonPointerEnter}
          @button-pointerdown=${this.onButtonPointerDown}
          @menu-item-press=${this.onMenuItemPress}
        >
        </eomap-menubar-button>
      </header>
    `;
  }

  onButtonPointerEnter(event) {
    if (this.openMenu && this.openMenu !== event.target) {
      this.toggleMenu(event.target);
    }
  }

  onButtonPointerDown(event) {
    this.toggleMenu(event.target);
  }

  onMenuItemPress(_event) {
    this.closeOpenMenu();
  }

  onNewPress(_event) {
    this.dispatchEvent(new CustomEvent("new"));
  }

  onOpenPress(_event) {
    this.dispatchEvent(new CustomEvent("open"));
  }

  onSavePress(_event) {
    this.dispatchEvent(new CustomEvent("save"));
  }

  onSaveAsPress(_event) {
    this.dispatchEvent(new CustomEvent("save-as"));
  }

  onMapPropertiesPress(_event) {
    this.dispatchEvent(new CustomEvent("map-properties"));
  }

  onReloadGraphicsPress(_event) {
    this.dispatchEvent(new CustomEvent("reload-gfx"));
  }

  onSettingsPress(_event) {
    this.dispatchEvent(new CustomEvent("settings"));
  }

  onViewItemPress(event) {
    this.dispatchEvent(
      new CustomEvent("visibility-flag-toggle", {
        detail: parseInt(event.target.value),
      })
    );
  }

  onUndoPress(_event) {
    setTimeout(() => this.dispatchEvent(new CustomEvent("undo")));
  }

  onRedoPress(_event) {
    setTimeout(() => this.dispatchEvent(new CustomEvent("redo")));
  }

  toggleMenu(menu) {
    let open = !menu.open;
    let togglingOpenMenu = this.openMenu === menu;

    if (open !== togglingOpenMenu) {
      this.closeOpenMenu();
    }

    if (open) {
      this.openMenu = menu;
      this.openMenu.focus();
      this.openMenu.autofocus = false;
    }

    menu.open = open;
  }

  closeOpenMenu() {
    if (this.openMenu) {
      this.openMenu.open = false;
      this.openMenu.blur();
      this.openMenu = null;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("pointerdown", this.onWindowPointerDown);
    window.addEventListener("blur", this.onWindowBlur);
  }

  disconnectedCallback() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("pointerdown", this.onWindowPointerDown);
    window.removeEventListener("blur", this.onWindowBlur);
    super.disconnectedCallback();
  }
}
