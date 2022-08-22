import ShelfPack from "@mapbox/shelf-pack";
import { AssetFactory } from "./asset";
import { DrawableMultiTexture } from "./drawable-multi-texture";
import { PendingPromise } from "../util/pending-promise";
import { isEmpty } from "../util/object-utils";

class TextureCacheEntry {
  constructor(key, defaultAsset) {
    this.key = key;
    this.asset = defaultAsset;
    this.page = null;
    this.bin = null;
    this.refCount = 0;
    this.loadingCompletePromise = new PendingPromise();
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

  get loadingComplete() {
    return this.loadingCompletePromise && this.loadingCompletePromise.promise;
  }
}

class ResourceTextureCacheEntry extends TextureCacheEntry {
  constructor(key, defaultAsset, fileID, resourceID) {
    super(key, defaultAsset);
    this.fileID = fileID;
    this.resourceID = resourceID;
  }

  createAsset(assetFactory, textureKey) {
    return assetFactory.createResource(
      textureKey,
      this.key,
      this.fileID,
      this.resourceID
    );
  }

  async loadGFX(gfxLoader) {
    return gfxLoader.loadResource(this.fileID, this.resourceID);
  }
}

class SpecTextureCacheEntry extends TextureCacheEntry {
  constructor(key, defaultAsset, tileSpec) {
    super(key, defaultAsset);
    this.tileSpec = tileSpec;
  }

  createAsset(assetFactory, textureKey) {
    return assetFactory.createRaw(textureKey, this.key);
  }

  async loadGFX(gfxLoader) {
    return gfxLoader.loadRaw(`specs/${this.tileSpec}.png`);
  }
}

class EntityTextureCacheEntry extends TextureCacheEntry {
  constructor(key, defaultAsset, entityType) {
    super(key, defaultAsset);
    this.entityType = entityType;
  }

  createAsset(assetFactory, textureKey) {
    return assetFactory.createRaw(textureKey, this.key);
  }

  async loadGFX(gfxLoader) {
    return gfxLoader.loadRaw(`entities/${this.entityType}.png`);
  }
}

class CursorTextureCacheEntry extends TextureCacheEntry {
  constructor(key, defaultAsset) {
    super(key, defaultAsset);
  }

  createAsset(assetFactory, textureKey) {
    return assetFactory.createCursor(textureKey, this.key);
  }

  async loadGFX(gfxLoader) {
    return gfxLoader.loadRaw("cursor.png");
  }
}

class BlackTileTextureCacheEntry extends TextureCacheEntry {
  constructor(key, defaultAsset) {
    super(key, defaultAsset);
  }

  createAsset(assetFactory, textureKey) {
    return assetFactory.createRaw(textureKey, this.key);
  }

  async loadGFX(gfxLoader) {
    return gfxLoader.loadRaw("black.png");
  }
}

class TextureCachePage {
  constructor(texturePage) {
    this.texturePage = texturePage;
    this.shelfPacker = new ShelfPack(texturePage.width, texturePage.height);
  }

  get empty() {
    return isEmpty(this.shelfPacker.bins);
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

  getEntry(key, createEntry) {
    let entry = this.entries.get(key);
    if (!entry) {
      entry = createEntry();
      this.entries.set(key, entry);
      this.pending.push(entry);
    }
    return entry;
  }

  getResource(fileID, resourceID) {
    let key = this.makeResourceKey(fileID, resourceID);
    return this.getEntry(key, () => {
      return new ResourceTextureCacheEntry(
        key,
        this.assetFactory.getDefault(),
        fileID,
        resourceID
      );
    });
  }

  getSpec(tileSpec) {
    let key = this.makeSpecKey(tileSpec);
    return this.getEntry(key, () => {
      return new SpecTextureCacheEntry(
        key,
        this.assetFactory.getDefault(),
        tileSpec
      );
    });
  }

  getEntity(entityType) {
    let key = this.makeEntityKey(entityType);
    return this.getEntry(key, () => {
      return new EntityTextureCacheEntry(
        key,
        this.assetFactory.getDefault(),
        entityType
      );
    });
  }

  getBlackTile() {
    let key = "black";
    return this.getEntry(key, () => {
      return new BlackTileTextureCacheEntry(
        key,
        this.assetFactory.getDefault()
      );
    });
  }

  getCursor() {
    let key = "cursor";
    return this.getEntry(key, () => {
      return new CursorTextureCacheEntry(key, this.assetFactory.getDefault());
    });
  }

  findSpace(entry, width, height) {
    let bin = null;

    for (let i = 0; i < this.pages.length; ++i) {
      bin = this.findSpaceInPage(i, entry, width, height);

      if (bin) {
        break;
      }

      if (this.pages[i].empty) {
        console.error(
          `Failed to find space in the texture cache for \"${entry.key}\"`
        );
        return false;
      }
    }

    if (!bin) {
      this.handleOutOfSpace();
      return this.findSpace(entry, width, height);
    }

    return true;
  }

  handleOutOfSpace() {
    this.addPage();
  }

  addPage() {
    let texturePage = this.multiTexture.addPage();
    let newPage = new TextureCachePage(texturePage);

    this.pages.push(newPage);
  }

  findSpaceInPage(pageIndex, entry, width, height) {
    let page = this.pages[pageIndex];
    let bin = page.shelfPacker.packOne(width, height);

    if (bin) {
      this.multiTexture.add(entry.key, pageIndex, bin.x, bin.y, width, height);
      entry.page = page;
      entry.bin = bin;
    }

    return !!bin;
  }

  async loadEntry(entry) {
    let pixels = await entry.loadGFX(this.gfxLoader);

    if (this.findSpace(entry, pixels.width, pixels.height)) {
      let page = entry.page.texturePage;
      let x = entry.bin.x;
      let y = entry.bin.y;
      page.draw(pixels, x, y);
      entry.asset = entry.createAsset(this.assetFactory, this.multiTexture.key);
    }

    entry.loadingCompletePromise.resolve();
    entry.loadingCompletePromise = null;
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

  getEntry(key, createEntry) {
    let entry = super.getEntry(key, createEntry);
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

    if (entry.bin) {
      let page = entry.page;
      page.shelfPacker.unref(entry.bin);
      if (page.empty) {
        page.shelfPacker = new ShelfPack(
          page.texturePage.width,
          page.texturePage.height
        );
      }
    }

    this.entries.delete(key);
  }
}
