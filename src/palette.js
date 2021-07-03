import { ScaleModes } from "phaser";
import { GfxProcessor } from "./gfx/gfx-processor";

export const PaletteColor = {
  Outline: 0x181c1f,
  Background: 0x181c1f,
  HeaderTab: 0x2a2c30,
  HeaderTabFocus: 0x303338,
  AssetBackground: 0x000000,
  AssetBackgroundLight: 0x303338,
  SliderThumb: 0xaaaaaa,
  SliderThumbFocus: 0xcccccc,
  SliderThumbPress: 0x727272,
};

export const PaletteSize = {
  AssetContainerMaxLandscapeWidth: 64 * 9,
  LandscapeWidthRatio: 0.3,
  PortraitHeightRatio: 0.4,
  AssetPaddingInnerWidth: 5,
  AssetPaddingInnerHeight: 2,
  AssetPaddingOuterWidth: 10,
  AssetPaddingOuterHeight: 10,
  SliderWidth: 10,
};

var normalizeWheelDelta = (function () {
  // Keep a distribution of observed values, and scale by the
  // 33rd percentile.
  var distribution = [];
  var done = null;
  var scale = 32;

  return function (n) {
    // Zeroes don't count.
    if (n === 0) {
      return n;
    }

    // After 500 samples, we stop sampling and keep current factor.
    if (done != null) {
      return n * done;
    }

    var abs = Math.abs(n);

    // Insert value (sorted in ascending order).
    outer: do {
      for (let i = 0; i < distribution.length; ++i) {
        if (abs <= distribution[i]) {
          distribution.splice(i, 0, abs);
          break outer;
        }
      }
      distribution.push(abs);
    } while (false);

    // Factor is scale divided by 33rd percentile.
    let factor = scale / distribution[Math.floor(distribution.length / 3)];

    if (distribution.length === 500) {
      done = factor;
    }

    return n * factor;
  };
})();

class PaletteHeader {
  constructor(palette) {
    this.palette = palette;

    this.headerText = palette.scene.add.text(0, 0, "Palette", {
      fontSize: 20,
      color: "#CCCCCC",
      fontFamily: "Calibri",
    });

    this.headerText.setOrigin(0.5, 0);

    this.tabs = [];
    this.width = 0;
    this._height = 0;
    this._x = 0;
    this._y = 0;
  }

  addTab(tabName, layerIndex) {
    let tab = new PaletteTab(this.palette, tabName, layerIndex);
    tab.visible = false;
    this.tabs.push(tab);

    return this;
  }

  layout() {
    this.headerText.x = this.x + this.width / 2;
    this.headerText.y = this.y + 10;

    this._height = this.headerText.height + 20;

    let tabRow = [];
    let rowWidth = 0;

    for (let tab of this.tabs) {
      if (rowWidth + tab.minWidth + 2 > this.width) {
        // +2 for left/right outlines
        if (tab.minWidth > this.width) {
          tab.visible = false;
          continue;
        }

        this.layoutRow(tabRow, rowWidth + 1); // +1 for right outline
        tabRow = [];
        rowWidth = 0;
      }

      tabRow.push(tab);
      rowWidth += tab.minWidth + 1; // +1 for left outline
    }

    if (tabRow.length > 0) {
      this.layoutRow(tabRow, rowWidth);
    }
  }

  layoutRow(tabRow, rowWidth) {
    let addWidth = Math.floor((this.width - rowWidth) / tabRow.length);
    let tabX = Math.ceil(this.x) + 1;
    let biggestTabHeight = 0;

    for (let tab of tabRow) {
      tab.visible = true;
      tab.width = tab.minWidth + addWidth;
      tab.x = tabX;
      tab.y = this.y + this._height;

      tabX += tab.width + 1;
      biggestTabHeight = Math.max(biggestTabHeight, tab.height);
    }

    this._height += biggestTabHeight + 1;
  }

  get height() {
    return this._height;
  }

  get width() {
    return this._width;
  }

  set width(newWidth) {
    if (this._width === newWidth) {
      return;
    }

    this._width = newWidth;

    this.layout();
  }

