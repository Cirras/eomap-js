const NUM_CONVERT_TABLES = 8;
const CONVERT_TABLES = (function () {
  let tables = new Array(NUM_CONVERT_TABLES);
  for (let i = 0; i < NUM_CONVERT_TABLES; ++i) {
    let entries = 1 << (i + 1);
    let table = new Array(entries);
    for (let ii = 0; ii < entries; ++ii) {
      table[ii] = Math.trunc((ii * 255) / (entries - 1));
    }
    tables[i] = table;
  }
  return tables;
})();

const Compression = {
  RGB: 0,
  RLE8: 1,
  RLE4: 2,
  BitFields: 3,
  JPEG: 4,
  PNG: 5,
};

class RGBQuad {
  constructor(b, g, r, quad) {
    this.b = b;
    this.g = g;
    this.r = r;
    this.quad = quad;
  }
}

function trailingZeros(n) {
  n |= 0;
  return n ? 31 - Math.clz32(n & -n) : 0;
}

class BitField {
  constructor(mask) {
    if (mask === 0) {
      this.shift = 0;
      this.mask = 0;
      this.length = 0;
    }

    this.shift = trailingZeros(mask);
    this.mask = mask >> this.shift;
    this.length = trailingZeros(~this.mask);
  }

  read(data) {
    data = (data >> this.shift) & this.mask;
    return CONVERT_TABLES[this.length - 1][data];
  }
}

class BitFields {
  constructor(redMask, greenMask, blueMask, alphaMask) {
    this.r = new BitField(redMask);
    this.g = new BitField(greenMask);
    this.b = new BitField(blueMask);
    this.a = new BitField(alphaMask);
  }
}

export class DIBReader {
  constructor(buffer) {
    this.data = buffer;
    this.dataView = new DataView(buffer);

    this.bitFields = null;
    this.paletteColors = null;

    this.initialized = false;
  }

  readUint8(position) {
    return this.dataView.getUint8(position);
  }

  readUint16(position) {
    return this.dataView.getUint16(position, true);
  }

  readUint32(position) {
    return this.dataView.getUint32(position, true);
  }

  readUInt32WithZeroPadding(position) {
    if (position + 4 < this.dataView.byteLength) {
      return this.dataView.getUint32(position, true);
    }

    let bytes = new Uint8Array([0, 0, 0, 0]);

    for (let i = 0; i < bytes.length; ++i) {
      if (position >= this.dataView.byteLength) {
        break;
      }
      bytes[i] = this.readUint8(position++);
    }

    return new DataView(bytes.buffer).getUint32(0, true);
  }

  get headerSize() {
    return this.readUint32(0);
  }

  get width() {
    return this.readUint32(4);
  }

  get height() {
    return this.readUint32(8);
  }

  get colorPlanes() {
    return 1;
  }

  get depth() {
    return this.readUint16(14);
  }

  get compression() {
    return this.readUint32(16);
  }

  get imageSize() {
    return this.readUint32(20);
  }

  get paletteColorCount() {
    if (this.depth < 16) {
      let colorsUsed = this.readUint32(32);
      let numColors = colorsUsed;
      if (numColors === 0) {
        numColors = 1 << this.depth;
      }
      return numColors;
    }

    return 0;
  }

  get paletteSize() {
    let numColors = this.paletteColorCount;

    if (numColors > 0) {
      return numColors * 4;
    }

    if (this.headerSize === 40 && this.compression == Compression.BitFields) {
      // The Windows NT variant of the Windows 3.x BMP format can store 16-bit and 32-bit
      // data in a BMP file.
      // If the bitmap contains 16 or 32 bits per pixel, then only BitFields Compression is
      // supported and the redMask, greenMask, and blueMask fields will be present following
      // the header in place of a color palette.
      // Otherwise, the file is identical to a Windows 3.x BMP file.
      // See: https://www.fileformat.info/format/bmp/egff.htm
      return 12;
    }

    return 0;
  }

  get bpp() {
    return this.depth >> 3;
  }

  get stride() {
    return ((this.width * this.depth + 31) & ~31) >> 3;
  }

  get redMask() {
    return this.readUint32(40);
  }

