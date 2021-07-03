const EMF_Effect = {
  None: 0,
  HPDrain: 1,
  TPDrain: 2,
  Quake: 3,
};

const EMF_Tile_Spec = {
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

const EMF_Type = {
  Default: 0,
  PK: 3,
};

export class EMF_Item {
  constructor(x, y, key, chest_slot, id, spawn_time, amount) {
    this.x = x;
    this.y = y;
    this.key = key;
    this.chest_slot = chest_slot;
    this.id = id;
    this.spawn_time = spawn_time;
    this.amount = amount;
  }

  static from_json(json) {
    if (json === undefined) {
      return;
    }

    return new EMF_Item(
      json.x,
      json.y,
      json.key,
      json.chest_slot,
      json.id,
      json.spawn_time,
      json.amount
    );
  }
}

export class EMF_Npc {
  constructor(x, y, id, spawn_type, spawn_time, amount) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.spawn_type = spawn_type;
    this.spawn_time = spawn_time;
    this.amount = amount;
  }

  static from_json(json) {
    if (json === undefined) {
      return;
    }

    return new EMF_Npc(
      json.x,
      json.y,
      json.id,
      json.spawn_type,
      json.spawn_time,
      json.amount
    );
  }
}

export class EMF_Warp {
  constructor(map, x, y, level, door) {
    this.map = map;
    this.x = x;
    this.y = y;
    this.level = level;
    this.door = door;
  }

  static from_json(json) {
    if (json === undefined) {
      return;
    }

    return new EMF_Warp(json.map, json.x, json.y, json.level, json.door);
  }
}

export class EMF_Sign {
  constructor(title, message) {
    this.title = title;
    this.message = message;
  }

  static from_json(json) {
    if (json === undefined) {
      return;
    }

    return new EMF_Sign(json.title, json.message);
  }
}

export class EMF_Tile {
  constructor() {
    this.gfx = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.sprites = [];

    this.spec;
    this.warp;
    this.sign;
  }

  static from_json(json) {
    let tile = new EMF_Tile();

    for (let i = 0; i < json.gfx.length; ++i) {
      tile.gfx[i] = json.gfx[i];
    }

    tile.spec = json.spec;
    tile.warp = EMF_Warp.from_json(json.warp);
    tile.sign = EMF_Sign.from_json(json.sign);

    return tile;
  }
}

export class EMF {
  constructor() {
    this.name = "";
    this.type = EMF_Type.Default;
    this.effect = EMF_Effect.None;
    this.music_id = 0;
    this.music_extra = 0;
    this.ambient_sound_id = 0;
    this.width = 0;
    this.height = 0;
    this.fill_tile = 0;
    this.map_available = 1;
    this.can_scroll = 1;
    this.relog_x = 0;
    this.relog_y = 0;

    this.npcs = [];
    this.unknowns = [];
    this.items = [];

    this.rows = [];
  }

  static from_json(json) {
    let emf = new EMF();
    emf.type = json.type;
    emf.effect = json.effect;
    emf.music_id = json.music_id;
    emf.music_extra = json.music_extra;
    emf.ambient_sound_id = json.ambient_sound_id;
    emf.width = json.width;
    emf.height = json.height;
    emf.fill_tile = json.fill_tile;
    emf.map_available = json.map_available;
    emf.can_scroll = json.can_scroll;
    emf.relog_x = json.relog_x;
    emf.relog_y = json.relog_y;

    emf.npcs = [];
    emf.unknowns = [];
    emf.items = [];
    emf.rows = [];

    for (let npc of json.npcs) {
      emf.npcs.push(EMF_Npc.from_json(npc));
    }

    for (let item of json.items) {
      emf.items.push(EMF_Item.from_json(item));
    }

    for (let row of json.rows) {
      let emfRow = [];

      for (let tile of row) {
        let emfTile = EMF_Tile.from_json(tile);
        emfRow.push(emfTile);
      }

      emf.rows.push(emfRow);
    }

    return emf;
  }

  getTile(x, y) {
    return this.rows[y][x];
  }
}