  get x() {
    return this._x;
  }

  set x(newX) {
    if (this._x === newX) {
      return;
    }

    let diffX = -(this._x - newX);

    this._x = newX;
    this.headerText.x += diffX;

    for (let tab of this.tabs) {
      tab.x += diffX;
    }
  }

  get y() {
    return this._y;
  }

  set y(newY) {
    if (this._y === newY) {
      return;
    }

    let diffY = -(this._y - newY);

    this._y = newY;
    this.headerText.y += diffY;

    for (let tab of this.tabs) {
      tab.y += diffY;
    }
  }
}

class PaletteTab {
  constructor(palette, tabName, layerIndex) {
    this.palette = palette;
    this.layerIndex = layerIndex;

    this.text = palette.scene.add.text(0, 0, tabName, {
      color: "#CCCCCC",
      font: "18px Calibri",
    });

    this.background = palette.scene.rexUI.add.roundRectangle(
      0,
      0,
      0,
      0,
      {
        tl: 15,
        tr: 15,
      },
      PaletteColor.HeaderTab
    );

    this.text.scaleMode = ScaleModes.LINEAR;
    this.background.scaleMode = ScaleModes.LINEAR;
    this.text.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

    this.background.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, 0, 0),
      Phaser.Geom.Rectangle.Contains
    );

    this.minWidth = this.text.width + 20;
    this.minHeight = this.text.height + 20;
    this.width = this.minWidth;
    this.height = this.minHeight;
    this.x = 0;
    this.y = 0;
    this.visible = true;

    this.selected = false;
    this.hovered = false;

    this.background.setDepth(0);
    this.text.setDepth(1);
    this.text.setOrigin(0.5, 0.5);

    this.background.on("pointerover", () => {
      this.hovered = true;
      this.updateColor();
    });

    this.background.on("pointerout", () => {
      this.hovered = false;
      this.updateColor();
    });

    this.background.on("pointerdown", () => {
      this.palette.selectLayer(this.layerIndex);
    });
  }

  updateColor() {
    this.background.setFillStyle(this.color);
  }

  select() {
    this.selected = true;
    this.updateColor();
    this.text.setFont("bold 18px Calibri");
  }

  unselect() {
    this.selected = false;
    this.updateColor();
    this.text.setFont("18px Calibri");
  }

  get color() {
    if (this.hovered) {
      return PaletteColor.HeaderTabFocus;
    }

    return this.selected ? PaletteColor.HeaderTabFocus : PaletteColor.HeaderTab;
  }

  get width() {
    return this._width;
  }

  set width(newWidth) {
    this._width = Math.max(this.minWidth, newWidth);
    this.background.width = this._width;
    this.background.input.hitArea.width = this._width;
  }

  get height() {
    return this._height;
  }

  set height(newHeight) {
    this._height = Math.max(this.minHeight, newHeight);
    this.background.height = this._height;
    this.background.input.hitArea.height = this._height;
  }

  get x() {
    return this._x;
  }

  set x(newX) {
    this._x = newX;

    let halfWidth = this.background.width / 2;
    this.background.x = this._x + halfWidth;
    this.text.x = this._x + halfWidth;
  }

  get y() {
    return this._y;
  }

  set y(newY) {
    this._y = newY;

    let halfHeight = this.background.height / 2;
    this.background.y = this._y + halfHeight;
    this.text.y = this._y + halfHeight;
  }

  get visible() {
    return this._visible;
  }

  set visible(newVisible) {
    this._visible = newVisible;
    this.background.visible = newVisible;
    this.text.visible = newVisible;
  }
}

class PaletteFile {
  constructor(key, texture) {
    this.key = key;
    this.entries = {};
    this.texture = texture;
  }

  getEntry(entryKey) {
    return this.entries[entryKey];
  }
}

