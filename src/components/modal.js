import {
  css,
  customElement,
  html,
  SpectrumElement,
  property,
  query,
  ifDefined,
} from "@spectrum-web-components/base";

import "@spectrum-web-components/theme/theme-dark.js";
import "@spectrum-web-components/theme/sp-theme.js";
import "@spectrum-web-components/underlay/sp-underlay.js";
import "@spectrum-web-components/button/sp-button.js";
import "@spectrum-web-components/dialog/sp-dialog.js";

import styles from "@spectrum-web-components/modal/src/modal.css.js";
import { FocusVisiblePolyfillMixin } from "@spectrum-web-components/shared";

@customElement("eomap-modal")
export class Modal extends FocusVisiblePolyfillMixin(SpectrumElement) {
  static get styles() {
    return [
      styles,
      css`
        :host {
          --spectrum-dialog-confirm-overlay-background-color: rgba(
            0,
            0,
            0,
            0.75
          );
          --spectrum-button-secondary-m-background-color: var(
            --spectrum-global-color-gray-400
          );
          --spectrum-button-secondary-m-border-color: var(
            --spectrum-global-color-gray-400
          );
          --spectrum-button-secondary-m-background-color-hover: var(
            --spectrum-global-color-gray-500
          );
          --spectrum-button-secondary-m-border-color-hover: var(
            --spectrum-global-color-gray-500
          );
          --spectrum-button-secondary-m-background-color-down: var(
            --spectrum-global-color-gray-300
          );
          --spectrum-button-secondary-m-border-color-down: var(
            --spectrum-global-color-gray-300
          );
          --spectrum-button-secondary-m-background-color-key-focus: var(
            --spectrum-global-color-gray-500
          );
          --spectrum-button-secondary-m-border-color-key-focus: var(
            --spectrum-global-color-gray-500
          );
          --spectrum-button-secondary-m-text-color-down: var(
            --spectrum-global-color-gray-800
          );
          --spectrum-button-secondary-m-text-color-hover: var(
            --spectrum-global-color-gray-800
          );
          --spectrum-button-secondary-m-text-color-key-focus: var(
            --spectrum-global-color-gray-800
          );
        }

        sp-theme {
          z-index: 2;
        }
      `,
    ];
  }

  @property({ type: Boolean, reflect: true })
  error = false;

  @property({ attribute: "cancel-label" })
  cancelLabel = "";

  @property({ attribute: "confirm-label" })
  confirmLabel = "";

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, reflect: true })
  size;

  @property()
  headline = "";

  @query("sp-dialog")
  dialog;

  focus() {
    if (this.shadowRoot) {
      const firstFocusable = this.shadowRoot.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [focusable]'
      );
      if (firstFocusable) {
        if (firstFocusable.updateComplete) {
          firstFocusable.updateComplete.then(() => firstFocusable.focus());
        } else {
          firstFocusable.focus();
        }
        this.removeAttribute("tabindex");
      } else {
        this.dialog.focus();
      }
    } else {
      super.focus();
    }
  }

  clickConfirm() {
    this.dispatchEvent(
      new Event("confirm", {
        bubbles: true,
      })
    );
  }

  clickCancel() {
    this.dispatchEvent(
      new Event("cancel", {
        bubbles: true,
      })
    );
  }

  renderHeadline() {
    if (this.headline) {
      return html` <h2 slot="heading">${this.headline}</h2>`;
    }
  }

  renderCancel() {
    if (this.cancelLabel) {
      return html`
        <sp-button variant="secondary" slot="button" @click=${this.clickCancel}>
          ${this.cancelLabel}
        </sp-button>
      `;
    }
  }

  renderConfirm() {
    if (this.confirmLabel) {
      return html`
        <sp-button variant="cta" slot="button" @click=${this.clickConfirm}>
          ${this.confirmLabel}
        </sp-button>
      `;
    }
  }

  render() {
    return html`
      <sp-underlay ?open=${this.open}> </sp-underlay>
      <sp-theme color="dark" scale="medium">
        <div class="modal">
          <sp-dialog
            ?error=${this.error}
            size=${ifDefined(this.size ? this.size : undefined)}
          >
            ${this.renderHeadline()}
            <slot></slot>
            ${this.renderCancel()} ${this.renderConfirm()}
          </sp-dialog>
        </div>
      </sp-theme>
    `;
  }

  updated(changes) {
    if (changes.has("open") && this.open) {
      this.dialog.updateComplete.then(() => {
        this.dialog.shouldManageTabOrderForScrolling();
      });
    }
  }
}
