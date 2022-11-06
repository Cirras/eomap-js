export class Asset {
  constructor(textureFrame, width, height, animationFrames) {
    this.textureFrame = textureFrame;
    this.width = width;
    this.height = height;
    this.animationFrames = animationFrames;
  }

  getFrame(index) {
    if (this.animationFrames.length > 0) {
      return this.animationFrames[index];
    }
    return this.textureFrame;
  }

  get textureKey() {
    return this.textureFrame.texture.key;
  }

  get frameKey() {
    return this.textureFrame.name;
  }
}

export class AssetFactory {
  constructor(scene, identifier) {
    this.scene = scene;
    this.identifier = identifier;
    this.defaultAsset = null;
  }

  getDefault() {
    if (!this.defaultAsset) {
      let frame = this.scene.textures.get().frames["__BASE"];
      this.defaultAsset = new Asset(frame, frame.width, frame.height, []);
    }
    return this.defaultAsset;
  }

  createResource(textureKey, frameKey, fileID) {
    let texture = this.scene.textures.get(textureKey);
    let textureFrame = texture.get(frameKey);
    let width = textureFrame.realWidth;
    let height = textureFrame.realHeight;
    let animationFrames = [];

    if (this.isAnimated(fileID, width)) {
      animationFrames = this.createAnimationFrames(
        texture,
        textureFrame,
        Math.floor(textureFrame.realWidth / 4),
        textureFrame.realHeight
      );

      let sizeFrame = animationFrames[0];
      width = sizeFrame.width;
      height = sizeFrame.height;
    }

    return new Asset(textureFrame, width, height, animationFrames);
  }

  isAnimated(fileID, width) {
    switch (fileID) {
      case 3:
        return width > 250;
      case 6:
        return width > 120;
      default:
        return false;
    }
  }

  createRaw(textureKey, frameKey) {
    let textureFrame = this.getTextureFrame(textureKey, frameKey);
    return new Asset(textureFrame, textureFrame.width, textureFrame.height, []);
  }

  createCursor(textureKey, frameKey) {
    let texture = this.scene.textures.get(textureKey);
    let textureFrame = texture.get(frameKey);

    let animationFrames = this.createAnimationFrames(
      texture,
      textureFrame,
      Math.floor(textureFrame.realWidth / 5),
      textureFrame.realHeight
    );

    let sizeFrame = animationFrames[0];
    let width = sizeFrame.width;
    let height = sizeFrame.height;

    return new Asset(textureFrame, width, height, animationFrames);
  }

  createAnimationFrames(texture, frame, frameWidth, frameHeight) {
    let animationFrames = [];

    let x = frame.cutX;
    let y = frame.cutY;

    let cutWidth = frame.cutWidth;
    let cutHeight = frame.cutHeight;
    let sheetWidth = frame.realWidth;
    let sheetHeight = frame.realHeight;

    let row = Math.floor(sheetWidth / frameWidth);
    let column = Math.floor(sheetHeight / frameHeight);

    let leftPad = frame.x;
    let leftWidth = frameWidth - leftPad;

    let rightWidth = frameWidth - (sheetWidth - cutWidth - leftPad);

    let topPad = frame.y;
    let topHeight = frameHeight - topPad;

    let bottomHeight = frameHeight - (sheetHeight - cutHeight - topPad);

    let frameX = 0;
    let frameY = 0;
    let frameIndex = 0;

    for (let sheetY = 0; sheetY < column; sheetY++) {
      let topRow = sheetY === 0;
      let bottomRow = sheetY === column - 1;

      for (let sheetX = 0; sheetX < row; sheetX++) {
        let leftRow = sheetX === 0;
        let rightRow = sheetX === row - 1;

        let sheetFrame = texture.add(
          frame.name + ".animationFrame." + frameIndex.toString(),
          frame.sourceIndex,
          x + frameX,
          y + frameY,
          frameWidth,
          frameHeight
        );

        animationFrames.push(sheetFrame);

        if (leftRow || topRow || rightRow || bottomRow) {
          let destX = leftRow ? leftPad : 0;
          let destY = topRow ? topPad : 0;

          let trimWidth = 0;
          let trimHeight = 0;

          if (leftRow) {
            trimWidth += frameWidth - leftWidth;
          }

          if (rightRow) {
            trimWidth += frameWidth - rightWidth;
          }

          if (topRow) {
            trimHeight += frameHeight - topHeight;
          }

          if (bottomRow) {
            trimHeight += frameHeight - bottomHeight;
          }

          let destWidth = frameWidth - trimWidth;
          let destHeight = frameHeight - trimHeight;

          sheetFrame.cutWidth = destWidth;
          sheetFrame.cutHeight = destHeight;

          sheetFrame.setTrim(
            frameWidth,
            frameHeight,
            destX,
            destY,
            destWidth,
            destHeight
          );
        }

        if (leftRow) {
          frameX += leftWidth;
        } else if (rightRow) {
          frameX += rightWidth;
        } else {
          frameX += frameWidth;
        }

        frameIndex++;
      }

      frameX = 0;

      if (topRow) {
        frameY += topHeight;
      } else if (bottomRow) {
        frameY += bottomHeight;
      } else {
        frameY += frameHeight;
      }
    }

    return animationFrames;
  }

  getTextureFrame(textureKey, frameKey) {
    let texture = this.scene.textures.get(textureKey);
    return texture.get(frameKey);
  }
}
