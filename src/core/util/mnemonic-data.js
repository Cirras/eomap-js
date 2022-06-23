export class MnemonicData {
  constructor(label) {
    this.string = "";
    this.mnemonic = null;
    this.index = null;

    let i = 0;
    while (i < label.length) {
      let char = label[i];
      if (char === "&") {
        ++i;
        let nextChar = label[i];
        if (nextChar !== "&") {
          if (nextChar !== undefined) {
            this.mnemonic = nextChar;
            this.index = this.string.length;
          }
          continue;
        }
      }
      this.string += char;
      ++i;
    }
  }
}
