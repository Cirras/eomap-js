import * as windows1252 from "windows-1252";

import { decodeString } from "./eo-decode";
import { encodeString } from "./eo-encode";
import { findMostFrequent } from "../utils";

export const MapType = {
  Normal: 0,
  PK: 3,
};

export const MapEffect = {
  None: 0,
  HPDrain: 1,
  TPDrain: 2,
  Quake1: 3,
  Quake2: 4,
  Quake3: 5,
  Quake4: 6,
};

export const MusicControl = {
  InterruptIfDifferentPlayOnce: 0,
  InterruptPlayOnce: 1,
  FinishPlayOnce: 2,
  InterruptIfDifferentPlayRepeat: 3,
  InterruptPlayRepeat: 4,
  FinishPlayRepeat: 5,
  InterruptPlayNothing: 6,
};

export const TileSpec = {
  Wall: 0,
  ChairDown: 1,
  ChairLeft: 2,
  ChairRight: 3,
  ChairUp: 4,
  ChairDownRight: 5,
  ChairUpLeft: 6,
  ChairAll: 7,
  Chest: 9,
  BankVault: 16,
  NPCBoundary: 17,
  MapEdge: 18,
  FakeWall: 19,
  Board1: 20,
  Board2: 21,
  Board3: 22,
  Board4: 23,
  Board5: 24,
  Board6: 25,
  Board7: 26,
  Board8: 27,
  Jukebox: 28,
  Jump: 29,
  Water: 30,
  Arena: 32,
  AmbientSource: 33,
  Spikes1: 34,
  Spikes2: 35,
  Spikes3: 36,
};

function bytesToString(bytes) {
  decodeString(bytes);

  let length;
  for (length = 0; length < bytes.length; ++length) {
    if (bytes[length] === 0x00 || bytes[length] === 0xff) {
      break;
    }
  }

  let characters = bytes.subarray(0, length);

  return windows1252.decode(characters);
}

function stringToBytes(string, length) {
  if (length === undefined) {
    length = string.length;
  }

  let characters = windows1252.encode(string);

  let array = [];
  for (let i = 0; i < length; ++i) {
    if (i < characters.length) {
      array.push(characters[i]);
    } else {
      array.push(0xff);
    }
  }

  return encodeString(Uint8Array.from(array));
}

export class MapItem {
  constructor(x, y, key, chestSlot, id, spawnTime, amount) {
    this.x = x;
    this.y = y;
    this.key = key;
    this.chestSlot = chestSlot;
    this.id = id;
    this.spawnTime = spawnTime;
    this.amount = amount;
  }

  static read(reader) {
    let x = reader.getChar();
    let y = reader.getChar();
    let key = reader.getShort();
    let chestSlot = reader.getChar();
    let id = reader.getShort();
    let spawnTime = reader.getShort();
    let amount = reader.getThree();

    return new MapItem(x, y, key, chestSlot, id, spawnTime, amount);
  }

  write(builder) {
    builder.addChar(this.x);
    builder.addChar(this.y);
    builder.addShort(this.key);
    builder.addChar(this.chestSlot);
    builder.addShort(this.id);
    builder.addShort(this.spawnTime);
    builder.addThree(this.amount);
  }
}

export class MapNPC {
  constructor(x, y, id, spawnType, spawnTime, amount) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.spawnType = spawnType;
    this.spawnTime = spawnTime;
    this.amount = amount;
  }

  static read(reader) {
    let x = reader.getChar();
    let y = reader.getChar();
    let id = reader.getShort();
    let spawnType = reader.getChar();
    let spawnTime = reader.getShort();
    let amount = reader.getChar();

    return new MapNPC(x, y, id, spawnType, spawnTime, amount);
  }

  write(builder) {
    builder.addChar(this.x);
    builder.addChar(this.y);
    builder.addShort(this.id);
    builder.addChar(this.spawnType);
    builder.addShort(this.spawnTime);
    builder.addChar(this.amount);
  }
}

export class MapLegacyDoorKey {
  constructor(x, y, key) {
    this.x = x;
    this.y = y;
    this.key = key;
  }

  static read(reader) {
    let x = reader.getChar();
    let y = reader.getChar();
    let key = reader.getShort();

    return new MapLegacyDoorKey(x, y, key);
  }

  write(builder) {
    builder.addChar(x);
    builder.addChar(y);
    builder.addShort(key);
  }
}

export class MapWarp {
  constructor(map, x, y, level, door) {
    this.map = map;
    this.x = x;
    this.y = y;
    this.level = level;
    this.door = door;
  }

  static read(reader) {
    let map = reader.getShort();
    let x = reader.getChar();
    let y = reader.getChar();
    let level = reader.getChar();
    let door = reader.getShort();

    return new MapWarp(map, x, y, level, door);
  }