class PaletteLayer {
  constructor(palette, file, index, backgroundColor) {
    this.palette = palette;
    this.file = file;
    this.index = index;

    this._x = 0;
    this._y = 0;
    this._width = 0;
    this._height = 0;

    this.assetBackground = palette.scene.rexUI.add.roundRectangle(
      0,
      0,
      0,
      0,
      0,
      backgroundColor
    );
    this.assetContainer = palette.scene.add.container(
      this.assetContainerX,
      this.assetContainerY
    );
    this.assetsHeight = 0;
    this.assetsDirty = true;
    this.assetAnchor;
    this.assetAnchorOffset = 0;
    this.manualScrolling = false;

    this.entries = {};
    this.selectedEntryKey = 0;
    this.assetBackground.setOrigin(0, 0);
    this.assetBackground.setStrokeStyle(
      PaletteSize.AssetPaddingInnerWidth,
      PaletteColor.AssetBackground
    );
    this.assetBackground.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, 0, 0),
      Phaser.Geom.Rectangle.Contains
    );
    this.populateEntries();
    this.maskAssets();

    this.scroller = this.palette.scene.scroller.add(this.assetBackground, {
      bounds: [0, 0],
      value: 0,
      slidingDeceleration: 3000,
      backDeceleration: 2000,

      valuechangeCallback: (value) => {
        if (this.scroller === undefined) {
          return;
        }

        this.assetContainer.y = value;
        this.cull(!this.manualScrolling);

        if (value > this.scroller.maxValue || value < this.scroller.minValue) {
          return;
        }

        if (this.scrollableLength === 0) {
          this.slider.value = 0;
          return;
        }

        this.slider.value =
          Math.abs(this.scroller.maxValue - value) / this.scrollableLength;
      },

      overminCallback: () => {
        this.slider.value = 1;
      },

      overmaxCallback: () => {
        this.slider.value = 0;
      },

      valuechangeCallbackScope: this,
      overminCallbackScope: this,
      overmaxCallbackScope: this,
    });

    this.sliderThumbHovered = false;
    this.sliderThumbPressed = false;

    this.sliderThumb = this.palette.scene.rexUI.add.roundRectangle(
      0,
      0,
      10,
      30,
      5,
      this.sliderThumbColor
    );
    this.sliderThumb.setOrigin(0, 0);

    this.sliderThumb.on("pointerover", () => {
      this.sliderThumbHovered = true;
      this.updateThumbColor();
    });

    this.sliderThumb.on("pointerout", () => {
      this.sliderThumbHovered = false;
      this.updateThumbColor();
    });

    this.sliderThumb.on(
      "dragstart",
      () => {
        this.sliderThumbPressed = true;
        this.updateThumbColor();
        this.scroller.setEnable(false);
      },
      this
    );

    this.sliderThumb.on(
      "dragend",
      () => {
        this.sliderThumbPressed = false;
        this.updateThumbColor();
        this.scroller.setEnable(true);
      },
      this
    );

    this.slider = this.palette.scene.slider.add(this.sliderThumb, {
      endPoints: [
        {
          x: 0,
          y: 0,
        },
        {
          x: 0,
          y: 0,
        },
      ],
      valuechangeCallback: (newValue) => {
        let scroll = this.scroller.maxValue - this.scrollableLength * newValue;
        scroll = Math.max(scroll, this.scroller.minValue);
        scroll = Math.min(scroll, this.scroller.maxValue);

        this.scroller.value = scroll;
      },
      valuechangeCallbackScope: this,
    });

    this.canUseScrollWheel = false;

    this.assetBackground.on("pointerover", () => {
      this.canUseScrollWheel = true;
    });

    this.assetBackground.on("pointerout", () => {
      this.canUseScrollWheel = false;
    });

    this.palette.scene.input.on(
      Phaser.Input.Events.POINTER_WHEEL,
      (_pointer, _gameObjects, _deltaX, deltaY, _deltaZ) => {
        if (this.canUseScrollWheel) {
          let normalizedY = Math.round(normalizeWheelDelta(-deltaY));

          if (!normalizedY) {
            normalizedY = deltaY > 0 ? 1 : -1;
          }

          let scroll = this.scroller.value + normalizedY;
          scroll = Math.max(scroll, this.scroller.minValue);
          scroll = Math.min(scroll, this.scroller.maxValue);

          this.scroller.value = scroll;
        }
      }
    );

    this.hide();
  }

  populateEntries() {
    this.entries = {};

    for (let entryKey in this.file.entries) {
      let fileEntry = this.file.entries[entryKey];
      let sprite;

      if (fileEntry.hasAnimation) {
        sprite = this.palette.scene.add
          .sprite(0, 0)
          .play(fileEntry.animationKey);
      } else {
        sprite = this.palette.scene.add.sprite(0, 0, this.file.key, entryKey);
      }

      this.entries[entryKey] = new PaletteLayerEntry(this, sprite, fileEntry);
      this.assetContainer.add(sprite);
    }
  }

  get scrollableLength() {
    return Math.abs(this.scroller.maxValue - this.scroller.minValue);
  }

  setScroll(value) {
    this.manualScrolling = true;
    this.scroller.value = value;
    this.manualScrolling = false;
  }

  getScroll() {
    return this.assetContainer.y;
  }

  hide() {
    this.assetBackground.visible = false;
    this.assetContainer.visible = false;
    this.sliderThumb.visible = false;

    for (let entryKey in this.entries) {
      let entry = this.entries[entryKey];

      if (entry.data.hasAnimation) {
        this.palette.scene.sys.updateList.remove(entry.sprite);
      }
    }
  }

  show() {
    this.assetBackground.visible = true;
    this.assetContainer.visible = true;
    this.sliderThumb.visible = true;
    this.layout();

    if (!this.scroller.value) {
      this.scroller.setValue(this.assetContainerY);
    }

    for (let entryKey in this.entries) {
      let entry = this.entries[entryKey];

      if (entry.data.hasAnimation) {
        this.palette.scene.sys.updateList.add(entry.sprite);
        this.palette.scene.syncToMasterAnimation(entry.sprite);
      }
    }
  }

  cull(findAssetAnchor) {
    if (findAssetAnchor) {
      this.assetAnchor = undefined;
    }

    for (let object of this.assetContainer.list) {
      let objectH = object.height;
      let objectTop = this.assetContainer.y + object.y;
      let objectBottom = objectTop + objectH;
      let cullTop = this.assetContainerY;
      let cullBottom = cullTop + this.assetContainerHeight;

      if (objectBottom > cullTop && objectTop < cullBottom) {
        object.visible = true;
        object.setInteractive();

        if (findAssetAnchor) {
          if (!this.assetAnchor || this.assetAnchor.y > object.y) {
            this.assetAnchor = object;
            this.assetAnchorOffset = objectTop - cullTop;
          }
        }

        continue;
      }

      object.visible = false;
      object.removeInteractive();
    }
  }

  calculateScrollerBounds() {
    let topBound = this.assetContainerY;
    let bottomBound = this.assetContainerY;

    if (this.assetsHeight > this.assetContainerHeight) {
      bottomBound = bottomBound - this.assetsHeight + this.assetContainerHeight;
    }

    this.scroller.setBounds(topBound, bottomBound);

    let sliderLeft = this.sliderX;
    let sliderTop = this.sliderY;
    let sliderLength = this.sliderHeight;

    let thumbRatio = Math.min(
      1,
      this.assetContainerHeight /
        Math.max(this.assetsHeight, this.scrollableLength)
    );
    let thumbLength = Math.max(20, thumbRatio * sliderLength);

    let topEndPoint = sliderTop;
    let topLeftEndPoint = sliderLeft;
    let bottomLeftEndPoint = sliderLeft;
    let bottomEndPoint = topEndPoint + sliderLength - thumbLength;

    this.sliderThumb.height = thumbLength;
    this.sliderThumb.input.hitArea.height = thumbLength;

    this.slider.setEndPoints(
      topLeftEndPoint,
      topEndPoint,
      bottomLeftEndPoint,
      bottomEndPoint
    );
  }

  scrollToAnchor() {
    let scroll = this.assetContainerY;

    if (this.assetAnchor) {
      scroll -= this.assetAnchor.y - this.assetAnchorOffset;
      scroll = Math.max(scroll, this.scroller.minValue);
      scroll = Math.min(scroll, this.scroller.maxValue);
    }

    this.setScroll(scroll);
  }

  layout() {
    if (this.assetsDirty) {
      this.layoutAssets();
    }

    this.maskAssets();
    this.cull();
    this.calculateScrollerBounds();
    this.scrollToAnchor();

    this.assetBackground.input.hitArea.setSize(
      this.assetBackground.width,
      this.assetBackground.height
    );
  }

  layoutAssets() {
    const xRes = 32;
    const yRes = 32;

    let pageWidth = Math.floor(this.assetContainerWidth / xRes);
    let colHeights = new Array(pageWidth).fill(0);

    this.assetsHeight = 0;

    for (let entryKey in this.entries) {
      let entry = this.entries[entryKey];

      /*
            if (!entry.data.textureFrame)
            {
                console.log(this.file.key + '/' + entryKey + ' is missing!');
                continue;
            }
            */

      let width = 64;
      let height = 32;

      if (this.file.key !== "tile") {
        width = entry.width();
        height = entry.height();
      }

      let blockWidth = Math.floor((width + xRes - 1) / xRes);
      let blockHeight = Math.floor((height + yRes - 1) / yRes);

      blockWidth = Math.min(blockWidth, pageWidth);

      let startY = 0x7fffffff;

      for (let colHeight of colHeights) {
        startY = Math.min(startY, colHeight);
      }

      let foundPosition = false;

      for (let y = startY; ; ++y) {
        for (let x = 0; x <= pageWidth - blockWidth; ++x) {
          let maxY = 0;

          for (let i = x; i < x + blockWidth; ++i) {
            maxY = Math.max(maxY, colHeights[i]);
          }

          if (maxY < y) {
            for (let i = x; i < x + blockWidth; ++i) {
              colHeights[i] = maxY + blockHeight;
            }

            entry.sprite.setPosition(x * xRes, (y - 1) * yRes);
            entry.sprite.setOrigin(0);

            this.assetsHeight = Math.max(
              entry.sprite.y + height,
              this.assetsHeight
            );

            foundPosition = true;
            break;
          }
        }

        if (foundPosition) {
          break;
        }
      }
    }

    this.assetsDirty = false;
  }

  maskAssets() {
    let rect = this.palette.scene.make.graphics();

    rect.fillRect(
      this.assetContainerX,
      this.assetContainerY,
      this.assetBackgroundWidth -
        (PaletteSize.AssetPaddingOuterWidth -
          PaletteSize.AssetPaddingInnerWidth),
      this.assetContainerHeight
    );

    this.assetContainer.clearMask();
    this.assetContainer.setMask(rect.createGeometryMask());
  }

  updateThumbColor() {
    this.sliderThumb.setFillStyle(this.sliderThumbColor);
  }

  get sliderThumbColor() {
    if (this.sliderThumbPressed) {
      return PaletteColor.SliderThumbPress;
    }

    if (this.sliderThumbHovered) {
      return PaletteColor.SliderThumbFocus;
    }

    return PaletteColor.SliderThumb;
  }

  get selectedEntry() {
    if (this.selectedEntryKey !== 0) {
      return this.entries[this.selectedEntryKey];
    }

    return undefined;
  }

  get x() {
    return this._x;
  }

  set x(newX) {
    this._x = newX;

    this.assetBackground.x =
      this.assetContainerX - PaletteSize.AssetPaddingInnerWidth;
    this.assetContainer.x = this.assetContainerX;
    this.assetContainer.mask.geometryMask.x = this.x;
  }

  get y() {
    return this._y;
  }

  set y(newY) {
    this._y = newY;
    this.assetBackground.y =
      this.assetContainerY - PaletteSize.AssetPaddingInnerHeight;
    this.assetContainer.mask.geometryMask.y = this.assetContainerY;
    this.calculateScrollerBounds();
    this.scrollToAnchor();
  }

  get width() {
    return this._width;
  }

  set width(newWidth) {
    this._width = newWidth;
    this.assetsDirty = true; // No layout calculations if the layer isn't currently visible
    this.assetBackground.width = this.assetBackgroundWidth;
  }

  get height() {
    return this._height;
  }

  set height(newHeight) {
    this._height = newHeight;
    this.assetBackground.height =
      this.assetContainerHeight + PaletteSize.AssetPaddingInnerHeight * 2;
  }

  get assetContainerX() {
    return this._x + this.assetPaddingWidth;
  }

  get assetContainerY() {
    return this._y + this.assetPaddingHeight;
  }

  get assetContainerWidth() {
    return (
      this._width -
      this.assetPaddingWidth * 2 -
      PaletteSize.SliderWidth -
      PaletteSize.AssetPaddingInnerWidth
    );
  }

  get assetContainerHeight() {
    return this._height - this.assetPaddingHeight * 2;
  }

  get assetBackgroundWidth() {
    return (
      this.assetContainerWidth +
      PaletteSize.AssetPaddingInnerWidth * 3 +
      PaletteSize.SliderWidth
    );
  }

  get assetPaddingWidth() {
    return (
      PaletteSize.AssetPaddingInnerWidth + PaletteSize.AssetPaddingOuterWidth
    );
  }

  get assetPaddingHeight() {
    return (
      PaletteSize.AssetPaddingInnerHeight + PaletteSize.AssetPaddingOuterHeight
    );
  }

  get sliderX() {
    return (
      this.assetContainerX +
      this.assetContainerWidth +
      PaletteSize.AssetPaddingInnerWidth
    );
  }

  get sliderY() {
    return this.assetContainerY + PaletteSize.AssetPaddingInnerWidth;
  }

  get sliderHeight() {
    return this.assetContainerHeight - PaletteSize.AssetPaddingInnerWidth * 2;
  }
}

