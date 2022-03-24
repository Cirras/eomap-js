import "phaser";

const Events = Phaser.Core.Events;

const oldStep = Phaser.Game.prototype.step;

export class RenderControlPlugin extends Phaser.Plugins.BasePlugin {
  step = (time, delta) => {
    if (this.game.pendingDestroy) {
      return this.game.runDestroy();
    }

    let eventEmitter = this.game.events;
    eventEmitter.emit(Events.PRE_STEP, time, delta);
    eventEmitter.emit(Events.STEP, time, delta);
    this.game.scene.update(time, delta);
    eventEmitter.emit(Events.POST_STEP, time, delta);

    if (this.shouldRender) {
      let renderer = this.game.renderer;
      renderer.preRender();
      eventEmitter.emit(Events.PRE_RENDER, renderer, time, delta);
      this.game.scene.render(renderer);
      renderer.postRender();
      eventEmitter.emit(Events.POST_RENDER, renderer, time, delta);
    }
  };

  init(_data) {
    this._shouldRender = true;
  }

  start() {
    this.game.step = this.step;
  }

  stop() {
    this.shouldRender = true;
    this.game.step = oldStep;
  }

  get shouldRender() {
    return this._shouldRender;
  }

  set shouldRender(value) {
    this._shouldRender = value;
  }
}