  get greenMask() {
    return this.readUint32(44);
  }

  get blueMask() {
    return this.readUint32(48);
  }

  get alphaMask() {
    return this.headerSize >= 56 ? this.readUint32(52) : 0;
  }

  colorFromPalette(index) {
    this.initialize();

    if (index >= this.paletteColors.length) {
      return this.colorFromPalette(0);
    }

    return this.paletteColors[index];
  }

  checkFormat() {
    if (this.width < 0) {
      throw new Error("Image width less than zero");
    }

    if (
      this.width > 0x40000000 ||
      this.height < -0x40000000 ||
      this.height > 0x40000000
    ) {
      throw new Error("Image dimensions out of bounds");
    }

    if (
      this.depth !== 8 &&
      this.depth !== 16 &&
      this.depth !== 24 &&
      this.depth !== 32
    ) {
      throw new Error("Unsupported bit depth");
    }

    if (
      this.compression !== Compression.RGB &&
      this.compression !== Compression.BitFields
    ) {
      throw new Error("Unsupported compression");
    }

    if (this.bitFields) {
      let maxmask = (1 << NUM_CONVERT_TABLES) - 1;
      if (
        this.bitFields.r.mask > maxmask ||
        this.bitFields.g.mask > maxmask ||
        this.bitFields.b.mask > maxmask ||
        this.bitFields.a.mask > maxmask
      ) {
        throw new Error("Bit mask too long");
      }
    }
  }

  decodeBitFields() {
    if (this.compression === Compression.BitFields) {
      this.bitFields = new BitFields(
        this.redMask,
        this.greenMask,
        this.blueMask,
        this.alphaMask
      );
    } else {
      switch (this.depth) {
        case 16:
          this.bitFields = new BitFields(
            0x00007c00,
            0x000003e0,
            0x0000001f,
            0x00000000
          );
          break;

        case 24:
        case 32:
          this.bitFields = new BitFields(
            0x00ff0000,
            0x0000ff00,
            0x000000ff,
            0x00000000
          );
          break;
      }
    }
  }

  indexPalette() {
    if (this.compression === Compression.BitFields) {
      return;
    }

    this.paletteColors = new Array(this.paletteColorCount);
    let pos = this.headerSize;

    for (let i = 0; i < this.paletteColors.length; ++i) {
      this.paletteColors[i] = new RGBQuad(
        this.readUint8(pos++),
        this.readUint8(pos++),
        this.readUint8(pos++),
        this.readUint8(pos++)
      );
    }
  }

  initialize() {
    if (this.initialized) {
      return;
    }

    this.decodeBitFields();
    this.indexPalette();
    this.checkFormat();

    this.initialized = true;
  }

  readLine(outBuf, row) {
    const isBottomUp = this.height < 0;
    let line = isBottomUp ? row : this.height - 1 - row;
    let pos = this.headerSize + this.paletteSize + this.stride * line;
    let outPos = this.width * row * 4;

    for (let i = 0; i < this.width; ++i) {
      let b = 0;
      let g = 0;
      let r = 0;
      let a = 0;

      switch (this.depth) {
        case 8:
          let paletteIndex = this.readUint8(pos);
          let color = this.colorFromPalette(paletteIndex);
          b = color.b;
          g = color.g;
          r = color.r;
          break;

        case 16:
        case 24:
        case 32:
          let p = this.readUInt32WithZeroPadding(pos);
          r = this.bitFields.r.read(p);
          g = this.bitFields.g.read(p);
          b = this.bitFields.b.read(p);
          break;

        default:
          throw Error(`Unhandled bit depth: ${this.depth}`);
      }

      if (r !== 0 || g !== 0 || b !== 0) {
        a = 0xff;
      }

      outBuf[outPos++] = r;
      outBuf[outPos++] = g;
      outBuf[outPos++] = b;
      outBuf[outPos++] = a;

      pos += this.bpp;
    }
  }

  read() {
    this.initialize();

    const rowCount = Math.abs(this.height);
    let imageData = new Uint8ClampedArray(this.width * rowCount * 4);

    for (let row = 0; row < rowCount; ++row) {
      this.readLine(imageData, row);
    }

    return imageData;
  }
}