class PaletteLayerEntry {
  constructor(layer, sprite, data) {
    this.layer = layer;
    this.sprite = sprite;
    this.data = data;

    this.pointerDown = false;
    this.prevScrollerValue = 0;

    this.sprite.on("pointermove", () => {
      let scrollDelta = Math.abs(
        Math.abs(this.prevScrollerValue) - Math.abs(this.layer.scroller.value)
      );
      if (scrollDelta > 5) {
        this.pointerDown = false;
      }
    });

    this.sprite.on("pointerdown", () => {
      if (this.layer.sliderThumbHovered) {
        return;
      }

      this.pointerDown = true;
      this.prevScrollerValue = this.layer.scroller.value;
    });

    this.sprite.on("pointerup", (pointer) => {
      if (
        this.pointerDown &&
        Phaser.Geom.Rectangle.Contains(
          this.layer.assetBackground,
          pointer.x,
          pointer.y
        )
      ) {
        this.select();
        this.pointerDown = false;
      }
    });
  }

  select() {
    if (this.layer.selectedEntry) {
      this.layer.selectedEntry.unselect();
    }

    this.layer.selectedEntryKey = this.data.frameKey;
    this.sprite.setAlpha(0.6);
  }

  unselect() {
    this.layer.selectedEntryKey = 0;
    this.sprite.setAlpha(1);
  }

