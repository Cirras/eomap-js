import {
  css,
  customElement,
  html,
  LitElement,
  property,
  query,
  state,
} from "lit-element";

import "@spectrum-web-components/action-group/sp-action-group";
import "@spectrum-web-components/action-button/sp-action-button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@spectrum-web-components/icons-workflow";

import "./sidebar-button";

import "phaser";
import { PaletteScene } from "../scenes/palette-scene";

import { GFXLoader } from "../gfx/load/gfx-loader";
import { Eyedrop } from "../eyedrop";

@customElement("eomap-palette")
export class Palette extends LitElement {
  static PHASER_CONTAINER_ID = "phaser-palette";

  static PHASER_DATA_KEYS = ["selectedGraphic", "contentHeight"];

  static COMPONENT_DATA_KEYS = ["gfxLoader", "selectedLayer", "eyedrop"];

  static get styles() {
    return css`
      :host {
        display: grid;
        grid-template-rows: min-content minmax(0, 1fr);
        width: var(--spectrum-global-dimension-size-4600);
        background-color: var(--spectrum-global-color-gray-400);
      }
      .palette-header {
        display: grid;
        grid-template-columns: min-content minmax(0, 1fr) min-content;
        padding-top: var(--spectrum-global-dimension-size-100);
        padding-bottom: var(--spectrum-global-dimension-size-100);
      }
      #palette-content {
        width: auto;
        height: auto;
        padding: var(--spectrum-global-dimension-size-50);
        margin-left: var(--spectrum-global-dimension-size-50);
        margin-right: var(--spectrum-global-dimension-size-50);
        margin-bottom: var(--spectrum-global-dimension-size-50);
        background-color: var(--spectrum-global-color-gray-75);
        overflow-y: scroll;
      }
      .palette-viewport {
        width: 100%;
        position: -webkit-sticky;
        position: sticky;
        top: 0;
      }
      .scroll-arrow {
        --spectrum-actionbutton-m-quiet-background-color: var(
          --spectrum-global-color-gray-400
        );
        --spectrum-actionbutton-m-quiet-background-color-down: var(
          --spectrum-global-color-gray-400
        );
        --spectrum-actionbutton-m-icon-color-disabled: var(
          --spectrum-global-color-gray-300
        );
      }
      #layer-buttons {
        display: flex;
        flex-wrap: nowrap;
        overflow-x: scroll;
        overflow: -moz-scrollbars-none;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
      }
      #layer-buttons::-webkit-scrollbar {
        width: 0 !important;
        display: none;
      }
      sp-action-button {
        --spectrum-actionbutton-m-background-color: var(
          --spectrum-global-color-gray-400
        );
        --spectrum-actionbutton-m-border-color: var(
          --spectrum-global-color-gray-300
        );
        --spectrum-actionbutton-m-background-color-hover: var(
          --spectrum-global-color-gray-400
        );
        --spectrum-actionbutton-m-border-color-hover: var(
          --spectrum-global-color-gray-300
        );
        --spectrum-actionbutton-m-background-color-key-focus: var(
          --spectrum-global-color-gray-400
        );
        --spectrum-actionbutton-m-background-color-down: var(
          --spectrum-global-color-gray-300
        );
        --spectrum-actionbutton-m-border-color-down: var(
          --spectrum-global-color-gray-300
        );
        --spectrum-actionbutton-m-border-color-selected: var(
          --spectrum-global-color-gray-300
        );
        --spectrum-actionbutton-m-border-color-selected-hover: var(
          --spectrum-global-color-gray-300
        );
      }
      ::-webkit-scrollbar {
        background-color: var(--spectrum-global-color-gray-200);
        border: var(--spectrum-global-dimension-size-25)
          var(--spectrum-global-color-gray-75) solid;
        border-radius: var(--spectrum-global-dimension-size-185);
        width: var(--spectrum-global-dimension-size-185);
      }
      ::-webkit-scrollbar-thumb {
        background: var(--spectrum-global-color-gray-400);
        background-clip: content-box;
        border: var(--spectrum-global-dimension-size-25) transparent solid;
        border-radius: var(--spectrum-global-dimension-size-185);
        min-height: var(--spectrum-global-dimension-size-250);
        width: var(--spectrum-global-dimension-size-185);
      }
      ::-webkit-scrollbar-thumb:hover {
        background: var(--spectrum-global-color-gray-500);
        background-clip: content-box;
      }
      ::-webkit-scrollbar-resizer {
        display: none;
        width: 0px;
        background-color: transparent;
      }
      ::-webkit-scrollbar-button {
        height: 0px;
      }
      ::-webkit-scrollbar-corner {
        display: none;
      }
    `;
  }

