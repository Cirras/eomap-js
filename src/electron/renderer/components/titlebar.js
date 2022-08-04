import { css, html, LitElement } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

import AppIcon from "../../../core/assets/icon.svg";
import MinimizeIcon from "@vscode/codicons/src/icons/chrome-minimize.svg";
import MaximizeIcon from "@vscode/codicons/src/icons/chrome-maximize.svg";
import RestoreIcon from "@vscode/codicons/src/icons/chrome-restore.svg";
import CloseIcon from "@vscode/codicons/src/icons/chrome-close.svg";

import "./menubar";

import { MenubarController } from "../../../core/controllers/menubar-controller";
import { isMac } from "../../../core/util/platform-utils";

const titlebarHeight = (() => {
  if (isMac()) {
    let release = parseFloat(window.bridge.os.release());
    if (release >= 20) {
      return 28;
    }
    return 20;
  }
  return 30;
})();

@customElement("eomap-titlebar")
export class Titlebar extends LitElement {
  static get styles() {
    return css`
      :host {
        width: 100%;
        height: ${titlebarHeight}px;
        box-sizing: border-box;
        justify-content: left;
        flex-shrink: 1;
        align-items: center;
        -webkit-user-select: none;
        display: flex;
        background-color: var(--spectrum-global-color-gray-200);
        color: var(--spectrum-global-color-gray-800);
        transform-origin: 0 0;
      }
      .drag-region {
        top: 0;
        left: 0;
        display: block;
        position: absolute;
        width: 100%;
        height: ${titlebarHeight}px;
        -webkit-app-region: drag;
      }
      .app-icon {
        width: 35px;
        height: 100%;
        box-sizing: border-box;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-left: 2px;
        z-index: 3000;
        flex-shrink: 0;
      }
      .app-icon svg {
        width: 16px;
        height: 16px;
      }
      .menubar {
        --eomap-menubar-height: ${titlebarHeight}px;
        z-index: 2500;
        -webkit-app-region: no-drag;
        min-width: 36px;
      }
      .window-title {
        flex: 0 2 auto;
        font-size: 12px;
        line-height: 22px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        margin-left: auto;
        margin-right: auto;
      }
      .window-controls-container {
        display: flex;
        flex-grow: 0;
        flex-shrink: 0;
        position: relative;
        z-index: 3000;
        -webkit-app-region: no-drag;
        height: 100%;
        min-width: ${isMac() ? 70 : 138}px;
        margin-left: auto;
      }
      .window-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        height: ${titlebarHeight}px;
        width: 46px;
      }
      .window-icon:hover {
        color: var(--spectrum-global-color-gray-800);
        background-color: var(
          --spectrum-alias-component-background-color-quiet-down
        );
      }
      .window-icon.window-close:hover {
        background-color: rgba(232, 17, 35, 0.9);
      }
      :host([inactive]) {
        background-color: #303030;
        color: rgba(200, 200, 200, 0.6);
      }
    `;
  }

  @query(".app-icon")
  appIcon;

  @query(".menubar")
  menubar;

  @query(".window-title")
  windowTitle;

  @query(".window-controls-container")
  windowControls;

  @property({ type: MenubarController })
  menubarController = null;

  @property({ type: Boolean, reflect: true })
  inactive = false;

  @property({ type: String })
  title = "Endless Map Editor";

  @property({ type: Boolean })
  maximized = false;

  @property({ type: Boolean })
  fullScreen = false;

  @state({ type: Object })
  titleStyle = {};

  resizeObserver = new ResizeObserver((_entries) => {
    this.adjustTitlePosition();
  });

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    this.resizeObserver.observe(this);
    this.resizeObserver.observe(this.windowTitle);
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (changedProperties.has("fullScreen")) {
      if (this.menubar) {
        this.menubar.showMnemonics = false;
        this.menubar.unselectMenu();
      }
      this.manageDisplay();
    }
  }

  manageDisplay() {
    if (this.fullScreen && !this.menubar?.showMnemonics) {
      this.style.display = "none";
    } else {
      this.style.display = "flex";
    }
  }

  renderAppIcon() {
    if (!isMac() && !this.fullScreen) {
      return html` <div class="app-icon">${unsafeHTML(AppIcon)}</div> `;
    }
  }

  renderMenubar() {
    if (!isMac()) {
      return html`
        <eomap-menubar
          class="menubar"
          .controller=${this.menubarController}
          .inactive=${this.inactive}
          @show-mnemonics-changed=${this.manageDisplay}
        ></eomap-menubar>
      `;
    }
  }

  renderWindowControls() {
    if (!isMac() && !this.fullScreen) {
      return html`
        <div
          class="window-icon window-minimize"
          @click=${() => window.bridge.minimize()}
        >
          ${unsafeHTML(MinimizeIcon)}
        </div>
        <div
          class="window-icon window-max-restore"
          @click=${() =>
            this.maximized
              ? window.bridge.unmaximize()
              : window.bridge.maximize()}
        >
          ${unsafeHTML(this.maximized ? RestoreIcon : MaximizeIcon)}
        </div>
        <div
          class="window-icon window-close"
          @click=${() => window.bridge.requestClose()}
        >
          ${unsafeHTML(CloseIcon)}
        </div>
      `;
    }
  }

  render() {
    return html`
      <div class="drag-region"></div>
      ${this.renderAppIcon()} ${this.renderMenubar()}
      <div
        class="window-title"
        style=${styleMap(this.titleStyle)}
        @contextmenu=${this.onTitleContextMenu}
        @pointerdown=${this.onTitlePointerDown}
      >
        ${this.title}
      </div>
      <div class="window-controls-container">
        ${this.renderWindowControls()}
      </div>
    `;
  }

  adjustTitlePosition() {
    const iconWidth = this.appIcon ? this.appIcon.clientWidth : 0;
    const menubarWidth = this.menubar ? this.menubar.clientWidth : 0;
    const titleWidth = this.windowTitle.clientWidth;
    const controlsWidth = this.windowControls.clientWidth;

    let leftMarker = iconWidth + menubarWidth + 10;
    let rightMarker = this.clientWidth - controlsWidth - 10;

    if (isMac()) {
      leftMarker += controlsWidth;
      rightMarker += controlsWidth;
    }

    if (
      leftMarker > (this.clientWidth - titleWidth) / 2 ||
      rightMarker < (this.clientWidth + titleWidth) / 2
    ) {
      this.titleStyle = {};
      return;
    }

    this.titleStyle = {
      position: "absolute",
      left: "50%",
      transform: "translate(-50%, 0)",
      maxWidth: `calc(100vw - ${2 * (this.windowControls.clientWidth + 10)}px)`,
    };
  }

  onTitleContextMenu(event) {
    if (isMac()) {
      event.stopPropagation();
      window.bridge.showTitleContextMenu(
        Math.round(event.pageX),
        Math.round(event.pageY)
      );
    }
  }

  onTitlePointerDown(event) {
    if (event.metaKey) {
      this.onTitleContextMenu(event);
    }
  }
}
