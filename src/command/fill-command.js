import { MapCommand } from "./map-command";

class Tile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

export class FillCommand extends MapCommand {
  constructor(map, x, y, layer, oldDrawID, newDrawID) {
    super(map);
    this.originX = x;
    this.originY = y;
    this.layer = layer;
    this.oldDrawID = oldDrawID;
    this.newDrawID = newDrawID;
    this.fillTiles = null;
  }

  doFloodFill() {
    let isContiguousTile = (x, y) => {
      return this.map.getDrawID(x, y, this.layer) === this.oldDrawID;
    };

    let stack = [new Tile(this.originX, this.originY)];
    let width = this.map.emf.width;
    let height = this.map.emf.height;

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
        this.map.draw(x, y, this.newDrawID, this.layer, false);
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
        this.map.draw(tile.x, tile.y, this.newDrawID, this.layer, false);
      }
    }
    this.map.dirtyRenderList = true;
  }

  undo() {
    for (let tile of this.fillTiles) {
      this.map.draw(tile.x, tile.y, this.oldDrawID, this.layer, false);
    }
    this.map.dirtyRenderList = true;
  }
}