  @query("#layer-buttons", true)
  layerButtons;

  @query("#palette-content", true)
  paletteContent;

  @property({ type: GFXLoader })
  gfxLoader;

  @property({ type: Number })
  selectedLayer;

  @property({ type: Number })
  selectedGraphic;

  @property({ type: Eyedrop })
  eyedrop = null;

  @state({ type: Boolean })
  leftArrowEnabled = false;

  @state({ type: Boolean })
  rightArrowEnabled = false;

  @state({ type: Number })
  viewportHeight;

  @state({ type: Number })
  contentHeight = 0;

  @state({ type: Function })
  onPaletteContentScroll = null;

  @state({ type: Phaser.Game })
  game;

  componentDataForwarders = new Map();

  headerScrolling = false;
  headerScrollStartTimestamp = null;

  onResize = (_event) => {
    this.updateViewportHeight();
  };

  async firstUpdated(changes) {
    super.firstUpdated(changes);

    const children = this.shadowRoot.querySelectorAll("*");
    await Promise.all(Array.from(children).map((c) => c.updateComplete));

    this.preventLayerButtonsFromSwallowingKeyDownInputs();
    this.checkLayerButtonsArrows();
    this.updateViewportHeight();
  }

  setupPhaserChangeDataEvents(scene) {
    for (let key of Palette.PHASER_DATA_KEYS) {
      scene.data.set(key, null);
      let eventName = "changedata-" + key;
      scene.data.events.on(eventName, (_parent, value, _previousValue) => {
        this.dispatchEvent(new CustomEvent(eventName, { detail: value }));
      });
    }
  }

  setupComponentDataForwardingToPhaser(scene) {
    for (let key of Palette.COMPONENT_DATA_KEYS) {
      scene.data.set(key, this[key]);
      this.componentDataForwarders.set(key, () => {
        scene.data.set(key, this[key]);
      });
    }
  }

  setupContentScrollMirroring(scene) {
    scene.data.set("contentScroll", 0);
    this.onPaletteContentScroll = (_event) => {
      scene.data.set("contentScroll", this.paletteContent.scrollTop);
    };

    scene.data.events.on(
      "changedata-contentScroll",
      (_parent, value, previousValue) => {
        if (value !== previousValue) {
          this.paletteContent.scrollTop = value;
        }
      }
    );
  }

  setupContentHeightListener() {
    this.addEventListener("changedata-contentHeight", (event) => {
      this.contentHeight = event.detail;
    });
  }

