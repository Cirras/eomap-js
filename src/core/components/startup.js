import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

import "@spectrum-web-components/progress-bar/sp-progress-bar.js";
import "@spectrum-web-components/button/sp-button.js";

import "./keybindings";

import AppIcon from "../assets/icon.svg";

import { MapState } from "../state/map-state";
import { KeybindingState } from "../state/keybinding-state";

@customElement("eomap-startup")
export class Startup extends LitElement {
  static Status = {
    UNKNOWN: 0,
    UNSUPPORTED: 1,
    LOADING_SETTINGS: 2,
    NEED_GFX_DIRECTORY: 3,
    NEED_GFX_DIRECTORY_PERMISSION: 4,
    NEED_ASSETS_DIRECTORY_PERMISSION: 5,
    ERROR_GFX: 6,
    LOADING_GFX: 7,
    ERROR_EMF: 8,
    LOADING_EMF: 9,
    READY: 10,
  };

  static get styles() {
    return css`
      :host {
        overflow: hidden;
        display: grid;
        grid-template-rows: 100%;
        grid-template-columns: 100%;
      }
      .loading {
        background-color: var(--spectrum-global-color-gray-75);
        display: flex;
        justify-content: center;
        align-items: center;
        grid-column: 1;
        grid-row: 1;
        z-index: 100;
      }
      .icon-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        width: 100%;
      }
      .icon-container svg {
        width: 150px;
        height: 150px;
        padding-bottom: 30px;
      }
      sp-progress-bar {
        --spectrum-progressbar-value-gap-y: var(
          --spectrum-global-dimension-size-50
        );
      }
      .stalled-progress-bar {
        --spectrum-fieldlabel-m-text-color: var(
          --spectrum-global-color-gray-700
        );
        --spectrum-progressbar-m-overbackground-track-fill-color: var(
          --spectrum-global-color-gray-700
        );
        --spectrum-progressbar-indeterminate-duration: 0ms;
      }
      .positive-progress-bar {
        --spectrum-fieldlabel-m-text-color: var(
          --spectrum-global-color-gray-700
        );
        --spectrum-progressbar-m-overbackground-track-fill-color: var(
          --spectrum-global-color-gray-700
        );
      }
      .negative-progress-bar {
        --spectrum-fieldlabel-m-text-color: var(
          --spectrum-semantic-negative-status-color
        );
        --spectrum-progressbar-m-overbackground-track-color: var(
          --spectrum-semantic-negative-status-color
        );
        --spectrum-progressbar-m-overbackground-track-fill-color: var(
          --spectrum-semantic-negative-status-color
        );
      }
      .action-button {
        margin-top: 25px;
      }
      .content-container {
        height: 150px;
        width: max-content;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
    `;
  }

  @property({ type: Number })
  status = Startup.Status.UNKNOWN;

  @property({ type: MapState })
  mapState = null;

  @property({ type: Number })
  gfxErrors = 0;

  renderActionButton() {
    if (this.actionLabel) {
      return html`
        <sp-button
          class="action-button"
          style="--spectrum-button-primary-fill-textonly-text-padding-bottom: 3px;"
          variant="cta"
          size="s"
          @click=${() => {
            this.dispatchEvent(new CustomEvent(this.actionEventName));
          }}
        >
          ${this.actionLabel}
        </sp-button>
      `;
    }
  }

  getBindingsMap() {
    let bindings = new Map();
    bindings.set("New Map", new KeybindingState("CommandOrControl+Alt+N"));
    bindings.set("Open Map", new KeybindingState("CommandOrControl+O"));
    bindings.set("Settings", new KeybindingState("CommandOrControl+,"));
    return bindings;
  }

  renderContent() {
    if (this.status === Startup.Status.READY) {
      return html`
        <eomap-keybindings .bindings=${this.getBindingsMap()}>
        </eomap-keybindings>
      `;
    } else {
      return html`
        <sp-progress-bar
          class="${this.progressBarClass}"
          label="${this.loadingLabel}"
          indeterminate
          over-background
        ></sp-progress-bar>
        ${this.renderActionButton()}
      `;
    }
  }

  render() {
    return html`
      <div class="loading">
        <div class="icon-container">
          ${unsafeHTML(AppIcon)}
          <div class="content-container">${this.renderContent()}</div>
        </div>
      </div>
    `;
  }

  get loadingLabel() {
    switch (this.status) {
      case Startup.Status.UNKNOWN:
        return "???";
      case Startup.Status.UNSUPPORTED:
        return "Unsupported browser.";
      case Startup.Status.LOADING_SETTINGS:
        return "Loading settings...";
      case Startup.Status.NEED_GFX_DIRECTORY:
        return "Path to GFX must be provided...";
      case Startup.Status.NEED_GFX_DIRECTORY_PERMISSION:
        return "Need permission to access GFX...";
      case Startup.Status.NEED_ASSETS_DIRECTORY_PERMISSION:
        return "Need permission to access Assets...";
      case Startup.Status.ERROR_GFX:
        return `Failed to load ${this.gfxErrors} GFX file(s).`;
      case Startup.Status.LOADING_GFX:
        return "Loading GFX...";
      case Startup.Status.ERROR_EMF:
        return this.mapState.error.message;
      case Startup.Status.LOADING_EMF:
        return `Loading ${this.mapState.filename}...`;
      default:
        throw new Error("Unhandled Startup Status");
    }
  }

  get progressBarClass() {
    switch (this.status) {
      case Startup.Status.UNKNOWN:
      case Startup.Status.LOADING_SETTINGS:
      case Startup.Status.LOADING_GFX:
      case Startup.Status.LOADING_EMF:
        return "positive-progress-bar";
      case Startup.Status.NEED_GFX_DIRECTORY:
      case Startup.Status.NEED_GFX_DIRECTORY_PERMISSION:
      case Startup.Status.NEED_ASSETS_DIRECTORY_PERMISSION:
        return "stalled-progress-bar";
      case Startup.Status.UNSUPPORTED:
      case Startup.Status.ERROR_GFX:
      case Startup.Status.ERROR_EMF:
        return "negative-progress-bar";
      default:
        throw new Error("Unhandled Startup Status");
    }
  }

  get actionLabel() {
    switch (this.status) {
      case Startup.Status.NEED_GFX_DIRECTORY:
        return "Open Settings";
      case Startup.Status.NEED_GFX_DIRECTORY_PERMISSION:
      case Startup.Status.NEED_ASSETS_DIRECTORY_PERMISSION:
        return "Grant Permission";
      case Startup.Status.ERROR_GFX:
        return "Retry";
      default:
        return null;
    }
  }

  get actionEventName() {
    switch (this.status) {
      case Startup.Status.NEED_GFX_DIRECTORY:
        return "settings";
      case Startup.Status.NEED_GFX_DIRECTORY_PERMISSION:
        return "request-gfx-directory-permission";
      case Startup.Status.NEED_ASSETS_DIRECTORY_PERMISSION:
        return "request-assets-directory-permission";
      case Startup.Status.ERROR_GFX:
        return "retry-gfx";
      default:
        return null;
    }
  }
}
