export class CaseInsensitiveMap extends Map {
  set(key, value) {
    if (typeof key === "string") {
      key = key.toLowerCase();
    }
    return super.set(key, value);
  }

  get(key) {
    if (typeof key === "string") {
      key = key.toLowerCase();
    }
    return super.get(key);
  }

  has(key) {
    if (typeof key === "string") {
      key = key.toLowerCase();
    }
    return super.has(key);
  }
}
