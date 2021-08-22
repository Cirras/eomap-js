class GFXData {
  constructor(
    fileID,
    resourceID,
    textureKey,
    frameKey,
    textureFrame,
    hasAnimation,
    animationKey
  ) {
    this.fileID = fileID;
    this.resourceID = resourceID;
    this.textureKey = textureKey;
    this.frameKey = frameKey;
    this.textureFrame = textureFrame;
    this.hasAnimation = hasAnimation;
    this.animationKey = animationKey;
  }
}

export class GFXProcessor {
  constructor(scene, identifier) {
    this.scene = scene;
    this.identifier = identifier;
  }

  processAssetData(fileID, resourceID, textureKey, frameKey) {
    let textureAtlas = this.scene.textures.get(textureKey);
    let textureFrame = textureAtlas.get(frameKey);
    let hasAnimation = false;
    let animationKey;

    let canBeAnimated = fileID === 3 || fileID === 6;
    let isWideEnough = textureFrame.realWidth >= 32 * 4;

    if (canBeAnimated && isWideEnough) {
      animationKey = this.getAnimationKey(textureKey, frameKey);

      let animationFrames = this.createAnimationFrames(
        textureAtlas,
        textureFrame,
        Math.floor(textureFrame.realWidth / 4),
        textureFrame.realHeight
      );

      this.scene.game.anims.create({
        key: animationKey,
        frames: animationFrames,
        frameRate: 2,
        repeat: -1,
      });

      hasAnimation = true;
      textureFrame = this.scene.textures.getFrame(
        animationFrames[0].key,
        animationFrames[0].frame
      );
    }

    return new GFXData(
      fileID,
      resourceID,
      textureKey,
      frameKey,
      textureFrame,
      hasAnimation,
      animationKey
    );
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
        let animationFrameKey = this.getAnimationFrameKey(
          frame.name,
          frameIndex
        );

        let sheetFrame = texture.add(
          animationFrameKey,
          frame.sourceIndex,
          x + frameX,
          y + frameY,
          frameWidth,
          frameHeight
        );

        animationFrames.push({
          key: texture.key,
          frame: animationFrameKey,
        });

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

  getAnimationKey(fileKey, frameKey) {
    return this.identifier + "." + fileKey + "." + frameKey;
  }

  getAnimationFrameKey(frameKey, index) {
    return frameKey + ".animationFrame." + index.toString();
  }
}
