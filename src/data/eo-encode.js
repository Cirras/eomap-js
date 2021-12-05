import { CHAR_MAX, SHORT_MAX, THREE_MAX } from "./eo-numeric-limits";

import { reverse } from "../utils";

export function encodeNumber(number) {
  let d = Math.trunc(number / THREE_MAX) + 1;
  number %= THREE_MAX;

  let c = Math.trunc(number / SHORT_MAX) + 1;
  number %= SHORT_MAX;

  let b = Math.trunc(number / CHAR_MAX) + 1;
  number %= CHAR_MAX;

  let a = number + 1;

  return Uint8Array.from([a, b, c, d]);
}

export function encodeString(bytes) {
  let length = bytes.length;
  let flippy = length % 2 === 1;

  for (let i = 0; i < length; ++i) {
    let c = bytes[i];
    let f = 0;

    if (flippy) {
      f = 0x2e;
      if (c >= 0x50) {
        f *= -1;
      }
    }

    if (c >= 0x22 && c <= 0x7e) {
      bytes[i] = 0x9f - c - f;
    }

    flippy = !flippy;
  }

  reverse(bytes);

  return bytes;
}
