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

class Tile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

export class FillCommand extends MapEditorCommand {
  constructor(mapEditor, x, y, layer, oldGfx, newGfx) {
    super(mapEditor);
    this.originX = x;
    this.originY = y;
    this.layer = layer;
    this.oldGfx = oldGfx;
    this.newGfx = newGfx;
    this.fillTiles = null;
  }

  doFloodFill() {
    let isContiguousTile = (x, y) => {
      let gfx = this.mapEditor.emf.getTile(x, y).gfx[this.layer];
      return gfx === this.oldGfx;
    };

    let stack = [new Tile(this.originX, this.originY)];
    let width = this.mapEditor.emf.width;
    let height = this.mapEditor.emf.height;

    this.fillTiles = [];

    while (stack.length > 0) {
      let tile = stack.pop();
      let x = tile.x;
      let y = tile.y;
      while (x > 0 && isContiguousTile(x - 1, y)) {
        x--;
      }
      let spanUp = false;
      let spanDown = false;
      while (x < width && isContiguousTile(x, y)) {
        this.mapEditor.setGraphic(x, y, this.newGfx, this.layer);
        this.fillTiles.push(new Tile(x, y));
        if (!spanUp && y > 0 && isContiguousTile(x, y - 1)) {
          stack.push(new Tile(x, y - 1));
          spanUp = true;
        } else if (spanUp && y > 0 && !isContiguousTile(x, y - 1)) {
          spanUp = false;
        }
        if (!spanDown && y < height - 1 && isContiguousTile(x, y + 1)) {
          stack.push(new Tile(x, y + 1));
          spanDown = true;
        } else if (spanDown && y < height - 1 && !isContiguousTile(x, y + 1)) {
          spanDown = false;
        }
        x++;
      }
    }
  }

  execute() {
    if (this.fillTiles == null) {
      this.doFloodFill();
    } else {
      for (let tile of this.fillTiles) {
        this.mapEditor.setGraphic(tile.x, tile.y, this.newGfx, this.layer);
      }
    }
    this.mapEditor.textureCache.uploadChanges();
  }

  undo() {
    for (let tile of this.fillTiles) {
      this.mapEditor.setGraphic(tile.x, tile.y, this.oldGfx, this.layer);
    }
    this.mapEditor.textureCache.uploadChanges();
  }
}
