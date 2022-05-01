import { CHAR_MAX, SHORT_MAX, THREE_MAX } from "./eo-numeric-limits";

import { reverse } from "../util/array-utils";

function getByteValue(byte) {
  if (byte === undefined) {
    byte = 254;
  }

  if (byte === 254) {
    byte = 1;
  }

  --byte;

  return byte & 0xff;
}

export function decodeNumber(a, b, c, d) {
  a = getByteValue(a);
  b = getByteValue(b);
  c = getByteValue(c);
  d = getByteValue(d);

  return d * THREE_MAX + c * SHORT_MAX + b * CHAR_MAX + a;
}

export function decodeString(bytes) {
  let length = bytes.length;

  reverse(bytes);

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
}
