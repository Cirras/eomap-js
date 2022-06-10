import { CaseInsensitiveMap } from "../util/case-insensitive-map";
import { isMac, isWindows } from "../util/platform-utils";

const modifierMap = (function () {
  let map = new CaseInsensitiveMap();
  map.set("Alt", "Alt");
  map.set("Option", "Alt");
  map.set("Ctrl", "Control");
  map.set("Control", "Control");
  map.set("Cmd", "Meta");
  map.set("Command", "Meta");
  map.set("Meta", "Meta");
  map.set("Super", "Meta");
  map.set("CommandOrControl", isMac() ? "Meta" : "Control");
  map.set("Shift", "Shift");
  return map;
})();

const keyAliasMap = (function () {
  let map = new CaseInsensitiveMap();
  map.set("Plus", "+");
  map.set("Return", "Enter");
  return map;
})();

function normalizeModifier(modifier) {
  return modifierMap.get(modifier) || modifier;
}

function unaliasKey(key) {
  return keyAliasMap.get(key) || key;
}

function eventKeyToKey(eventKey) {
  switch (eventKey) {
    case " ":
      return "Space";
    default:
      return eventKey;
  }
}

function acceleratorPartToLabel(part) {
  switch (part) {
    case "Alt":
      return isMac() ? "⌥" : "Alt";
    case "Control":
      return isMac() ? "\u2303" : "Ctrl";
    case "Meta":
      if (isMac()) {
        return "⌘";
      } else if (isWindows()) {
        return "Windows";
      } else {
        return "Super";
      }
    case "Shift":
      return isMac() ? "⇧" : "Shift";
    default:
      return unaliasKey(part);
  }
}

function acceleratorPartToKeyShortcut(part) {
  switch (part) {
    case "Alt":
      return isMac() ? "Option" : "Alt";
    case "Meta":
      if (isMac()) {
        return "Command";
      } else if (isWindows()) {
        return "Windows";
      } else {
        return "Super";
      }
    default:
      return unaliasKey(part);
  }
}

class KeybindingLabel {
  constructor(parts, separator) {
    this.parts = parts;
    this.separator = separator;
    this.string = parts.join(separator);
  }
}

export class KeybindingState {
  constructor(accelerator) {
    this.altKey = false;
    this.ctrlKey = false;
    this.metaKey = false;
    this.shiftKey = false;
    this.key = null;
    this.electronLabel = null;
    this.uiLabel = null;
    this.ariaLabel = null;

    this.readAccelerator(accelerator);
    this.createLabels();
  }

  readAccelerator(accelerator) {
    const parts = accelerator.split("+");

    for (let i = 0; i < parts.length; ++i) {
      if (this.key !== null) {
        throw new Error("Non-modifier key must come last in accelerator");
      }

      let part = normalizeModifier(parts[i]);

      switch (part) {
        case "Alt":
          this.altKey = true;
          break;
        case "Control":
          this.ctrlKey = true;
          break;
        case "Meta":
          this.metaKey = true;
          break;
        case "Shift":
          this.shiftKey = true;
          break;
        default:
          this.key = unaliasKey(part);
      }
    }
  }

  createLabels() {
    let parts = this.getNormalizedParts();

    const uiParts = [];
    const ariaParts = [];

    for (let part of parts) {
      uiParts.push(acceleratorPartToLabel(part));
      ariaParts.push(acceleratorPartToKeyShortcut(part));
    }

    this.electronLabel = new KeybindingLabel(parts, "+");
    this.uiLabel = new KeybindingLabel(uiParts, isMac() ? "" : "+");
    this.ariaLabel = new KeybindingLabel(ariaParts, "+");
  }

  getNormalizedParts() {
    let parts = [];

    if (this.ctrlKey) {
      parts.push("Control");
    }

    if (this.altKey) {
      parts.push("Alt");
    }

    if (this.shiftKey) {
      parts.push("Shift");
    }

    if (this.metaKey) {
      parts.push("Meta");
    }

    if (this.key) {
      parts.push(this.key);
    }

    return parts;
  }

  triggeredBy(event) {
    return (
      eventKeyToKey(event.key).toUpperCase() === this.key.toUpperCase() &&
      event.altKey === this.altKey &&
      event.ctrlKey === this.ctrlKey &&
      event.metaKey === this.metaKey &&
      event.shiftKey === this.shiftKey
    );
  }
}
