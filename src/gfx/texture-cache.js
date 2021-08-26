import ShelfPack from "@mapbox/shelf-pack";
import { GFXProcessor } from "./gfx-processor";
import { CanvasMultiTexture } from "./canvas-multi-texture";

const CacheStatus = {
  Fragmented: 0,
  Rebuilding: 1,
  Optimized: 2,
};

class TextureCacheEntry {
  constructor(data, page, bin, pixels) {
    this.data = data;
    this.page = page;
    this.bin = bin;
    this.pixels = pixels;
    this.refCount = 0;
  }

  incRef() {
    ++this.refCount;
  }

  decRef() {
    if (this.refCount === 0) {
      throw new Error("Negative asset entry refCount");
    }

    --this.refCount;
  }
}

class TextureCachePage {
  constructor(canvasTexturePage) {
    this.canvasTexturePage = canvasTexturePage;
    this.shelfPacker = new ShelfPack(
      canvasTexturePage.width,
      canvasTexturePage.height
    );
    this.dirty = false;
  }

  get empty() {
    return Object.keys(this.shelfPacker.bins).length === 0;
  }
}

export class TextureCache {
  constructor(scene, gfxLoader, width, height, minimumPages) {
    if (minimumPages === undefined) {
      minimumPages = 1;
    }

    this.scene = scene;
    this.gfxLoader = gfxLoader;
    this.minimumPages = minimumPages;
    this.identifier = Phaser.Utils.String.UUID();
    this.pages = [];
    this.assets = [];
    this.gfxProcessor = new GFXProcessor(scene, this.identifier);
    this.status = CacheStatus.Fragmented;

    this.canvasMultiTexture = new CanvasMultiTexture(
      this.scene.textures,
      this.identifier,
      width,
      height
    );

    let firstPage = new TextureCachePage(this.canvasMultiTexture.pages[0]);
    this.pages.push(firstPage);
  }

  get(fileID, resourceID) {
    for (let asset of this.assets) {
      if (
        asset.data.fileID === fileID &&
        asset.data.resourceID === resourceID
      ) {
        return asset;
      }
    }
    return this.add(fileID, resourceID);
  }

  add(fileID, resourceID) {
    let cacheEntry = null;

    for (let i = 0; i < this.pages.length; ++i) {
      cacheEntry = this.addToPage(i, fileID, resourceID);

      if (cacheEntry) {
        this.assets.push(cacheEntry);
        break;
      }

      if (this.pages[i].empty) {
        throw new Error(
          `Failed to cache resource ${resourceID} from file ${fileID}`
        );
      }
    }

    if (!cacheEntry) {
      this.handleOutOfSpace();
      return this.add(fileID, resourceID);
    }

    this.status = CacheStatus.Fragmented;
    this.dirty = true;

    return cacheEntry;
  }

  handleOutOfSpace() {
    switch (this.status) {
      case CacheStatus.Fragmented:
        if (this.pages.length < this.minimumPages) {
          this.addPage();
        } else {
          this.rebuild();
        }
        break;
      case CacheStatus.Optimized:
        this.addPage();
        break;
    }
  }

  addPage() {
    let canvasTexturePage = this.canvasMultiTexture.addPage();
    let newPage = new TextureCachePage(canvasTexturePage);

    this.pages.push(newPage);
  }

  addToPage(pageIndex, fileID, resourceID) {
    let page = this.pages[pageIndex];
    let info = this.gfxLoader.info(fileID, resourceID);

    let bin = page.shelfPacker.packOne(info.width, info.height);

    if (!bin) {
      return null;
    }

    let cacheFrameKey = fileID + "." + resourceID;
    this.canvasMultiTexture.add(
      cacheFrameKey,
      pageIndex,
      bin.x,
      bin.y,
      info.width,
      info.height
    );

    let assetData = this.gfxProcessor.processAssetData(
      fileID,
      resourceID,
      this.canvasMultiTexture.key,
      cacheFrameKey
    );

    let pixels = this.gfxLoader.loadResource(fileID, resourceID);

    return new TextureCacheEntry(assetData, page, bin, pixels);
  }

