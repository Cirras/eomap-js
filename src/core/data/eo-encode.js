import { CHAR_MAX, SHORT_MAX, THREE_MAX } from "./eo-numeric-limits";

import { reverse } from "../util/array-utils";

export function encodeNumber(number) {
  let value = number;

  let d = 254;
  if (number > THREE_MAX) {
    d = Math.trunc(value / THREE_MAX) + 1;
    value %= THREE_MAX;
  }

  let c = 254;
  if (number > SHORT_MAX) {
    c = Math.trunc(value / SHORT_MAX) + 1;
    value %= SHORT_MAX;
  }

  let b = 254;
  if (number > CHAR_MAX) {
    b = Math.trunc(value / CHAR_MAX) + 1;
    value %= CHAR_MAX;
  }

  let a = value + 1;

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
