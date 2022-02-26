import { css } from "lit";
import { customElement } from "lit/decorators.js";
import { NumberField as SpectrumNumberField } from "@spectrum-web-components/number-field";

@customElement("eomap-number-field")
export class NumberField extends SpectrumNumberField {
  static get styles() {
    return [
      ...super.styles,
      css`
        :host {
          --spectrum-stepper-width: var(--spectrum-global-dimension-size-1200);
        }
      `,
    ];
  }

  constructor() {
    super();
    this.min = 0;
    this.stepModifier = 1;
    this.hideStepper = true;
    this.formatOptions = {
      maximumFractionDigits: 0,
    };
  }

  onInput() {
    super.onInput();
    this.invalid = false;
  }
}
