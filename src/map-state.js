import { CommandInvoker } from "./command/command";

export class MapState {
  constructor() {
    this.fileHandle = null;
    this.emf = null;
    this.error = null;
    this.gameObject = null;
    this.commandInvoker = new CommandInvoker();
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
    copy.emf = this.emf;
    copy.error = this.error;
    copy.gameObject = this.gameObject;
    copy.scrollX = this.scrollX;
    copy.scrollY = this.scrollY;
    copy.zoom = this.zoom;
    return copy;
  }

  withFileHandle(fileHandle) {
    let copy = this.copy();
    copy.fileHandle = fileHandle;
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

  loading() {
    return this.fileHandle !== null && !this.loaded();
  }

  loaded() {
    return this.emf !== null;
  }
}
