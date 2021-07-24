import { css, customElement, html, LitElement, property } from "lit-element";

import "phaser";

import { Boot } from "../scenes/boot";
import { Preloader } from "../scenes/preloader";
import { Controller } from "../scenes/controller";
import { patchPhaser } from "../patch-phaser";

import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import ScrollerPlugin from "phaser3-rex-plugins/plugins/scroller-plugin";
import SliderPlugin from "phaser3-rex-plugins/plugins/slider-plugin";

@customElement("eomap-editor")
export class Editor extends LitElement {
  static EDITOR_ID = "phaser-container";

  static PHASER_DATA_KEYS = ["currentPos"];

  static COMPONENT_DATA_KEYS = ["tool", "layerVisibility"];

  static get styles() {
    return css`
      .editor {
        overflow: hidden;
        width: 100%;
        height: 100%;
      }
    `;
  }

  @property({ type: String })
  tool;

  @property({ type: Array })
  layerVisibility;

  componentDataForwarders = new Map();

  firstUpdated(changes) {
    super.firstUpdated(changes);
    patchPhaser();
    return new Phaser.Game({
      type: Phaser.AUTO,
      disableContextMenu: true,
      scale: {
        width: "100%",
        height: "100%",
        zoom: 1,
        parent: this.shadowRoot.querySelector("#" + Editor.EDITOR_ID),
        mode: Phaser.Scale.ScaleModes.RESIZE,
        resizeInterval: 250,
      },
      loader: {
        maxParallelDownloads: 100,
        async: true,
      },
      render: {
        pixelArt: true,
        powerPreference: "high-performance",
      },
      scene: [Boot, Preloader, Controller],
      callbacks: {
        postBoot: this.onPostBoot.bind(this),
      },
      plugins: {
        scene: [
          {
            key: "rexUI",
            plugin: UIPlugin,
            mapping: "rexUI",
          },
          {
            key: "scroller",
            plugin: ScrollerPlugin,
            mapping: "scroller",
            start: true,
          },
          {
            key: "slider",
            plugin: SliderPlugin,
            mapping: "slider",
            start: true,
          },
        ],
      },
    });
  }

  onPostBoot(game) {
    let scene = game.scene.getScene("controller");
    this.setupPhaserChangeDataEvents(scene);
    this.setupComponentDataForwardingToPhaser(scene);
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

  updated(changedProperties) {
    for (let changed of changedProperties.keys()) {
      let dataForwarder = this.componentDataForwarders.get(changed);
      if (dataForwarder) {
        dataForwarder();
      }
    }
  }

  render() {
    return html`<div id="${Editor.EDITOR_ID}" class="editor"></div> `;
  }
}
