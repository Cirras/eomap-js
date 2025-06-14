import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import {
  InfoIcon,
  AlertIcon,
  CloseCircleIcon,
} from "@spectrum-web-components/icons-workflow";

import "@spectrum-web-components/icon/sp-icon.js";
import "@spectrum-web-components/button-group/sp-button-group.js";
import "@spectrum-web-components/button/sp-button.js";

import "./modal";
import { PromptState, PromptType } from "../state/prompt-state";

@customElement("eomap-prompt")
export class Prompt extends LitElement {
  @property({ type: Boolean, reflect: true })
  open = false;

  @state({ type: PromptState })
  state = null;

  render() {
    return html`
      <eomap-modal
        .noDivider=${true}
        .open=${this.open}
        .width=${500}
        @close=${this.close}
      >
        <style>
          .message-row {
            display: flex;
            flex-grow: 1;
            align-items: center;
          }
          .icon {
            flex: 0 0 var(--spectrum-global-dimension-size-600);
            height: var(--spectrum-global-dimension-size-600);
            align-self: baseline;
          }
          .message-container {
            display: flex;
            flex-direction: column;
            overflow: hidden;
            text-overflow: ellipsis;
            padding-left: var(--spectrum-global-dimension-size-300);
            user-select: text;
            -webkit-user-select: text;
            word-wrap: break-word;
            white-space: normal;
          }
          .message {
            color: var(--spectrum-alias-component-icon-color-default);
            line-height: var(--spectrum-global-dimension-size-275);
            font-size: var(--spectrum-global-dimension-font-size-300);
            min-height: var(--spectrum-global-dimension-size-600);
            margin-bottom: var(--spectrum-global-dimension-size-100);
            display: flex;
            align-items: center;
          }
          .detail {
            color: var(--spectrum-alias-component-icon-color-default);
            margin-top: 0;
            font-size: var(--spectrum-global-dimension-font-size-75);
            font-weight: lighter;
          }
          .button-group {
            justify-content: flex-end;
            padding-top: var(--spectrum-global-dimension-size-450);
            padding-bottom: var(--spectrum-global-dimension-size-65);
          }
        </style>
        ${this.renderContent()}
      </eomap-modal>
    `;
  }

  renderContent() {
    if (this.state) {
      return html`
        <div class="message-row">
          <sp-icon class="icon" style="${this.getIconStyle()}">
            ${this.getIcon()}
          </sp-icon>
          <div class="message-container">
            <div class="message">${this.state.message}</div>
            <div class="detail">${this.state.detail}</div>
          </div>
        </div>
        <sp-button-group class="button-group">
          ${this.renderButtons()}
        </sp-button-group>
      `;
    }
  }

  getIcon() {
    switch (this.state.type) {
      case PromptType.Info:
        return InfoIcon();
      case PromptType.Warning:
        return AlertIcon();
      case PromptType.Error:
        return CloseCircleIcon();
      default:
        throw new Error(`Unhandled PromptType: ${this.state.type}`);
    }
  }

  getIconStyle() {
    switch (this.state.type) {
      case PromptType.Info:
        return "color: var(--spectrum-semantic-informative-status-color)";
      case PromptType.Warning:
        return "color: var(--spectrum-semantic-notice-status-color)";
      case PromptType.Error:
        return "color: var(--spectrum-semantic-negative-status-color)";
      default:
        throw new Error(`Unhandled PromptType: ${this.state.type}`);
    }
  }

  renderButtons() {
    return this.state.buttons.map(
      (label, i) => html`
        <sp-button
          .variant=${i === 0 ? "cta" : "secondary"}
          @click=${() => {
            this.clickButton(i);
          }}
        >
          ${label}
        </sp-button>
      `,
    );
  }

  clickButton(buttonIndex) {
    this.state.onButtonPress?.(buttonIndex);
    this.open = false;
    this.dispatchEvent(new CustomEvent("close"));
  }

  close(_event) {
    this.open = false;
    this.dispatchEvent(new CustomEvent("close"));
  }
}
