import { decodeString } from "./eo-decode";

export const MapEffect = {
  None: 0,
  HPDrain: 1,
  TPDrain: 2,
  Quake: 3,
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
  SpecUnknown7: 31,
  Arena: 32,
  AmbientSource: 33,
  Spikes1: 34,
  Spikes2: 35,
  Spikes3: 36,
};

export const MapType = {
  Default: 0,
  PK: 3,
};

function readString(bytes) {
  decodeString(bytes);

  let length;
  for (length = 0; length < bytes.length; ++length) {
    if (bytes[length] === 0x00 || bytes[length] === 0xff) {
      break;
    }
  }

  let characters = bytes.subarray(0, length);
  let decoder = new TextDecoder("windows-1252");

  return decoder.decode(characters);
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
}

export class MapUnknown {
  constructor(unk1, unk2, unk3, unk4) {
    this.unk1 = unk1;
    this.unk2 = unk2;
    this.unk3 = unk3;
    this.unk4 = unk4;
  }

  static read(reader) {
    let unk1 = reader.getChar();
    let unk2 = reader.getChar();
    let unk3 = reader.getChar();
    let unk4 = reader.getChar();

    return new MapUnknown(unk1, unk2, unk3, unk4);
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
}

export class MapSign {
  constructor(title, message) {
    this.title = title;
    this.message = message;
  }

  static read(reader) {
    let length = reader.getShort() - 1;
    let data = readString(reader.getFixedString(length));
    let titleLength = reader.getChar();
    let title = data.substr(0, titleLength);
    let message = data.substr(titleLength);

    return new MapSign(title, message);
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
    this.type = MapType.Default;
    this.effect = MapEffect.None;
    this.musicID = 0;
    this.musicControl = 0;
    this.ambientSoundID = 0;
    this.width = 0;
    this.height = 0;
    this.fillTile = 0;
    this.mapAvailable = 1;
    this.canScroll = 1;
    this.relogX = 0;
    this.relogY = 0;

    this.npcs = [];
    this.unknowns = [];
    this.items = [];

    this.tiles = [];
  }

  static read(reader) {
    let emf = new EMF();

    let magic = new TextDecoder().decode(reader.getFixedString(3));
    if (magic !== "EMF") {
      throw new Error("Invalid EMF file signature");
    }

    // skip the hash
    reader.skip(4);

    emf.name = readString(reader.getFixedString(24));
    emf.type = reader.getChar();
    emf.effect = reader.getChar();
    emf.musicID = reader.getChar();
    emf.musicControl = reader.getChar();
    emf.ambientSoundID = reader.getShort();
    emf.width = reader.getChar() + 1;
    emf.height = reader.getChar() + 1;
    emf.fillTile = reader.getShort();
    emf.mapAvailable = reader.getChar();
    emf.canScroll = reader.getChar();
    emf.relogX = reader.getChar();
    emf.relogY = reader.getChar();

    reader.skip(1);

    let npcCount = reader.getChar();
    for (let i = 0; i < npcCount; ++i) {
      emf.npcs.push(MapNPC.read(reader));
    }

    let unknownCount = reader.getChar();
    for (let i = 0; i < unknownCount; ++i) {
      emf.unknowns.push(MapUnknown.read(reader));
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
          let c = reader.getChar();

          if (x < emf.width && y < emf.height) {
            emf.getTile(x, y).spec = c;
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
          let s = reader.getShort();

          if (x < emf.width && y < emf.height) {
            emf.getTile(x, y).gfx[layer] = s;
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

  getTile(x, y) {
    return this.tiles[y * this.width + x];
  }
}
