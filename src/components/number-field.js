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
          --spectrum-stepper-quiet-width: 100%;
        }
        input {
          text-align: var(--number-field-text-align, start);
        }
      `,
    ];
  }

  constructor() {
    super();
    this.min = 0;
    this.hideStepper = true;
    this.formatOptions = {
      maximumFractionDigits: 0,
    };
  }

  onInput() {
    super.onInput();
    this.invalid = false;
  }

  onScroll(event) {
    event.preventDefault();
    const direction = event.deltaY / Math.abs(event.deltaY);
    if (direction !== 0 && !isNaN(direction)) {
      this.stepBy(-direction * (event.shiftKey ? this.stepModifier : 1));
    }
  }
}
