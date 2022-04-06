import { MapCommand } from "./map-command";

export class DrawCommand extends MapCommand {
  constructor(mapState, x, y, layer, oldDrawID, newDrawID) {
    super(mapState);
    this.x = x;
    this.y = y;
    this.layer = layer;
    this.oldDrawID = oldDrawID;
    this.newDrawID = newDrawID;
  }

  execute() {
    this.map.draw(this.x, this.y, this.newDrawID, this.layer);
  }

  undo() {
    this.map.draw(this.x, this.y, this.oldDrawID, this.layer);
  }
}
