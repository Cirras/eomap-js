import { Tool } from "./tool";
import { EntityState } from "../state/entity-state";
import {
  ContextMenuState,
  ContextMenuActionItem,
} from "../state/context-menu-state";

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

  handleRightPointerUp(mapEditor, pointer) {
    if (!mapEditor.currentPos.valid) {
      return;
    }

    const x = mapEditor.currentPos.x;
    const y = mapEditor.currentPos.y;
    const map = mapEditor.map;

    const entities = new EntityState(
      x,
      y,
      map.getWarp(x, y),
      map.getSign(x, y),
      map.getNPCs(x, y),
      map.getItems(x, y)
    );

    const entitiesEmpty = !(
      entities.warp ||
      entities.sign ||
      entities.npcs.length ||
      entities.items.length
    );

    const items = [
      new ContextMenuActionItem(
        "Copy Entities",
        () => (mapEditor.copiedEntities = entities),
        entitiesEmpty
      ),
      new ContextMenuActionItem(
        "Paste Entities",
        () => {
          const newEntityState = mapEditor.copiedEntities.withX(x).withY(y);
          mapEditor.updateEntityState(newEntityState);
        },
        !mapEditor.copiedEntities
      ),
      new ContextMenuActionItem(
        "Clear Entities",
        () => {
          const newEntityState = new EntityState(x, y, null, null, [], []);
          mapEditor.updateEntityState(newEntityState);
        },
        entitiesEmpty
      ),
    ];

    const contextMenuState = new ContextMenuState(pointer.x, pointer.y, items);
    mapEditor.requestContextMenu(contextMenuState);
  }
}
