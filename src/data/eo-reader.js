import { decodeNumber } from "./eo-decode";

export class EOReader {
  constructor(buffer) {
    this.buffer = buffer;
    this.dataView = new DataView(buffer);
    this.position = 0;
  }

  get length() {
    return this.buffer.byteLength;
  }

  get remaining() {
    return this.length - this.position;
  }

  get unbroken() {
    return this.remaining > 0 && this.dataView.getUint8(this.position) != 0xff;
  }

  getByte() {
    if (this.remaining === 0) {
      return 0;
    }

    let a = this.dataView.getUint8(this.position);
    ++this.position;

    return a;
  }

  getChar() {
    if (this.remaining === 0) {
      return 0;
    }

    let a = this.dataView.getUint8(this.position);
    ++this.position;

    return decodeNumber(a);
  }

  getShort() {
    if (this.remaining === 0) {
      return 0;
    }

    let a = this.dataView.getUint8(this.position);
    ++this.position;

    let b = this.dataView.getUint8(this.position);
    ++this.position;

    return decodeNumber(a, b);
  }

  getThree() {
    if (this.remaining === 0) {
      return 0;
    }

    let a = this.dataView.getUint8(this.position);
    ++this.position;

    let b = this.dataView.getUint8(this.position);
    ++this.position;

    let c = this.dataView.getUint8(this.position);
    ++this.position;

    return decodeNumber(a, b, c);
  }

  getInt() {
    if (this.remaining === 0) {
      return 0;
    }

    let a = this.dataView.getUint8(this.position);
    ++this.position;

    let b = this.dataView.getUint8(this.position);
    ++this.position;

    let c = this.dataView.getUint8(this.position);
    ++this.position;

    let d = this.dataView.getUint8(this.position);
    ++this.position;

    return decodeNumber(a, b, c, d);
  }

  getFixedString(length) {
    if (this.remaining < length) {
      length = this.remaining;
    }

    let offset = this.position;
    this.position += length;

    return new Uint8Array(this.buffer.slice(offset, offset + length));
  }

  getBreakString() {
    let offset = this.position;

    while (this.unbroken) {
      ++this.position;
    }

    let length = this.position - offset;
    this.skip(1);

    return new Uint8Array(this.buffer.slice(offset, offset + length));
  }

  getPrefixString() {
    let length = this.readChar();
    return this.getFixedString(length);
  }

  getEndString() {
    return this.getFixedString(this.remaining);
  }

  seek(position) {
    this.position = position;
  }

  skip(offset) {
    this.position += offset;
  }
}
