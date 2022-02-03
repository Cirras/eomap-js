import { MapTile } from "../data/emf";
import { MapCommand } from "./map-command";

export class PropertiesCommand extends MapCommand {
  constructor(mapState, oldProperties, newProperties) {
    super(mapState);
    this.oldProperties = oldProperties;
    this.newProperties = newProperties;
    this.shouldResize =
      oldProperties.width !== newProperties.width ||
      oldProperties.height !== newProperties.height;
    if (this.shouldResize) {
      this.oldNpcs = [...map.emf.npcs];
      this.oldItems = [...map.emf.items];
      this.oldTiles = [...map.emf.tiles];
    }
  }

  setProperties(properties) {
    let emf = this.map.emf;
    emf.name = properties.name;
    emf.type = properties.type;
    emf.effect = properties.effect;
    emf.mapAvailable = properties.minimap;
    emf.canScroll = properties.scrolls;
    emf.musicID = properties.music;
    emf.ambientSoundID = properties.ambientSound;
    emf.musicControl = properties.musicControl;
    emf.relogX = properties.respawnX;
    emf.relogY = properties.respawnY;
  }

  executeResize() {
    if (!this.shouldResize) {
      return;
    }

    let emf = this.map.emf;
    let width = this.newProperties.width;
    let height = this.newProperties.height;

    let npcs = emf.npcs.filter((npc) => npc.x < width && npc.y < height);
    let items = emf.items.filter((item) => item.x < width && item.y < height);
    let tiles = new Array(width * height);

    for (let y = 0; y < height; ++y) {
      for (let x = 0; x < width; ++x) {
        let tile;
        if (x < emf.width && y < emf.height) {
          tile = emf.getTile(x, y);
        } else {
          tile = new MapTile();
          tile.gfx[0] = 0;
        }
        tiles[y * width + x] = tile;
      }
    }

    emf.npcs = npcs;
    emf.items = items;
    emf.tiles = tiles;
    emf.width = width;
    emf.height = height;

    this.map.init();
  }

  undoResize() {
    if (!this.shouldResize) {
      return;
    }

    let emf = this.map.emf;

    emf.npcs = this.oldNpcs;
    emf.items = this.oldItems;
    emf.tiles = this.oldTiles;
    emf.width = this.oldProperties.width;
    emf.height = this.oldProperties.height;

    this.map.init();
  }

  execute() {
    this.setProperties(this.newProperties);
    this.executeResize();
  }

  undo() {
    this.setProperties(this.oldProperties);
    this.undoResize();
  }
}
