import { css } from "lit";
import { customElement } from "lit/decorators.js";

import { Textfield as SpectrumTextfield } from "@spectrum-web-components/textfield";

import { SHORT_MAX } from "../data/eo-numeric-limits";

@customElement("eomap-textfield")
export class Textfield extends SpectrumTextfield {
  static get styles() {
    return [
      super.styles,
      css`
        :host {
          --spectrum-alias-single-line-width: max(
            var(--spectrum-textfield-texticon-min-width),
            var(--spectrum-global-dimension-size-2400)
          );
        }
      `,
    ];
  }

  constructor() {
    super();
    this.allowedKeys =
      "\t !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuv" +
      "wxyz{|}~ €‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ ¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×" +
      "ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ";
    this.maxlength = SHORT_MAX - 1;
    this.addEventListener("keydown", this.onKeyDown);
  }

  onKeyDown(event) {
    if (event.code === "Enter" || event.code === "Space") {
      // This may seem a bit random, but it prevents accordian items from
      // swallowing Enter and Space inputs
      event.stopPropagation();
    }
  }
}
