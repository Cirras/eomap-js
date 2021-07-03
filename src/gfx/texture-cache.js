import ShelfPack from "@mapbox/shelf-pack";
import { GfxProcessor } from "./gfx-processor";
import { CanvasMultiTexture } from "./canvas-multi-texture";

class TextureCacheEntry {
  constructor(data, page, bin) {
    this.data = data;
    this.page = page;
    this.bin = bin;
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
  constructor(scene, identifier, width, height) {
    this.scene = scene;
    this.identifier = identifier;
    this.pages = [];
    this.assets = [];
    this.gfxProcessor = new GfxProcessor(scene, identifier);
    this.canRebuild = false;

    this.canvasMultiTexture = new CanvasMultiTexture(
      this.scene.textures,
      this.identifier + ".textureCache",
      width,
      height
    );

    let firstPage = new TextureCachePage(this.canvasMultiTexture.pages[0]);
    this.pages.push(firstPage);
  }

  get(fileKey, frameKey) {
    for (let asset of this.assets) {
      if (
        asset.data.originFileKey === fileKey &&
        asset.data.originFrameKey === frameKey
      ) {
        return asset;
      }
    }

    return this.add(fileKey, frameKey);
  }

  add(fileKey, frameKey) {
    let cacheEntry;

    for (let i = 0; i < this.pages.length; ++i) {
      cacheEntry = this.addToPage(i, fileKey, frameKey);

      if (cacheEntry) {
        this.assets.push(cacheEntry);
        break;
      }

      if (this.pages[i].empty) {
        throw new Error(
          "Failed to cache Texture-Asset " + fileKey + "." + frameKey
        );
      }
    }

    if (!cacheEntry) {
      this.handleOutOfSpace();
      return this.add(fileKey, frameKey);
    }

    this.canRebuild = true;
    return cacheEntry;
  }

  handleOutOfSpace() {
    if (this.canRebuild) {
      this.rebuild();
    } else {
      this.addPage();
    }
  }

  addPage() {
    let canvasTexturePage = this.canvasMultiTexture.addPage();
    let newPage = new TextureCachePage(canvasTexturePage);

    this.pages.push(newPage);
  }

  addToPage(pageIndex, fileKey, frameKey) {
    let page = this.pages[pageIndex];
    let textureFrame = this.scene.textures.getFrame(fileKey, frameKey);
    let bin = page.shelfPacker.packOne(
      textureFrame.cutWidth,
      textureFrame.cutHeight
    );

    if (!bin) {
      return null;
    }

    let cacheFrameKey = fileKey + "." + frameKey;

    let cacheFrame = this.canvasMultiTexture.add(
      cacheFrameKey,
      pageIndex,
      bin.x,
      bin.y,
      textureFrame.cutWidth,
      textureFrame.cutHeight
    );

    cacheFrame.setTrim(
      textureFrame.realWidth,
      textureFrame.realHeight,
      textureFrame.x,
      textureFrame.y,
      textureFrame.cutWidth,
      textureFrame.cutHeight
    );

    this.drawToPage(page, textureFrame, bin.x, bin.y);

    let assetData = this.gfxProcessor.processAssetData(
      fileKey,
      frameKey,
      this.canvasMultiTexture.key,
      cacheFrameKey
    );

    return new TextureCacheEntry(assetData, page, bin);
  }

  rebuild() {
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
      page.canvasTexturePage.clear();
    }

    Phaser.Utils.Array.StableSort(this.assets, this.refCountSort);

    for (let asset of this.assets) {
      let data = asset.data;
      let textureFrame = this.scene.textures.getFrame(
        data.originFileKey,
        data.originFrameKey
      );

      for (let i = 0; i < this.pages.length; ++i) {
        let page = this.pages[i];
        let isLastPage = i === this.pages.length - 1;
        let oldBin = asset.bin;
        let newBin = page.shelfPacker.packOne(
          textureFrame.cutWidth,
          textureFrame.cutHeight
        );

        if (!newBin) {
          if (isLastPage) {
            // console.log('Added page during rebuild.');
            this.addPage();
          }

          continue;
        }

        asset.bin = newBin;

        if (data.hasAnimation) {
          let animation = this.scene.anims.get(data.animationKey);
          let diffX = newBin.x - oldBin.x;
          let diffY = newBin.y - oldBin.y;

          for (let animFrame of animation.frames) {
            let frame = animFrame.frame;

            moveFrameToPage(
              frame,
              page,
              frame.cutX + diffX,
              frame.cutY + diffY
            );
          }
        } else {
          moveFrameToPage(asset.data.textureFrame, page, newBin.x, newBin.y);
        }

        this.drawToPage(page, textureFrame, newBin.x, newBin.y);

        break;
      }

      this.canRebuild = false;
    }

    for (let i = this.assets.length - 1; i >= 0; --i) {
      let asset = this.assets[i];

      if (asset.refCount > 0) {
        break;
      }

      this.removeAsset(asset);
    }
  }

  drawToPage(page, frame, x, y) {
    if (frame) {
      let cd = frame.canvasData;
      let width = frame.cutWidth;
      let height = frame.cutHeight;
      let res = frame.source.resolution;

      page.canvasTexturePage.context.drawImage(
        frame.source.image,
        cd.x,
        cd.y,
        width,
        height,
        x,
        y,
        width / res,
        height / res
      );
    }

    page.dirty = true;
    return this;
  }

  removeAsset(asset) {
    let data = asset.data;
    let texture = this.scene.textures.get(data.fileKey);

    let removeFromTexture = (frame) => {
      delete texture.frames[frame.name];
      texture.frameTotal--;
      frame.destroy();
    };

    if (data.hasAnimation) {
      let animation = this.scene.anims.get(data.animationKey);

      for (let animFrame of animation.frames) {
        removeFromTexture(animFrame.frame);
      }

      animation.destroy();
    } else {
      removeFromTexture(asset.data.textureFrame);
    }

    Phaser.Utils.Array.Remove(this.assets, asset);
  }

  uploadChanges() {
    // var start = performance.now();

    for (let page of this.pages) {
      if (page.dirty) {
        page.canvasTexturePage.update();
        page.canvasTexturePage.refresh();
        page.dirty = false;
      }
    }

    // var end = performance.now();
    // console.log('Upload took ' + (end - start) + ' milliseconds.');
  }

  refCountSort(childA, childB) {
    return childB.refCount - childA.refCount;
  }
}
