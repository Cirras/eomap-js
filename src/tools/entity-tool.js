import { Tool } from "./tool";
import { EntityState } from "../state/entity-state";

export class EntityTool extends Tool {
  handleLeftPointerUp(mapEditor, _pointer) {
    if (!mapEditor.currentPos.valid) {
      return;
    }

    let x = mapEditor.currentPos.x;
    let y = mapEditor.currentPos.y;
    let map = mapEditor.map;

    mapEditor.events.emit(
      "request-entity-editor",
      new EntityState(
        x,
        y,
        map.getWarp(x, y),
        map.getSign(x, y),
        map.getNPCs(x, y),
        map.getItems(x, y)
      )
    );
  }
}