  async setupPhaser() {
    let game = new Phaser.Game({
      type: Phaser.AUTO,
      disableContextMenu: true,
      banner: false,
      scale: {
        width: "100%",
        height: "100%",
        parent: this.shadowRoot.querySelector(
          "#" + Palette.PHASER_CONTAINER_ID
        ),
        mode: Phaser.Scale.ScaleModes.RESIZE,
        resizeInterval: 250,
      },
      render: {
        pixelArt: true,
        powerPreference: "high-performance",
        transparent: true,
      },
      input: {
        keyboard: false,
        mouse: {
          preventDefaultWheel: false,
          preventDefaultDown: false,
          preventDefaultUp: false,
        },
        touch: {
          capture: false,
        },
      },
    });

    game.events.once("ready", () => {
      let scene = new PaletteScene();
      game.scene.add("palette", scene);

      scene.sys.events.once("ready", () => {
        this.setupPhaserChangeDataEvents(scene);
        this.setupComponentDataForwardingToPhaser(scene);
        this.setupContentScrollMirroring(scene);
        this.setupContentHeightListener(scene);
        this.game = game;
      });

      game.scene.start("palette");
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

    for (let changed of changedProperties.keys()) {
      let dataForwarder = this.componentDataForwarders.get(changed);
      if (dataForwarder) {
        dataForwarder();
      }
    }
  }

  renderLayerButtons() {
    const LAYER_NAMES = [
      "Ground",
      "Objects",
      "Overlay",
      "Down Wall",
      "Right Wall",
      "Roof",
      "Top",
      "Shadow",
      "Overlay 2",
      "Special",
    ];

    return LAYER_NAMES.map((label, i) => {
      return html`
        <sp-action-button
          value="${i}"
          ?selected=${this.selectedLayer === i}
          @click=${this.onLayerClick}
        >
          ${label}
        </sp-action-button>
      `;
    });
  }

  render() {
    return html`
      <div class="palette-header">
        <sp-action-button
          class="scroll-arrow"
          quiet
          ?disabled=${!this.leftArrowEnabled}
          @pointerdown=${this.onLeftArrowPointerDown}
          @pointerup=${this.onArrowPointerUp}
          @pointerout=${this.onArrowPointerUp}
        >
          <sp-icon slot="icon">${ChevronLeftIcon()}</sp-icon">
        </sp-action-button>
        <sp-action-group
          id="layer-buttons"
          compact
          @scroll=${this.onLayerButtonsScroll}
        >
          ${this.renderLayerButtons()}
        </sp-action-group>
        <sp-action-button
          class="scroll-arrow"
          quiet
          ?disabled=${!this.rightArrowEnabled}
          @pointerdown=${this.onRightArrowPointerDown}
          @pointerup=${this.onArrowPointerUp}
          @pointerout=${this.onArrowPointerUp}
        >
          <sp-icon slot="icon">${ChevronRightIcon()}</sp-icon">
        </sp-action-button>
      </div>
      <div id="palette-content" @scroll=${this.onPaletteContentScroll}>
        <div style="width: 100%; height: ${this.contentHeight}px">
          <div class="palette-viewport" style="height: ${
            this.viewportHeight
          }px">
            <div id="${Palette.PHASER_CONTAINER_ID}"></div>
          </div>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("resize", this.onResize);
  }
  disconnectedCallback() {
    window.removeEventListener("resize", this.onResize);
    super.disconnectedCallback();
  }

  updateViewportHeight() {
    let paletteContent = this.paletteContent;
    if (paletteContent) {
      let style = getComputedStyle(paletteContent);
      this.viewportHeight =
        paletteContent.clientHeight -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom);
    }
  }

  onLeftArrowPointerDown() {
    this.onArrowPointerDown(-1);
  }

  onRightArrowPointerDown() {
    this.onArrowPointerDown(1);
  }

  onArrowPointerDown(direction) {
    this.scrollingHeader = true;
    let startValue = this.layerButtons.scrollLeft;
    requestAnimationFrame((timestamp) => {
      this.scrollHeader(timestamp, startValue, direction);
    });
  }

  onArrowPointerUp() {
    this.scrollingHeader = false;
    this.headerScrollStartTimestamp = null;
  }

  scrollHeader(timestamp, startValue, direction) {
    if (this.scrollingHeader) {
      if (this.headerScrollStartTimestamp == null) {
        this.headerScrollStartTimestamp = timestamp;
      }

      let delta = timestamp - this.headerScrollStartTimestamp;
      let scrollValue = startValue + (delta / 2) * direction;
      this.layerButtons.scrollLeft = scrollValue;

      requestAnimationFrame((t) => this.scrollHeader(t, startValue, direction));
    }
  }

  onLayerButtonsScroll(_event) {
    this.checkLayerButtonsArrows();
  }

  preventLayerButtonsFromSwallowingKeyDownInputs() {
    this.layerButtons.addEventListener("focusin", () => {
      this.layerButtons.dispatchEvent(new CustomEvent("focusout"));
    });
  }

  checkLayerButtonsArrows() {
    let element = this.layerButtons;
    this.leftArrowEnabled = element.scrollLeft > 0;
    this.rightArrowEnabled =
      element.scrollLeft + element.offsetWidth !== element.scrollWidth;
  }

  onLayerClick(event) {
    event.preventDefault();
    this.dispatchEvent(
      new CustomEvent("layer-selected", {
        detail: parseInt(event.target.value),
      })
    );
  }
}