  width() {
    return this.data.textureFrame.realWidth;
  }

  height() {
    return this.data.textureFrame.realHeight;
  }
}

export class Palette {
  constructor(scene) {
    this.files = {};
    this.layers = [];
    this.scene = scene;
    this.gfxProcessor = new GfxProcessor(this.scene, "palette");
    this.selectedLayer = 0;
    this.selectedGraphic = 0;

    this.background = scene.add.rectangle(0, 0, 0, 0, PaletteColor.Background);
    this.background.setDepth(0);
    this.background.setInteractive(); // Stop inputs from falling through to lower scenes

    this.header = new PaletteHeader(this);

    this._x = 0;
    this._y = 0;
    this._width = 0;
    this._height = 0;
    this._scaleRatio = 1;

    let tileCursorTexture = this.scene.game.textures.addSpriteSheetFromAtlas(
      "tileCursor",
      {
        atlas: "gui",
        frame: "124",
        frameWidth: 64,
        frameHeight: 32,
      }
    );

    this.scene.game.anims.create({
      key: "tileCursorClick",
      frames: this.scene.game.anims.generateFrameNumbers("tileCursor", {
        start: 0,
        end: 3,
      }),
      frameRate: 60,
      yoyo: true,
    });

    this.scene.game.anims.create({
      key: "masterMapAnimation",
      frames: this.scene.game.anims.generateFrameNumbers("tileCursor", {
        start: 0,
        end: 3,
      }),
      frameRate: 2,
      repeat: -1,
    });

    tileCursorTexture.setFilter(1);
  }

