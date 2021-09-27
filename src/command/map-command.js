import { Command } from "./command";

export class MapCommand extends Command {
  constructor(map) {
    super();
    this.map = map;
  }
}
