import { css, customElement, html, LitElement, property } from "lit-element";

import "@spectrum-web-components/progress-bar/sp-progress-bar.js";
import "@spectrum-web-components/button/sp-button.js";

import icon from "../assets/icon.svg";

import { Keybinding } from "./keybindings";
import { MapState } from "../map-state";

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
      }
      .icon {
        width: 150px;
        height: 150px;
        padding-bottom: 30px;
      }
      .stalled-progress-bar {
        --spectrum-fieldlabel-m-text-color: var(
          --spectrum-global-color-gray-700
        );
        --spectrum-progressbar-m-over-background-track-fill-color: var(
          --spectrum-global-color-gray-700
        );
        --spectrum-progressbar-indeterminate-duration: 0ms;
      }
      .positive-progress-bar {
        --spectrum-fieldlabel-m-text-color: var(
          --spectrum-global-color-gray-700
        );
        --spectrum-progressbar-m-over-background-track-fill-color: var(
          --spectrum-global-color-gray-700
        );
      }
      .negative-progress-bar {
        --spectrum-fieldlabel-m-text-color: var(
          --spectrum-semantic-negative-color-status
        );
        --spectrum-progressbar-m-over-background-track-color: var(
          --spectrum-semantic-negative-color-status
        );
        --spectrum-progressbar-m-over-background-track-fill-color: var(
          --spectrum-semantic-negative-color-status
        );
        --spectrum-progressbar-m-over-background-track-fill-color: var(
          --spectrum-semantic-negative-color-status
        );
      }
      .action-button {
        margin-top: 25px;
      }
      .content-container {
        height: 150px;
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
          style="--spectrum-button-primary-text-padding-top: 0px;"
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

  renderContent() {
    if (this.status === Startup.Status.READY) {
      return html`
        <eomap-keybindings
          .bindings=${[
            new Keybinding("New Map", ["Ctrl", "Alt", "N"]),
            new Keybinding("Open Map", ["Ctrl", "O"]),
            new Keybinding("Settings", ["Ctrl", ","]),
          ]}
        >
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
          <img src=${icon} class="icon"></img>
          <div class="content-container">
            ${this.renderContent()}
          </div>
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
        return `Loading ${this.mapState.fileHandle.name}...`;
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
