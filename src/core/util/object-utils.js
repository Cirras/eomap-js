export function isEmpty(object) {
  for (const _ in object) {
    return false;
  }
  return true;
}

export function merge(target, source) {
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) {
          target[key] = {};
        }
        merge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}

function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}
