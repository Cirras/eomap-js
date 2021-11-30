import { customElement, html } from "lit-element";

import { ifDefined } from "lit-html/directives/if-defined";
import { Textfield as SpectrumTextfield } from "@spectrum-web-components/textfield";

import { SHORT_MAX } from "../data/eo-numeric-limits";

@customElement("eomap-textfield")
export class Textfield extends SpectrumTextfield {
  allowedKeys =
    "\t !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuv" +
    "wxyz{|}~ €‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ ¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×" +
    "ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ";

  maxlength = SHORT_MAX - 1;

  constructor() {
    super();
    this.addEventListener("keydown", this.onKeyDown);
  }

  onKeyDown(event) {
    if (event.code === "Enter" || event.code === "Space") {
      // This may seem a bit random, but it prevents accordian items from
      // swallowing Enter and Space inputs
      event.stopPropagation();
    }
  }

  renderSizer() {
    if (this.grows && !this.quiet) {
      return html`<div id="sizer">&ZeroWidthSpace;${this.value}</div>`;
    }
  }

  get renderMultiline() {
    return html`
      ${this.renderSizer()}
      <textarea
        aria-label=${this.label || this.placeholder}
        aria-invalid=${ifDefined(this.invalid || undefined)}
        class="input"
        maxlength=${ifDefined(this.maxlength > -1 ? this.maxlength : undefined)}
        minlength=${ifDefined(this.minlength > -1 ? this.minlength : undefined)}
        pattern=${ifDefined(this.pattern)}
        placeholder=${this.placeholder}
        .value=${this.displayValue}
        @change=${this.onChange}
        @input=${this.onInput}
        @focus=${this.onFocus}
        @blur=${this.onBlur}
        ?disabled=${this.disabled}
        ?required=${this.required}
        ?readonly=${this.readonly}
        autocomplete=${ifDefined(this.autocomplete)}
      ></textarea>
    `;
  }
}
