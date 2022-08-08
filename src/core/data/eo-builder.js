import { encodeNumber } from "./eo-encode";

import crc32 from "crc-32";

export class EOBuilder {
  constructor() {
    this.data = [];
    this.hashPos = null;
  }

  get length() {
    return this.data.length;
  }

  addByte(byte) {
    this.data.push(byte);
  }

  addChar(char) {
    let encoded = encodeNumber(char);
    this.data.push(encoded[0]);
  }

  addShort(short) {
    let encoded = encodeNumber(short);
    this.data.push(encoded[0], encoded[1]);
  }

  addThree(three) {
    let encoded = encodeNumber(three);
    this.data.push(encoded[0], encoded[1], encoded[2]);
  }

  addInt(int) {
    let encoded = encodeNumber(int);
    this.data.push(...encoded);
  }

  addString(bytes) {
    this.data.push(...bytes);
  }

  addBreakString(bytes) {
    this.data.push(...bytes, 0xff);
  }

  addPrefixString(bytes) {
    this.addChar(bytes.byteLength);
    this.data.push(...bytes);
  }

  addHash() {
    this.hashPos = this.data.length;
    this.addShort(0);
    this.addShort(0);
  }

  build() {
    let data = Uint8Array.from(this.data);

    if (this.hashPos !== null) {
      let hash = crc32.buf(data);
      let bytes = new Uint8Array(4);
      let dataView = new DataView(bytes.buffer);
      dataView.setUint32(0, hash, true);

      let rid1 = encodeNumber(dataView.getUint16(0, true));
      let rid2 = encodeNumber(dataView.getUint16(2, true));

      data.set([rid1[0], rid1[1], rid2[0], rid2[1]], this.hashPos);
    }

    return data;
  }
}
