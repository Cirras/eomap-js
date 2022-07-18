export async function showOpenDialog(options) {
  return unwrap(window.bridge.fs.showOpenDialog(options));
}

export async function showSaveDialog(options) {
  return unwrap(window.bridge.fs.showSaveDialog(options));
}

export async function getHandleData(path) {
  return unwrap(window.bridge.fs.getHandleData(path));
}

export async function getFileHandleData(path, create) {
  return unwrap(window.bridge.fs.getFileHandleData(path, !!create));
}

export async function getDirectoryHandleData(path, create) {
  return unwrap(window.bridge.fs.getDirectoryHandleData(path, !!create));
}

export async function readFile(path) {
  return unwrap(window.bridge.fs.readFile(path));
}

export async function writeFile(path, data) {
  return unwrap(window.bridge.fs.writeFile(path, data));
}

async function unwrap(promise) {
  const result = await promise;

  if (!result.error) {
    return result.returnValue;
  }

  switch (result.error) {
    case "ENOENT":
      throw new DOMException(
        "A requested file or directory could not be found at the time an operation was processed.",
        "NotFoundError"
      );
    case "ENOTEMPTY":
      throw new DOMException(
        "The object can not be modified in this way.",
        "InvalidModificationError"
      );
    case "EMISMATCH":
      throw new DOMException(
        "The path supplied exists, but was not an entry of requested type.",
        "TypeMismatchError"
      );
    case "EABORTED":
      throw new DOMException("The user aborted a request.", "AbortError");
    default:
      throw new DOMException(
        `Unknown error. (${result.error})`,
        "UnknownError"
      );
  }
}