  rebuild() {
    this.status = CacheStatus.Rebuilding;

    const moveFrameToPage = (frame, page, x, y) => {
      let realWidth = frame.realWidth;
      let realHeight = frame.realHeight;

      frame.setSize(frame.cutWidth, frame.cutHeight, x, y);

      frame.setTrim(
        realWidth,
        realHeight,
        frame.x,
        frame.y,
        frame.cutWidth,
        frame.cutHeight
      );

      frame.source = page.canvasTexturePage.source;
      frame.sourceIndex = this.canvasMultiTexture.getTextureSourceIndex(
        frame.source
      );
      frame.glTexture = frame.source.glTexture;
    };

    for (let page of this.pages) {
      page.shelfPacker.clear();
    }

    Phaser.Utils.Array.StableSort(this.assets, this.refCountSort);

    for (let asset of this.assets) {
      let data = asset.data;

      for (let i = 0; i < this.pages.length; ++i) {
        let page = this.pages[i];
        let isLastPage = i === this.pages.length - 1;
        let info = this.gfxLoader.info(
          asset.data.fileID,
          asset.data.resourceID
        );
        let oldBin = asset.bin;
        let newBin = page.shelfPacker.packOne(info.width, info.height);

        if (!newBin) {
          if (isLastPage) {
            this.addPage();
          }

          continue;
        }

        asset.page = page;
        asset.bin = newBin;

        moveFrameToPage(asset.data.textureFrame, page, newBin.x, newBin.y);

        if (data.animation) {
          let diffX = newBin.x - oldBin.x;
          let diffY = newBin.y - oldBin.y;

          for (let animFrame of data.animation.frames) {
            let frame = animFrame.frame;
            moveFrameToPage(
              frame,
              page,
              frame.cutX + diffX,
              frame.cutY + diffY
            );
          }
        }

        if (!asset.pixels) {
          asset.pixels = this.gfxLoader.loadResource(
            asset.data.fileID,
            asset.data.resourceID
          );
        }

        break;
      }

      this.status = CacheStatus.Optimized;
    }

    for (let i = this.assets.length - 1; i >= 0; --i) {
      let asset = this.assets[i];

      if (asset.refCount > 0) {
        break;
      }

      this.removeAsset(asset);
    }

    this.status = CacheStatus.Optimized;
  }

  removeAsset(asset) {
    let data = asset.data;
    let texture = this.scene.textures.get(data.textureKey);

    let removeFromTexture = (frame) => {
      delete texture.frames[frame.name];
      texture.frameTotal--;
      frame.destroy();
    };

    removeFromTexture(asset.data.textureFrame);

    if (data.animation) {
      for (let animFrame of data.animation.frames) {
        removeFromTexture(animFrame.frame);
      }
      data.animation.destroy();
    }

    Phaser.Utils.Array.Remove(this.assets, asset);
  }

  update() {
    if (this.dirty) {
      for (let asset of this.assets) {
        this.upload(asset);
      }
      this.dirty = false;
    }
  }

  upload(asset) {
    if (!asset.pixels) {
      return;
    }

    let page = asset.page.canvasTexturePage;
    let x = asset.bin.x;
    let y = asset.bin.y;

    page.putData(asset.pixels, x, y);

    let glTexture = page.source.glTexture;

    if (glTexture) {
      let gl = page.source.renderer.gl;

      let width = asset.pixels.width;
      let height = asset.pixels.height;

      if (width > 0 && height > 0) {
        gl.activeTexture(gl.TEXTURE0);
        let currentTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
        gl.bindTexture(gl.TEXTURE_2D, glTexture);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

        gl.texSubImage2D(
          gl.TEXTURE_2D,
          0,
          x,
          y,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          asset.pixels
        );

        if (currentTexture) {
          gl.bindTexture(gl.TEXTURE_2D, currentTexture);
        }
      }
    }

    asset.pixels = null;
  }

  refCountSort(childA, childB) {
    return childB.refCount - childA.refCount;
  }
}
