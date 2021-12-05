export function arrayEquals(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

function binarySearch(array, element, comparator) {
  let l = 0;
  let h = array.length - 1;

  while (l <= h) {
    let m = (l + h) >>> 1;
    let comparison = comparator(array[m], element);
    if (comparison < 0) {
      l = m + 1;
    } else if (comparison > 0) {
      h = m - 1;
    } else {
      return m;
    }
  }

  return ~l;
}

export function binaryInsert(array, element, comparator) {
  let i = binarySearch(array, element, comparator);
  let remove;

  if (i >= 0) {
    remove = 1;
  } else {
    remove = 0;
    i = ~i;
  }

  array.splice(i, remove, element);
}

export function removeFirst(array, element) {
  let index = array.indexOf(element);
  if (index > -1) {
    array.splice(index, 1);
  }
}

export function swap(array, indexA, indexB) {
  let element = array[indexA];
  array[indexA] = array[indexB];
  array[indexB] = element;
}

export function reverse(array) {
  let length = array.length;
  let halfLength = Math.trunc(length / 2);
  for (let i = 0; i < halfLength; ++i) {
    swap(array, i, length - i - 1);
  }
}

export function findMostFrequent(array) {
  const map = array.reduce((accumulator, value) => {
    accumulator.set(value, (accumulator.get(value) || 0) + 1);
    return accumulator;
  }, new Map());

  let result = 0;
  let highestCount = 0;
  for (let [key, value] of map.entries()) {
    if (value > highestCount) {
      result = key;
      highestCount = value;
    }
  }

  return result;
}

export function getEGFFilename(fileID) {
  return "gfx" + fileID.toString().padStart(3, "0") + ".egf";
}

export function getEMFFilename(fileID) {
  return fileID.toString().padStart(5, "0") + ".emf";
}