  write(builder) {
    builder.addShort(this.map);
    builder.addChar(this.x);
    builder.addChar(this.y);
    builder.addChar(this.level);
    builder.addShort(this.door);
  }
}

export class MapSign {
  constructor(title, message) {
    this.title = title;
    this.message = message;
  }

  static read(reader) {
    let length = reader.getShort() - 1;
    let data = bytesToString(reader.getFixedString(length));
    let titleLength = reader.getChar();
    let title = data.substr(0, titleLength);
    let message = data.substr(titleLength);

    return new MapSign(title, message);
  }

  write(builder) {
    let data = stringToBytes(this.title + this.message);
    builder.addShort(data.byteLength + 1);
    builder.addString(data);
    builder.addChar(windows1252.encode(this.title).length);
  }
}

export class MapTile {
  constructor() {
    this.gfx = new Array(9).fill(null);
    this.spec = null;
    this.warp = null;
    this.sign = null;
  }
}

export class EMF {
  constructor() {
    this.name = "";
    this.type = MapType.Normal;
    this.effect = MapEffect.None;
    this.musicID = 0;
    this.musicControl = MusicControl.InterruptIfDifferentPlayOnce;
    this.ambientSoundID = 0;
    this.width = 0;
    this.height = 0;
    this.fillTile = 0;
    this.mapAvailable = true;
    this.canScroll = true;
    this.relogX = 0;
    this.relogY = 0;

    this.npcs = [];
    this.legacyDoorKeys = [];
    this.items = [];

    this.tiles = [];
  }

  static new(width, height, name) {
    let emf = new EMF();

    emf.width = width;
    emf.height = height;
    emf.name = name;

    let tileCount = width * height;
    emf.tiles = new Array(tileCount);
    for (let i = 0; i < tileCount; ++i) {
      emf.tiles[i] = new MapTile();
    }

    return emf;
  }

  static read(reader) {
    let emf = new EMF();

    let magic = windows1252.decode(reader.getFixedString(3));
    if (magic !== "EMF") {
      throw new Error("Invalid EMF file signature");
    }

    // skip the hash
    reader.skip(4);

    emf.name = bytesToString(reader.getFixedString(24));
    emf.type = reader.getChar();
    emf.effect = reader.getChar();
    emf.musicID = reader.getChar();
    emf.musicControl = reader.getChar();
    emf.ambientSoundID = reader.getShort();
    emf.width = reader.getChar() + 1;
    emf.height = reader.getChar() + 1;
    emf.fillTile = reader.getShort();
    emf.mapAvailable = !!reader.getChar();
    emf.canScroll = !!reader.getChar();
    emf.relogX = reader.getChar();
    emf.relogY = reader.getChar();

    reader.skip(1);

    let npcCount = reader.getChar();
    for (let i = 0; i < npcCount; ++i) {
      emf.npcs.push(MapNPC.read(reader));
    }

    let legacyDoorKeyCount = reader.getChar();
    for (let i = 0; i < legacyDoorKeyCount; ++i) {
      emf.legacyDoorKeys.push(MapLegacyDoorKey.read(reader));
    }

    let itemCount = reader.getChar();
    for (let i = 0; i < itemCount; ++i) {
      emf.items.push(MapItem.read(reader));
    }

    let tileCount = emf.width * emf.height;
    emf.tiles = new Array(tileCount);
    for (let i = 0; i < tileCount; ++i) {
      emf.tiles[i] = new MapTile();
      emf.tiles[i].gfx[0] = emf.fillTile;
    }

    {
      let rows = reader.getChar();
      for (let i = 0; i < rows; ++i) {
        let y = reader.getChar();
        let tiles = reader.getChar();
        for (let ii = 0; ii < tiles; ++ii) {
          let x = reader.getChar();
          let tileSpec = reader.getChar();

          if (x < emf.width && y < emf.height) {
            emf.getTile(x, y).spec = tileSpec;
          }
        }
      }
    }

    {
      let rows = reader.getChar();
      for (let i = 0; i < rows; ++i) {
        let y = reader.getChar();
        let tiles = reader.getChar();
        for (let ii = 0; ii < tiles; ++ii) {
          let x = reader.getChar();
          let warp = MapWarp.read(reader);

          if (x < emf.width && y < emf.height) {
            emf.getTile(x, y).warp = warp;
          }
        }
      }
    }

    for (let layer = 0; layer < 9; ++layer) {
      let rows = reader.getChar();
      for (let i = 0; i < rows; ++i) {
        let y = reader.getChar();
        let tiles = reader.getChar();
        for (let ii = 0; ii < tiles; ++ii) {
          let x = reader.getChar();
          let graphic = reader.getShort();

          if (layer > 0 && graphic === 0) {
            continue;
          }

          if (x < emf.width && y < emf.height) {
            emf.getTile(x, y).gfx[layer] = graphic;
          }
        }
      }
    }

    if (reader.remaining > 0) {
      let signs = reader.getChar();
      for (let i = 0; i < signs; ++i) {
        let x = reader.getChar();
        let y = reader.getChar();

        if (x < emf.width && y < emf.height) {
          emf.getTile(x, y).sign = MapSign.read(reader);
        }
      }
    }

    return emf;
  }

