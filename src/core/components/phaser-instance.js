import { css, html, LitElement } from "lit";
import { property, query, state } from "lit/decorators.js";

import "phaser";
import { RenderControlPlugin } from "../plugins/render-control-plugin";

import { GFXLoader } from "../gfx/load/gfx-loader";
import { DevicePixelRatioObserver } from "../util/device-pixel-ratio-observer";

export class PhaserInstance extends LitElement {
  static get styles() {
    return css`
      #phaser-container {
        width: 100%;
        height: 100%;
      }
    `;
  }

  @query(`#phaser-container`)
  phaserContainer;

  @property({ type: GFXLoader })
  gfxLoader;

  @property({ type: Boolean })
  pointerEnabled = true;

  @property({ type: Boolean })
  keyboardEnabled = true;

  @state({ type: Phaser.Game })
  game;

  renderControlPluginKey = Phaser.Utils.String.UUID() + "_RenderControlPlugin";
  componentDataForwarders = new Map();
  resizeObserver = null;
  devicePixelRatioObserver = null;

  setupFramebufferPerformanceHack(game) {
    // HACK: checkFramebufferStatus is pretty expensive and gets called every
    //       time a framebuffer is created by Phaser's WebGLRenderer.
    //
    //       eomap-js uses RenderTextures for the eomap and cursor components,
    //       which use framebuffers under the hood on WebGL.
    //
    //       In the interest of performance, we're going to just fudge the
    //       result of checkFramebufferStatus and always assume that we've
    //       created a valid/complete framebuffer.
    let gl = game.renderer.gl;
    if (gl) {
      gl.checkFramebufferStatus = (_target) => gl.FRAMEBUFFER_COMPLETE;
    }
  }

  setupPhaserChangeDataEvents(scene) {
    for (let key of this.phaserDataKeys) {
      let eventName = "changedata-" + key;
      scene.data.events.on(eventName, (_parent, value, _previousValue) => {
        this.dispatchEvent(new CustomEvent(eventName, { detail: value }));
      });
    }
  }

  setupComponentDataForwardingToPhaser(scene) {
    this.componentDataForwarders = new Map();
    for (let key of this.componentDataKeys) {
      scene.data.set(key, this[key]);
      this.componentDataForwarders.set(key, () => {
        scene.data.set(key, this[key]);
      });
    }
  }

  setupResizeObserver() {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (this.game) {
          let width = Math.ceil(entry.borderBoxSize[0].inlineSize);
          let height = Math.ceil(entry.borderBoxSize[0].blockSize);
          this.updateSize(width, height);
        }
      }
    });
    this.resizeObserver.observe(this.phaserContainer);
  }

  setupDevicePixelRatioObserver() {
    this.devicePixelRatioObserver = new DevicePixelRatioObserver();
    this.devicePixelRatioObserver.on(
      "change",
      this.updateDevicePixelRatio,
      this
    );
  }

  updateSize(width, height) {
    this.game.events.once(Phaser.Core.Events.PRE_STEP, () => {
      this.game.canvas.style.width = "";
      this.game.canvas.style.height = "";
      this.game.scale.resize(width, height);
    });
  }

  updateDevicePixelRatio(devicePixelRatio) {
    this.game.scale.setZoom(devicePixelRatio);
    this.game.canvas.style.position = "absolute";
    this.game.canvas.style.transform = `scale(${1 / devicePixelRatio})`;
    this.game.canvas.style.transformOrigin = "top left";
    if (!Number.isInteger(devicePixelRatio) || this.game.config.antialias) {
      Phaser.Display.Canvas.CanvasInterpolation.setBicubic(this.game.canvas);
    } else {
      Phaser.Display.Canvas.CanvasInterpolation.setCrisp(this.game.canvas);
    }
  }

  updateInputEnabledState() {
    if (this.game) {
      let input = this.game.input;

      if (input.mouse) {
        input.mouse.enabled = this.pointerEnabled;
      }

      if (input.touch) {
        input.touch.enabled = this.pointerEnabled;
      }

      if (input.keyboard) {
        input.keyboard.enabled = this.keyboardEnabled;
      }
    }
  }

  setupPhaser() {
    let game = new Phaser.Game(this.config);
    let scene = this.createScene();
    let sceneKey = scene.sys.settings.key;

    game.events.once("ready", () => {
      game.scene.add(sceneKey, scene);

      scene.sys.events.once("ready", () => {
        this.setupFramebufferPerformanceHack(game);
        this.setupPhaserChangeDataEvents(scene);
        this.setupComponentDataForwardingToPhaser(scene);
        this.setupResizeObserver();
        this.setupDevicePixelRatioObserver();
        this.onSceneReady(scene);

        this.game = game;

        let sizeRect = this.phaserContainer.getBoundingClientRect();
        this.updateSize(sizeRect.width, sizeRect.height);

        let devicePixelRatio = this.devicePixelRatioObserver.devicePixelRatio;
        this.updateDevicePixelRatio(devicePixelRatio);

        this.updateInputEnabledState();
      });

      game.scene.start(sceneKey);
    });
  }

  destroyResizeObserver() {
    this.resizeObserver.disconnect();
    this.resizeObserver.unobserve(this.phaserContainer);
    this.resizeObserver = null;
  }

  destroyDevicePixelRatioObserver() {
    this.devicePixelRatioObserver.disconnect();
    this.devicePixelRatioObserver.removeAllListeners();
    this.devicePixelRatioObserver = null;
  }

  destroyPhaser() {
    if (this.game) {
      this.componentDataForwarders.clear();
      this.destroyResizeObserver();
      this.destroyDevicePixelRatioObserver();
      // The canvas and WebGLRendererContext won't be cleaned up properly
      // unless this touchcancel event listener is removed.
      //
      // Fixed in Phaser 3.60.
      // See: https://github.com/photonstorm/phaser/pull/5921
      if (window) {
        window.removeEventListener(
          "touchcancel",
          this.game.input.touch.onTouchCancelWindow
        );
      }
      this.game.destroy(true);
      Phaser.Plugins.PluginCache.removeCustom(this.renderControlPluginKey);
      this.game = null;
    }
  }

  updated(changedProperties) {
    if (
      changedProperties.has("pointerEnabled") ||
      changedProperties.has("keyboardEnabled")
    ) {
      this.updateInputEnabledState();
    }

    for (let changed of changedProperties.keys()) {
      let dataForwarder = this.componentDataForwarders.get(changed);
      if (dataForwarder) {
        dataForwarder();
      }
    }
  }

  render() {
    return html` <div id="phaser-container"></div> `;
  }

  disconnectedCallback() {
    this.destroyPhaser();
    super.disconnectedCallback();
  }

  createScene() {
    throw new Error("PhaserInstance.createScene() must be implemented");
  }

  onSceneReady(_scene) {
    // do nothing
  }

  get phaserDataKeys() {
    return [];
  }

  get componentDataKeys() {
    return [];
  }

  get config() {
    return {
      type: Phaser.AUTO,
      disableContextMenu: true,
      banner: false,
      scale: {
        parent: this.phaserContainer,
        width: "100%",
        height: "100%",
      },
      render: {
        antialias: false,
        powerPreference: "high-performance",
      },
      input: {
        mouse: {
          preventDefaultWheel: false,
          preventDefaultDown: false,
          preventDefaultMove: false,
          preventDefaultUp: false,
        },
        touch: {
          capture: false,
        },
      },
      audio: {
        noAudio: true,
      },
      plugins: {
        global: [
          {
            key: this.renderControlPluginKey,
            plugin: RenderControlPlugin,
            mapping: "render",
          },
        ],
      },
    };
  }
}
