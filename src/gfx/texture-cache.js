import ShelfPack from "@mapbox/shelf-pack";
import { AssetFactory } from "./asset";
import { DrawableMultiTexture } from "./drawable-multi-texture";

class TextureCacheEntry {
  constructor(asset, page, bin) {
    this.asset = asset;
    this.page = page;
    this.bin = bin;
    this.refCount = 0;
  }

  incRef() {
    ++this.refCount;
  }

  decRef() {
    if (this.refCount === 0) {
      throw new Error("Negative refCount");
    }

    --this.refCount;
  }
}

class TextureCachePage {
  constructor(texturePage) {
    this.texturePage = texturePage;
    this.shelfPacker = new ShelfPack(texturePage.width, texturePage.height);
  }

  get empty() {
    return this.shelfPacker.bins[1] === undefined;
  }
}

export class TextureCache {
  constructor(scene, gfxLoader, width, height) {
    this.scene = scene;
    this.gfxLoader = gfxLoader;
    this.identifier = Phaser.Utils.String.UUID();
    this.pages = [];
    this.entries = new Map();
    this.pending = [];
    this.assetFactory = new AssetFactory(scene, this.identifier);

    this.multiTexture = new DrawableMultiTexture(
      this.scene.textures,
      this.identifier,
      width,
      height
    );

    let firstPage = new TextureCachePage(this.multiTexture.pages[0]);
    this.pages.push(firstPage);
  }

  makeResourceKey(fileID, resourceID) {
    return fileID + "." + resourceID;
  }

  makeSpecKey(tileSpec) {
    return "spec." + tileSpec;
  }

  makeEntityKey(entityType) {
    return "entity." + entityType;
  }

  getEntry(key, getDimensions, createAsset) {
    let entry = this.entries.get(key);
    if (!entry) {
      let dimensions = getDimensions();
      entry = this.add(key, dimensions.width, dimensions.height, createAsset);
    }
    return entry;
  }

  getResource(fileID, resourceID) {
    let key = this.makeResourceKey(fileID, resourceID);

    let getDimensions = () => {
      let width = 1;
      let height = 1;
      let info = this.gfxLoader.resourceInfo(fileID, resourceID);
      if (info) {
        width = info.width;
        height = info.height;
      }
      return {
        width: width,
        height: height,
      };
    };

    let createAsset = () => {
      return this.assetFactory.createResource(
        this.multiTexture.key,
        key,
        fileID,
        resourceID
      );
    };

    return this.getEntry(key, getDimensions, createAsset);
  }

  getSpec(tileSpec) {
    let key = this.makeSpecKey(tileSpec);

    let getDimensions = () => ({
      width: 64,
      height: 32,
    });

    let createAsset = () => {
      return this.assetFactory.createSpec(this.multiTexture.key, key, tileSpec);
    };

    return this.getEntry(key, getDimensions, createAsset);
  }

  getEntity(entityType) {
    let key = this.makeEntityKey(entityType);

    let getDimensions = () => ({
      width: 64,
      height: 32,
    });

    let createAsset = () => {
      return this.assetFactory.createEntity(
        this.multiTexture.key,
        key,
        entityType
      );
    };

    return this.getEntry(key, getDimensions, createAsset);
  }

  getBlackTile() {
    let key = "black";

    let getDimensions = () => ({
      width: 64,
      height: 32,
    });

    let createAsset = () => {
      return this.assetFactory.createBlackTile(this.multiTexture.key, key);
    };

    return this.getEntry(key, getDimensions, createAsset);
  }

  getCursor() {
    let key = "cursor";

    let getDimensions = () => {
      return {
        width: 320,
        height: 32,
      };
    };

    let createAsset = () => {
      return this.assetFactory.createCursor(this.multiTexture.key, key);
    };

    return this.getEntry(key, getDimensions, createAsset);
  }

  add(key, width, height, createAsset) {
    let cacheEntry = null;

    for (let i = 0; i < this.pages.length; ++i) {
      cacheEntry = this.addToPage(i, key, width, height, createAsset);

      if (cacheEntry) {
        this.entries.set(key, cacheEntry);
        break;
      }

      if (this.pages[i].empty) {
        throw new Error(`Failed to cache \"${key}\"`);
      }
    }

    if (!cacheEntry) {
      this.handleOutOfSpace();
      return this.add(key, width, height, createAsset);
    }

    return cacheEntry;
  }

  handleOutOfSpace() {
    this.addPage();
  }

  addPage() {
    let texturePage = this.multiTexture.addPage();
    let newPage = new TextureCachePage(texturePage);

    this.pages.push(newPage);
  }

  addToPage(pageIndex, key, width, height, createAsset) {
    let page = this.pages[pageIndex];
    let bin = page.shelfPacker.packOne(width, height);

    if (!bin) {
      return null;
    }

    this.multiTexture.add(key, pageIndex, bin.x, bin.y, width, height);

    let asset = createAsset();

    let entry = new TextureCacheEntry(asset, page, bin);
    this.pending.push(entry);

    return entry;
  }

  loadEntry(entry) {
    entry.asset.load(this.gfxLoader).then((pixels) => {
      let page = entry.page.texturePage;
      let x = entry.bin.x;
      let y = entry.bin.y;
      page.draw(pixels, x, y);
    });
  }

  update() {
    let start = performance.now();
    let elapsed;
    let loaded = 0;
    let loadTime = Math.min(3, 1000 / this.scene.game.loop.actualFps / 2);

    this.pending.sort((a, b) => b.refCount - a.refCount);

    for (let entry of this.pending) {
      this.loadEntry(entry);
      ++loaded;
      elapsed = performance.now() - start;
      if (elapsed > loadTime) {
        break;
      }
    }

    this.pending.splice(0, loaded);
    if (loaded > 0) {
      console.debug(`Sent ${loaded} entries to the worker in ${elapsed}ms`);
    }
  }
}

export class EvictingTextureCache extends TextureCache {
  constructor(scene, gfxLoader, width, height) {
    super(scene, gfxLoader, width, height);
    this.canEvict = true;
  }

  add(key, width, height, createAsset) {
    let entry = super.add(key, width, height, createAsset);
    this.canEvict = true;
    return entry;
  }

  handleOutOfSpace() {
    if (this.canEvict) {
      this.evict();
    } else {
      this.addPage();
    }
  }

  evict() {
    for (let [key, value] of this.entries.entries()) {
      if (value.refCount === 0) {
        this.evictEntry(key);
      }
    }
    this.canEvict = false;
  }

  evictEntry(key) {
    let entry = this.entries.get(key);
    let asset = entry.asset;
    let texture = this.scene.textures.get(asset.textureKey);

    let removeFromTexture = (frame) => {
      delete texture.frames[frame.name];
      texture.frameTotal--;
      frame.destroy();
    };

    removeFromTexture(asset.textureFrame);

    if (asset.animation) {
      for (let animFrame of asset.animation.frames) {
        removeFromTexture(animFrame.frame);
      }
      asset.animation.destroy();
    }

    this.entries.delete(key);
  }
}
