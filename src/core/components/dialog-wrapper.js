import { css, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import { SpectrumElement } from "@spectrum-web-components/base";

import "@spectrum-web-components/theme/theme-dark.js";
import "@spectrum-web-components/theme/sp-theme.js";
import "@spectrum-web-components/underlay/sp-underlay.js";
import "@spectrum-web-components/button/sp-button.js";

import "./dialog";

import modalWrapperStyles from "@spectrum-web-components/modal/src/modal-wrapper.css.js";
import modalStyles from "@spectrum-web-components/modal/src/modal.css.js";
import { FocusVisiblePolyfillMixin } from "@spectrum-web-components/shared";

@customElement("eomap-dialog-wrapper")
export class DialogWrapper extends FocusVisiblePolyfillMixin(SpectrumElement) {
  static get styles() {
    return [
      modalWrapperStyles,
      modalStyles,
      css`
        .modal {
          border: 1px solid var(--spectrum-global-color-gray-50);
          overflow: visible;
        }
        sp-underlay {
          z-index: unset;
        }
      `,
    ];
  }

  @query("eomap-dialog")
  dialog;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: Boolean, reflect: true })
  error = false;

  @property({ attribute: "cancel-label" })
  cancelLabel = "";

  @property({ attribute: "confirm-label" })
  confirmLabel = "";

  @property({ type: Boolean, reflect: true, attribute: "no-divider" })
  noDivider = false;

  @property({ type: String })
  headline = "";

  focus() {
    if (this.shadowRoot) {
      const firstFocusable = this.shadowRoot.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [focusable]',
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
      }),
    );
  }

  clickCancel() {
    this.dispatchEvent(
      new Event("cancel", {
        bubbles: true,
      }),
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

  handleUnderlayTransitionEnd() {
    if (!this.open) {
      this.dispatchEvent(new Event("close"));
    }
  }

  render() {
    return html`
      <sp-underlay
        ?open=${this.open}
        @transitionend=${this.handleUnderlayTransitionEnd}
      >
      </sp-underlay>
      <sp-theme color="dark" scale="medium">
        <div class="modal">
          <eomap-dialog
            ?error=${this.error}
            .noDivider=${this.noDivider}
            style="width: var(--eomap-dialog-wrapper-width, 100%); --spectrum-dialog-confirm-title-text-font-weight: light;"
          >
            ${this.renderHeadline()}
            <slot></slot>
            ${this.renderCancel()} ${this.renderConfirm()}
          </eomap-dialog>
        </div>
      </sp-theme>
    `;
  }

  updated(changes) {
    if (changes.has("open")) {
      if (this.open) {
        this.dialog.updateComplete.then(() => {
          this.dialog.shouldManageTabOrderForScrolling();
        });
      } else {
        this.tabIndex = 0;
      }
    }
  }

  overlayWillCloseCallback() {
    if (this.open) {
      this.open = false;
      return true;
    }
    return false;
  }
}
