import { css, customElement, html, LitElement, property } from "lit-element";

@customElement("eomap-keybindings")
export class Keybindings extends LitElement {
  static get styles() {
    return css`
      :host {
        display: inline-table;
        border-collapse: separate;
        border-spacing: 13px 17px;
      }
      .keybinding-row {
        display: table-row;
        font-size: 13px;
        color: hsla(0, 0%, 100%, 0.5);
      }
      .keybinding-label {
        display: table-cell;
        text-align: right;
        letter-spacing: 0.04em;
      }
      .keybinding-cell {
        display: table-cell;
        text-align: left;
        margin-inline-start: 40px;
      }
      .keybinding {
        display: flex;
        align-items: center;
        line-height: 10px;
      }
      .keybinding-key {
        display: inline-block;
        border-style: solid;
        border-width: 1px;
        border-radius: 3px;
        vertical-align: middle;
        font-size: 11px;
        padding: 3px 5px;
        margin: 0 2px;
        background-color: rgba(128, 128, 128, 0.17);
        border-color: rgba(51, 51, 51, 0.6) rgba(51, 51, 51, 0.6)
          rgba(68, 68, 68, 0.6);
        box-shadow: rgb(0 0 0 / 36%) 0px -1px 0px inset;
      }
      .keybinding-separator {
        display: inline-block;
      }
    `;
  }

  @property({ type: Array })
  bindings = [];

  renderKeybindingParts(parts) {
    let result = [];
    for (let i = 0; i < parts.length; ++i) {
      if (i > 0) {
        result.push(html`<div class="keybinding-separator">+</div>`);
      }
      result.push(html`<div class="keybinding-key">${parts[i]}</div>`);
    }
    return result;
  }

  renderKeybinding(binding) {
    return html`
      <div class="keybinding-row">
        <div class="keybinding-label">${binding.label}</div>
        <div class="keybinding-cell">
          <div class="keybinding">
            ${this.renderKeybindingParts(binding.parts)}
          </div>
        </div>
      </div>
    `;
  }

  render() {
    return this.bindings.map((binding) => this.renderKeybinding(binding));
  }
}

export class Keybinding {
  constructor(label, parts) {
    this.label = label;
    this.parts = parts;
  }
}
