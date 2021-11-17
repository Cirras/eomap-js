import { MapCommand } from "./map-command";

export class EntityCommand extends MapCommand {
  constructor(map, x, y, oldEntityState, newEntityState) {
    super(map);
    this.x = x;
    this.y = y;
    this.oldEntityState = oldEntityState;
    this.newEntityState = newEntityState;
  }

  setEntityState(entityState) {
    this.map.setWarp(this.x, this.y, entityState.warp);
    this.map.setSign(this.x, this.y, entityState.sign);
    this.map.setItems(this.x, this.y, entityState.items);
    this.map.setNPCs(this.x, this.y, entityState.npcs);
  }

  execute() {
    this.setEntityState(this.newEntityState);
  }

  undo() {
    this.setEntityState(this.oldEntityState);
  }
}
