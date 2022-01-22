import { css, customElement, html, LitElement, property } from "lit-element";

import "@spectrum-web-components/progress-bar/sp-progress-bar.js";

import icon from "../assets/icon.svg";

import { Keybinding } from "./keybindings";

@customElement("eomap-startup")
export class Startup extends LitElement {
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
      .content-container {
        height: 150px;
      }
    `;
  }

  @property({ type: Boolean })
  loading = false;

  @property({ type: String })
  loadingLabel = "Loading...";

  @property({ type: Boolean })
  loadingError = false;

  renderContent() {
    if (this.loading) {
      return html`
        <sp-progress-bar
          class="${this.loadingError
            ? "negative-progress-bar"
            : "positive-progress-bar"}"
          label="${this.loadingLabel}"
          indeterminate
          over-background
        ></sp-progress-bar>
      `;
    } else {
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
}
