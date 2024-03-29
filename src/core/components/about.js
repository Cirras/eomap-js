import { html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

import "@spectrum-web-components/action-button/sp-action-button.js";

import "./modal";
import AppIcon from "../assets/icon.svg";

@customElement("eomap-about")
export class About extends LitElement {
  @property({ type: Boolean, reflect: true })
  open = false;

  render() {
    return html`
      <eomap-modal
        headline="About"
        .noDivider=${true}
        .open=${this.open}
        .width=${300}
        @confirm=${this.confirm}
        @close=${this.close}
      >
        <style>
          .icon-container {
            display: flex;
            justify-content: center;
            margin-bottom: var(--spectrum-global-dimension-size-175);
          }
          .button-container {
            display: flex;
            justify-content: center;
            margin-bottom: var(--spectrum-global-dimension-size-50);
          }
          .icon-container svg {
            width: 100px;
            height: 100px;
            filter: drop-shadow(
              2px 2px 3px var(--spectrum-alias-dropshadow-color)
            );
          }
          .name {
            text-align: center;
            color: var(--spectrum-alias-component-icon-color-default);
            letter-spacing: 0.04em;
            margin-top: 0;
            margin-bottom: 0;
            text-shadow: 2px 2px 3px var(--spectrum-alias-dropshadow-color);
          }
          .version {
            text-align: center;
            color: var(--spectrum-alias-component-icon-color-default);
            margin-top: 0;
            margin-bottom: var(--spectrum-global-dimension-size-400);
            font-size: 11px;
          }
        </style>
        <div class="icon-container">${unsafeHTML(AppIcon)}</div>
        <h3 class="name">eomap-js</h3>
        <p class="version">version ${NPM_VERSION}</p>
        <div class="button-container">
          <sp-button variant="secondary" slot="button" @click=${this.close}>
            Close
          </sp-button>
        </div>
      </eomap-modal>
    `;
  }

  close(_event) {
    this.open = false;
    this.dispatchEvent(new CustomEvent("close"));
  }
}
