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

import { MenubarState } from "../../../core/state/menubar-state";
import { isMac } from "../../../core/util/platform-utils";

@customElement("eomap-titlebar")
export class Titlebar extends LitElement {
  static TITLEBAR_HEIGHT = window.bridge.getTitlebarHeight();

  static get styles() {
    return css`
      :host {
        width: 100%;
        height: ${this.TITLEBAR_HEIGHT}px;
        box-sizing: border-box;
        justify-content: left;
        flex-shrink: 1;
        flex-grow: 1;
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
        height: ${this.TITLEBAR_HEIGHT}px;
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
        --eomap-menubar-height: ${this.TITLEBAR_HEIGHT}px;
        z-index: 2500;
        -webkit-app-region: no-drag;
        min-width: 36px;
      }
      .window-title {
        flex: 0 2 auto;
        font-size: 12px;
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
        height: ${this.TITLEBAR_HEIGHT}px;
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

  @property({ type: MenubarState })
  menubarState = new MenubarState();

  @property({ type: Boolean, reflect: true })
  inactive = false;

  @property({ type: String })
  title = "Endless Map Editor";

  @state({ type: Object })
  titleStyle = {};

  onWindowBlur = (_event) => {
    this.inactive = true;
  };

  onWindowFocus = (_event) => {
    this.inactive = false;
  };

  resizeObserver = new ResizeObserver((_entries) => {
    this.adjustTitlePosition();
  });

  firstUpdated(changedProperties) {
    super.firstUpdated(changedProperties);
    this.resizeObserver.observe(this);
    this.resizeObserver.observe(this.windowTitle);
  }

  renderAppIcon() {
    if (!isMac()) {
      return html` <div class="app-icon">${unsafeHTML(AppIcon)}</div> `;
    }
  }

  renderMenubar() {
    if (!isMac()) {
      return html`
        <eomap-menubar
          class="menubar"
          .state=${this.menubarState}
          .inactive=${this.inactive}
        ></eomap-menubar>
      `;
    }
  }

  renderWindowControls() {
    if (!isMac()) {
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
      <div class="window-title" style=${styleMap(this.titleStyle)}>
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

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("blur", this.onWindowBlur);
    window.addEventListener("focus", this.onWindowFocus);
  }

  disconnectedCallback() {
    window.removeEventListener("blur", this.onWindowBlur);
    window.removeEventListener("focus", this.onWindowFocus);
    super.disconnectedCallback();
  }
}
