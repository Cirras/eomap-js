import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { MnemonicData } from "../util/mnemonic-data";

@customElement("eomap-mnemonic-label")
export class MnemonicLabel extends LitElement {
  static get styles() {
    return css`
      :host {
        display: flex;
      }
      :host([show-mnemonics]) .mnemonic {
        text-decoration: underline;
      }
      span {
        white-space: pre;
      }
    `;
  }

  @property({ type: MnemonicData })
  data = new MnemonicData("");

  @property({ type: Boolean, reflect: true, attribute: "show-mnemonics" })
  showMnemonics = false;

  constructor() {
    super();
    this.ariaHidden = true;
  }

  render() {
    let index = this.data.index;
    let string = this.data.string;

    let result = [];

    if (index === null) {
      result.push(html`<span>${string}</span>`);
    } else {
      if (index > 0) {
        result.push(html`<span>${string.substring(0, index)}</span>`);
      }

      result.push(
        html`
          <span class="mnemonic" aria-hidden="true">${this.data.mnemonic}</span>
        `
      );

      if (index < string.length - 1) {
        result.push(html`<span>${string.substring(index + 1)}</span>`);
      }
    }

    return result;
  }
}
