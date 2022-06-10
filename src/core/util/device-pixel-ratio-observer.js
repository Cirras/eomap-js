import { EventEmitter } from "eventemitter3";

export class DevicePixelRatioObserver extends EventEmitter {
  constructor() {
    super();
    this._devicePixelRatio = window.devicePixelRatio;
    this._mediaQueryList = null;
    this._observe();
  }

  _onChange = () => {
    this._devicePixelRatio = window.devicePixelRatio;
    this.emit("change", this._devicePixelRatio);
    this._observe();
  };

  _observe() {
    this._mediaQueryList = matchMedia(
      `(resolution: ${window.devicePixelRatio}dppx)`
    );
    this._mediaQueryList.addEventListener("change", this._onChange, {
      once: true,
    });
  }

  disconnect() {
    this._mediaQueryList.removeEventListener("change", this._onChange, {
      once: true,
    });
  }

  get devicePixelRatio() {
    return this._devicePixelRatio;
  }
}