  addLayer(layerName, fileKey, assetBackgroundColor) {
    if (assetBackgroundColor === undefined) {
      assetBackgroundColor = PaletteColor.AssetBackground;
    }
    let layerIndex = this.layers.length;

    let newLayer = new PaletteLayer(
      this,
      this.files[fileKey],
      layerIndex,
      assetBackgroundColor
    );

    this.layers.push(newLayer);
    this.header.addTab(layerName, layerIndex);
  }

  addFile(fileKey) {
    let texture = this.scene.game.textures.get(fileKey);
    let paletteFile = new PaletteFile(fileKey, texture);

    this.files[fileKey] = paletteFile;

    for (let frameKey of texture.getFrameNames()) {
      paletteFile.entries[frameKey] = this.gfxProcessor.processAssetData(
        fileKey,
        frameKey
      );
    }
  }

  getFile(fileKey) {
    return this.files[fileKey];
  }

  selectLayer(layerIndex) {
    if (this.currentLayer) {
      this.currentLayer.hide();
    }

    this.header.tabs[this.selectedLayer].unselect();
    this.header.tabs[layerIndex].select();
    this.selectedLayer = layerIndex;

    if (this.currentLayer) {
      this.currentLayer.show();
    }
  }

  handleScaleChange() {
    for (let layer of this.layers) {
      layer.assetContainer.setScale(this.scaleRatio);
      layer.assetsDirty = true;
      layer.layout();
    }
  }

