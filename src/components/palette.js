import "@spectrum-web-components/action-group/sp-action-group";
import "@spectrum-web-components/action-button/sp-action-button";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@spectrum-web-components/icons-workflow";
import { css, customElement, html, LitElement, state } from "lit-element";

import "./sidebar-button";

@customElement("eomap-palette")
export class Palette extends LitElement {
  static get styles() {
    return css`
      :host {
        display: grid;
        grid-template-rows: min-content 1fr;
        width: var(--spectrum-global-dimension-size-5000);
        background-color: var(--spectrum-global-color-gray-400);
      }
      .palette-header {
        display: grid;
        grid-template-columns: min-content minmax(0, 1fr) min-content;
        padding-top: var(--spectrum-global-dimension-size-100);
        padding-bottom: var(--spectrum-global-dimension-size-100);
      }
      .palette-content {
        width: auto;
        height: auto;
        background-color: var(--spectrum-global-color-gray-75);
        margin-left: var(--spectrum-global-dimension-size-50);
        margin-right: var(--spectrum-global-dimension-size-50);
        margin-bottom: var(--spectrum-global-dimension-size-50);
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
    `;
  }

  @state({ type: Number })
  selectedLayer = 0;

  @state({ type: Boolean })
  leftArrowEnabled = false;

  @state({ type: Boolean })
  rightArrowEnabled = false;

  headerScrolling = false;
  headerScrollStartTimestamp = null;

  async firstUpdated(changes) {
    super.firstUpdated(changes);
    const children = this.shadowRoot.querySelectorAll("*");
    await Promise.all(Array.from(children).map((c) => c.updateComplete));
    this.checkLayerButtonsArrows();
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
          @click=${() => {
            this.selectedLayer = i;
          }}
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
      <div class="palette-content">
      </div>
    `;
  }

  getHeaderScrollElement() {
    return this.shadowRoot.querySelector("#layer-buttons");
  }

  onLeftArrowPointerDown() {
    this.onArrowPointerDown(-1);
  }

  onRightArrowPointerDown() {
    this.onArrowPointerDown(1);
  }

  onArrowPointerDown(direction) {
    this.scrollingHeader = true;
    let startValue = this.getHeaderScrollElement().scrollLeft;
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
      this.getHeaderScrollElement().scrollLeft = scrollValue;

      requestAnimationFrame((t) => this.scrollHeader(t, startValue, direction));
    }
  }

  onLayerButtonsScroll(_event) {
    this.checkLayerButtonsArrows();
  }

  checkLayerButtonsArrows() {
    let element = this.getHeaderScrollElement();
    this.leftArrowEnabled = element.scrollLeft > 0;
    this.rightArrowEnabled =
      element.scrollLeft + element.offsetWidth !== element.scrollWidth;
  }
}
