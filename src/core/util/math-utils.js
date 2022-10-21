export function trailingZeros(n) {
  n |= 0;
  return n ? 31 - Math.clz32(n & -n) : 0;
}

export function countOnes(n) {
  n = n - ((n >> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
  return (((n + (n >> 4)) & 0xf0f0f0f) * 0x1010101) >> 24;
}