  get currentLayer() {
    if (this.selectedLayer < this.layers.length) {
      return this.layers[this.selectedLayer];
    }

    return undefined;
  }

  get currentAsset() {
    if (this.currentLayer) {
      return this.currentLayer.selectedEntry;
    }

    return undefined;
  }

  get x() {
    return this._x;
  }

  set x(newX) {
    this._x = newX;
    this.background.x = this.x;
    this.header.x = this.x;

    for (let layerKey in this.layers) {
      this.layers[layerKey].x = this.x;
    }
  }

  get y() {
    return this._y;
  }

  set y(newY) {
    this._y = newY;
    this.background.y = this.y;
    this.header.y = this.y;

    let layerY = this.header.y + this.header.height;

    for (let layerKey in this.layers) {
      this.layers[layerKey].y = layerY;
    }
  }

  get width() {
    return this._width;
  }

  set width(newWidth) {
    if (newWidth === this.width) {
      return;
    }

    this._width = newWidth;
    this.background.width = this.width;
    this.background.setInteractive();
    this.header.width = this.width;

    let layerHeight = this.height - this.header.height;
    let layerY = this.header.y + this.header.height;

    for (let layerKey in this.layers) {
      let layer = this.layers[layerKey];

      layer.width = this.width;
      layer.height = layerHeight;
      layer.y = layerY;
    }
  }

  get height() {
    return this._height;
  }

  set height(newHeight) {
    if (newHeight === this.height) {
      return;
    }

    this._height = newHeight;
    this.background.height = this.height;
    this.background.setInteractive();

    let layerHeight = this.height - this.header.height;
    let layerY = this.header.y + this.header.height;

    for (let layerKey in this.layers) {
      let layer = this.layers[layerKey];

      layer.height = layerHeight;
      layer.y = layerY;
    }
  }

  get scaleRatio() {
    return this._scaleRatio;
  }

  set scaleRatio(newScaleRatio) {
    this._scaleRatio = newScaleRatio;
    this.handleScaleChange();
  }

  get maxLandscapeWidth() {
    return (
      PaletteSize.AssetPaddingInnerWidth * 3 +
      PaletteSize.AssetPaddingOuterWidth * 2 +
      PaletteSize.SliderWidth +
      PaletteSize.AssetContainerMaxLandscapeWidth
    );
  }
}