  write(builder) {
    let groundGraphics = this.tiles.map((tile) => tile.gfx[0]);
    let fillTile = findMostFrequent(groundGraphics);

    builder.addString(new Uint8Array([0x45, 0x4d, 0x46]));
    builder.addHash();
    builder.addString(stringToBytes(this.name, 24));
    builder.addChar(this.type);
    builder.addChar(this.effect);
    builder.addChar(this.musicID);
    builder.addChar(this.musicControl);
    builder.addShort(this.ambientSoundID);
    builder.addChar(this.width - 1);
    builder.addChar(this.height - 1);
    builder.addShort(fillTile);
    builder.addChar(this.mapAvailable ? 1 : 0);
    builder.addChar(this.canScroll ? 1 : 0);
    builder.addChar(this.relogX);
    builder.addChar(this.relogY);
    builder.addChar(0);

    builder.addChar(this.npcs.length);
    for (let npc of this.npcs) {
      npc.write(builder);
    }

    builder.addChar(this.legacyDoorKeys.length);
    for (let legacyDoorKey of this.legacyDoorKeys) {
      legacyDoorKey.write(builder);
    }

    builder.addChar(this.items.length);
    for (let item of this.items) {
      item.write(builder);
    }

    let specRows = [];
    let warpRows = [];
    let gfxRows = [];
    let signRows = [];

    for (let i = 0; i < 9; ++i) {
      gfxRows.push([]);
    }

    for (let y = 0; y < this.height; ++y) {
      let specRow = new TileRow(y);
      let warpRow = new TileRow(y);
      let gfxRow = [];
      let signRow = new TileRow(y);

      for (let i = 0; i < 9; ++i) {
        gfxRow.push(new TileRow(y));
      }

      for (let x = 0; x < this.width; ++x) {
        let tile = this.getTile(x, y);
        if (tile.spec !== null) {
          specRow.add(x);
        }

        if (tile.warp !== null) {
          warpRow.add(x);
        }

        for (let layer = 0; layer < 9; ++layer) {
          let graphicID = tile.gfx[layer];
          let isFillTile = layer === 0 && graphicID === fillTile;
          if (graphicID !== null && !isFillTile) {
            gfxRow[layer].add(x);
          }
        }

        if (tile.sign !== null) {
          signRow.add(x);
        }
      }

      if (!specRow.empty) {
        specRows.push(specRow);
      }

      if (!warpRow.empty) {
        warpRows.push(warpRow);
      }

      for (let layer = 0; layer < 9; ++layer) {
        if (!gfxRow[layer].empty) {
          gfxRows[layer].push(gfxRow[layer]);
        }
      }

      if (!signRow.empty) {
        signRows.push(signRow);
      }
    }

    builder.addChar(specRows.length);
    for (let row of specRows) {
      let y = row.y;
      builder.addChar(y);
      builder.addChar(row.length);
      for (let x of row.tiles) {
        builder.addChar(x);
        builder.addChar(this.getTile(x, y).spec);
      }
    }

    builder.addChar(warpRows.length);
    for (let row of warpRows) {
      let y = row.y;
      builder.addChar(y);
      builder.addChar(row.length);
      for (let x of row.tiles) {
        builder.addChar(x);
        let warp = this.getTile(x, y).warp;
        warp.write(builder);
      }
    }

    for (let layer = 0; layer < 9; ++layer) {
      let layerRows = gfxRows[layer];
      builder.addChar(layerRows.length);
      for (let row of layerRows) {
        let y = row.y;
        builder.addChar(y);
        builder.addChar(row.length);
        for (let x of row.tiles) {
          builder.addChar(x);
          builder.addShort(this.getTile(x, y).gfx[layer]);
        }
      }
    }

    if (!signRows.empty) {
      let signCount = signRows.reduce(
        (accumulator, row) => accumulator + row.length,
        0
      );
      builder.addChar(signCount);
      for (let row of signRows) {
        let y = row.y;
        for (let x of row.tiles) {
          builder.addChar(x);
          builder.addChar(y);
          let sign = this.getTile(x, y).sign;
          sign.write(builder);
        }
      }
    }
  }

  getTile(x, y) {
    return this.tiles[y * this.width + x];
  }
}

class TileRow {
  constructor(y) {
    this.y = y;
    this.tiles = [];
  }

  add(x) {
    this.tiles.push(x);
  }

  get length() {
    return this.tiles.length;
  }

  get empty() {
    return this.tiles.length === 0;
  }
}
