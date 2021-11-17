import { css, customElement } from "lit-element";

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

  min = 0;

  stepModifier = 1;

  hideStepper = true;

  formatOptions = {
    maximumFractionDigits: 0,
  };

  onInput() {
    super.onInput();
    this.invalid = false;
  }
}
