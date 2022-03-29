export const PromptType = {
  Info: 0,
  Warning: 1,
  Error: 2,
};

export class PromptState {
  constructor(type, message, detail, buttons, onButtonPress) {
    this.type = type;
    this.message = message;
    this.detail = detail;
    this.buttons = buttons;
    this.onButtonPress = onButtonPress;
  }
}
