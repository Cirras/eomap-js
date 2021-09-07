import {
  css,
  customElement,
  html,
  LitElement,
  property,
  state,
} from "lit-element";

import "@spectrum-web-components/banner/sp-banner.js";
import "@spectrum-web-components/progress-bar/sp-progress-bar.js";

import "phaser";

import icon from "../assets/icon.svg";

import { EditorScene } from "../scenes/editor-scene";
import { patchPhaser } from "../patch-phaser";

import { GFXLoader } from "../gfx/load/gfx-loader";

@customElement("eomap-editor")
export class Editor extends LitElement {
  static EDITOR_ID = "phaser-container";

  static PHASER_DATA_KEYS = ["currentPos", "eyedrop"];

  static COMPONENT_DATA_KEYS = [
    "tool",
    "layerVisibility",
    "gfxLoader",
    "selectedLayer",
    "selectedGraphic",
  ];

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
      .editor {
        grid-column: 1;
        grid-row: 1;
      }
      .icon-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding-bottom: 64px;
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
    `;
  }

  @property({ type: GFXLoader })
  gfxLoader;

  @property({ type: Number })
  loadFail;

  @property({ type: String })
  tool;

  @property({ type: Array })
  layerVisibility;

  @property({ type: Number })
  selectedLayer;

  @property({ type: Number })
  selectedGraphic;

  @property({ type: Boolean })
  inputEnabled = true;

  @state({ type: Phaser.Game })
  game;

  componentDataForwarders = new Map();

  firstUpdated(changes) {
    super.firstUpdated(changes);
    patchPhaser();
  }

  onPostBoot(game) {
    let scene = game.scene.getScene("editor");

    this.setupPhaserChangeDataEvents(scene);
    this.setupComponentDataForwardingToPhaser(scene);

    scene.events.once("first-update", () => {
      this.game = game;
      this.updateInputEnabledState();
    });
  }

  setupPhaserChangeDataEvents(scene) {
    for (let key of Editor.PHASER_DATA_KEYS) {
      let eventName = "changedata-" + key;
      scene.data.events.on(eventName, (_parent, value, _previousValue) => {
        this.dispatchEvent(new CustomEvent(eventName, { detail: value }));
      });
    }
  }

  setupComponentDataForwardingToPhaser(scene) {
    for (let key of Editor.COMPONENT_DATA_KEYS) {
      scene.data.set(key, this[key]);
      this.componentDataForwarders.set(key, () => {
        scene.data.set(key, this[key]);
      });
    }
  }

  updateInputEnabledState() {
    if (this.game) {
      this.game.input.enabled = this.inputEnabled;
    }
  }

  async setupPhaser() {
    return new Phaser.Game({
      type: Phaser.AUTO,
      disableContextMenu: true,
      scale: {
        width: "100%",
        height: "100%",
        zoom: 1,
        parent: this.shadowRoot.querySelector("#" + Editor.EDITOR_ID),
        mode: Phaser.Scale.ScaleModes.RESIZE,
        resizeInterval: 16,
      },
      loader: {
        maxParallelDownloads: 100,
        async: true,
      },
      render: {
        pixelArt: true,
        powerPreference: "high-performance",
      },
      scene: [EditorScene],
      callbacks: {
        postBoot: this.onPostBoot.bind(this),
      },
    });
  }

  updated(changedProperties) {
    if (
      changedProperties.has("gfxLoader") &&
      this.gfxLoader &&
      this.loadFail === 0
    ) {
      this.setupPhaser();
    }

    if (changedProperties.has("inputEnabled")) {
      this.updateInputEnabledState();
    }

    for (let changed of changedProperties.keys()) {
      let dataForwarder = this.componentDataForwarders.get(changed);
      if (dataForwarder) {
        dataForwarder();
      }
    }
  }

  renderLogoWith(content) {
    return html`
      <div class="icon-container">
        <img src=${icon} class="icon"></img>
        ${content}
      </div>
    `;
  }

  renderLoadingContent() {
    let failed = this.loadFail > 0;
    let progressBarClass = failed
      ? "negative-progress-bar"
      : "positive-progress-bar";
    let label = failed
      ? `Failed to load ${this.loadFail} gfx file(s).`
      : "Loading...";

    return this.renderLogoWith(
      html`
        <sp-progress-bar
          class="${progressBarClass}"
          label="${label}"
          indeterminate
          over-background
        ></sp-progress-bar>
      `
    );
  }

  renderLoading() {
    if (!this.game) {
      return html` <div class="loading">${this.renderLoadingContent()}</div>`;
    }
  }

  render() {
    return html`
      ${this.renderLoading()}
      <div id="${Editor.EDITOR_ID}" class="editor"></div>
    `;
  }
}
