import { Command } from "./command";

export class MapCommand extends Command {
  constructor(mapState) {
    super();
    this.mapState = mapState;
  }

  get map() {
    return this.mapState.gameObject;
  }
}
