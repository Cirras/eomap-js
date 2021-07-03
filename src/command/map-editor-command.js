import { Command } from "./command";

class MapEditorCommand extends Command {
  constructor(mapEditor) {
    super();
    this.mapEditor = mapEditor;
  }
}

export class SetGraphicCommand extends MapEditorCommand {
  constructor(mapEditor, x, y, layer, oldGfx, newGfx) {
    super(mapEditor);
    this.x = x;
    this.y = y;
    this.layer = layer;
    this.oldGfx = oldGfx;
    this.newGfx = newGfx;
  }

  execute() {
    this.mapEditor.setGraphic(this.x, this.y, this.newGfx, this.layer);
    this.mapEditor.textureCache.uploadChanges();
  }

  undo() {
    this.mapEditor.setGraphic(this.x, this.y, this.oldGfx, this.layer);
    this.mapEditor.textureCache.uploadChanges();
  }
}
