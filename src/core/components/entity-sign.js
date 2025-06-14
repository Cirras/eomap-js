import { html, LitElement } from "lit";
import { customElement, property, query } from "lit/decorators.js";

import "@spectrum-web-components/field-group/sp-field-group.js";
import "@spectrum-web-components/field-label/sp-field-label.js";

import "./modal";
import "./textfield";

@customElement("eomap-entity-sign")
export class EntitySign extends LitElement {
  @query("#title", true)
  title;

  @query("#message", true)
  message;

  @property({ type: Boolean, reflect: true })
  open = false;

  @property({ type: String, reflect: true })
  headline;

  render() {
    return html`
      <eomap-modal
        confirm-label="Save"
        cancel-label="Cancel"
        .headline=${this.headline}
        .open=${this.open}
        @confirm=${this.confirm}
        @cancel=${this.cancel}
        @close=${this.close}
      >
        <style>
          eomap-textfield {
            --spectrum-alias-single-line-width: 208px;
            margin-bottom: 15px;
          }
        </style>
        <sp-field-label for="title">Title</sp-field-label>
        <eomap-textfield id="title" grows multiline></eomap-textfield>
        <sp-field-label for="message">Message</sp-field-label>
        <eomap-textfield id="message" grows multiline></eomap-textfield>
      </eomap-modal>
    `;
  }

  reset() {
    this.title.value = "";
    this.message.value = "";
  }

  populate(sign) {
    this.title.value = sign.title;
    this.message.value = sign.message;
  }

  confirm(_event) {
    this.open = false;
    this.dispatchEvent(
      new CustomEvent("save", {
        detail: {
          title: this.title.displayValue,
          message: this.message.displayValue,
        },
      }),
    );
  }

  cancel(_event) {
    this.open = false;
  }

  close(_event) {
    this.open = false;
    this.dispatchEvent(new CustomEvent("close"));
  }
}
