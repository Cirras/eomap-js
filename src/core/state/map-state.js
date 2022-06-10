import { CommandInvoker } from "../command/command";

export class MapState {
  constructor() {
    this.fileHandle = null;
    this.pending = false;
    this.emf = null;
    this.error = null;
    this.gameObject = null;
    this.commandInvoker = new CommandInvoker();
    this.lastSavedCommand = null;
    this.scrollX = null;
    this.scrollY = null;
    this.zoom = null;
  }

  static fromFileHandle(fileHandle) {
    return new MapState().withFileHandle(fileHandle);
  }

  static fromEMF(emf) {
    return new MapState().withEMF(emf);
  }

  copy() {
    let copy = new MapState();
    copy.fileHandle = this.fileHandle;
    copy.pending = this.pending;
    copy.emf = this.emf;
    copy.error = this.error;
    copy.gameObject = this.gameObject;
    copy.scrollX = this.scrollX;
    copy.scrollY = this.scrollY;
    copy.zoom = this.zoom;
    copy.lastSavedCommand = null;
    return copy;
  }

  withFileHandle(fileHandle) {
    let copy = this.copy();
    copy.fileHandle = fileHandle;
    return copy;
  }

  withPending(pending) {
    let copy = this.copy();
    copy.pending = pending;
    return copy;
  }

  withEMF(emf) {
    let copy = this.copy();
    copy.emf = emf;
    return copy;
  }

  withError(error) {
    let copy = this.copy();
    copy.error = error;
    return copy;
  }

  withGameObject(gameObject) {
    let copy = this.copy();
    copy.gameObject = gameObject;
    return copy;
  }

  get loading() {
    return this.fileHandle !== null && !this.pending && !this.loaded;
  }

  get loaded() {
    return this.emf !== null;
  }

  get dirty() {
    return (
      this.lastSavedCommand !== (this.commandInvoker.nextUndoCommand || null)
    );
  }

  get filename() {
    if (this.fileHandle) {
      return this.fileHandle.name;
    }
    return "untitled";
  }

  saved() {
    this.lastSavedCommand = this.commandInvoker.nextUndoCommand || null;
  }
}
