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

const HeaderType = {
  Core: "BITMAPCOREHEADER",
  Info: "BITMAPINFOHEADER",
  V2: "BITMAPV2INFOHEADER",
  V3: "BITMAPV3INFOHEADER",
  V4: "BITMAPV4HEADER",
  V5: "BITMAPV5HEADER",
};

const Compression = {
  RGB: 0,
  RLE8: 1,
  RLE4: 2,
  BitFields: 3,
  JPEG: 4,
  PNG: 5,
};

class PaletteColor {
  constructor(b, g, r) {
    this.b = b;
    this.g = g;
    this.r = r;
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

    this.headerType = null;
    this.readLineStrategy = null;
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

  readInt32(position) {
    return this.dataView.getInt32(position, true);
  }

  get headerSize() {
    return this.readUint32(0);
  }

  get width() {
    if (this.headerType === HeaderType.Core) {
      return this.readUint16(4);
    } else {
      return this.readInt32(4);
    }
  }

  get height() {
    if (this.headerType === HeaderType.Core) {
      return this.readUint16(6);
    } else {
      return this.readInt32(8);
    }
  }

  get planes() {
    if (this.headerType === HeaderType.Core) {
      return this.readUint16(8);
    } else {
      return this.readUint16(12);
    }
  }

  get depth() {
    if (this.headerType === HeaderType.Core) {
      return this.readUint16(10);
    } else {
      return this.readUint16(14);
    }
  }

  get compression() {
    if (this.headerType === HeaderType.Core) {
      return Compression.RGB;
    } else {
      return this.readUint32(16);
    }
  }

  get colorsUsed() {
    if (this.headerType === HeaderType.Core) {
      return 0;
    } else {
      return this.readUint32(32);
    }
  }

  get optionalBitMasksSize() {
    if (
      this.headerType === HeaderType.Info &&
      this.compression == Compression.BitFields
    ) {
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

  get paletteColorCount() {
    if (this.depth <= 8) {
      return this.colorsUsed || 1 << this.depth;
    }
    return 0;
  }

  get paletteSize() {
    const bytesPerColor = this.headerType === HeaderType.Core ? 3 : 4;
    return this.paletteColorCount * bytesPerColor;
  }

  get stride() {
    return ((this.width * this.depth + 31) & ~31) >> 3;
  }

  get hasBitMasks() {
    switch (this.headerType) {
      case HeaderType.Core:
        return false;
      case HeaderType.Info:
        return this.compression === Compression.BitFields;
      default:
        return true;
    }
  }

  get redMask() {
    if (!this.hasBitMasks) {
      return 0;
    } else {
      return this.readUint32(40);
    }
  }

  get greenMask() {
    if (!this.hasBitMasks) {
      return 0;
    } else {
      return this.readUint32(44);
    }
  }

  get blueMask() {
    if (!this.hasBitMasks) {
      return 0;
    } else {
      return this.readUint32(48);
    }
  }

  get alphaMask() {
    if (!this.hasBitMasks || this.headerType === HeaderType.V2) {
      return 0;
    } else {
      this.readUint32(52);
    }
  }

  colorFromPalette(index) {
    this.initialize();

    if (index >= this.paletteColors.length) {
      return this.colorFromPalette(0);
    }

    return this.paletteColors[index];
  }

  validateHeader() {
    if (
      this.dataView.byteLength < 4 ||
      this.dataView.byteLength < this.headerSize
    ) {
      throw new Error("Truncated header");
    }

    if (!Object.values(HeaderType).includes(this.headerType)) {
      throw new Error(`Unknown header type with size ${this.headerSize}`);
    }

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

    if (this.planes !== 1) {
      throw new Error(`Invalid number of color planes (${this.planes})`);
    }

    switch (this.depth) {
      case 1:
      case 2:
      case 4:
      case 8:
      case 16:
      case 24:
        break;
      case 32:
        if (this.headerType === HeaderType.Core) {
          throw new Error(`32 is an invalid bit depth for ${this.headerType}`);
        }
        break;
      default:
        throw new Error("Unsupported bit depth");
    }

    if (
      this.compression !== Compression.RGB &&
      this.compression !== Compression.BitFields
    ) {
      throw new Error("Unsupported compression");
    }

    if (this.colorsUsed > 1 << this.depth) {
      throw new Error(
        `Palette size ${this.paletteColorCount} exceeds maximum value for ${this.depth}-bit image`
      );
    }
  }

  validateBitFields() {
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

  determineHeaderType() {
    if (this.dataView.byteLength < 4) {
      return;
    }
    switch (this.headerSize) {
      case 12:
        this.headerType = HeaderType.Core;
        break;
      case 40:
        this.headerType = HeaderType.Info;
        break;
      case 52:
        this.headerType = HeaderType.V2;
        break;
      case 56:
        this.headerType = HeaderType.V3;
        break;
      case 108:
        this.headerType = HeaderType.V4;
        break;
      case 124:
        this.headerType = HeaderType.V5;
        break;
    }
  }

  determineReadLineStrategy() {
    switch (this.depth) {
      case 1:
      case 2:
      case 4:
      case 8:
        this.readLineStrategy = new PalettedReadLineStrategy(this);
        break;
      case 16:
      case 24:
      case 32:
        this.readLineStrategy = new DefaultReadLineStrategy(this);
        break;
      default:
        throw Error(`Unhandled bit depth: ${this.depth}`);
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
    let pos = this.headerSize + this.optionalBitMasksSize;

    for (let i = 0; i < this.paletteColors.length; ++i) {
      this.paletteColors[i] = new PaletteColor(
        this.readUint8(pos++),
        this.readUint8(pos++),
        this.readUint8(pos++)
      );

      if (this.headerType !== HeaderType.Core) {
        // rgbReserved is reserved and must be zero
        // See: https://learn.microsoft.com/en-us/windows/win32/api/wingdi/ns-wingdi-rgbquad
        pos++;
      }
    }
  }

  initialize() {
    if (this.initialized) {
      return;
    }

    this.determineHeaderType();
    this.validateHeader();
    this.determineReadLineStrategy();
    this.decodeBitFields();
    this.validateBitFields();
    this.indexPalette();

    this.initialized = true;
  }

  read() {
    this.initialize();

    const rowCount = Math.abs(this.height);
    let imageData = new Uint8ClampedArray(this.width * rowCount * 4);

    for (let row = 0; row < rowCount; ++row) {
      this.readLineStrategy.read(imageData, row);
    }

    return imageData;
  }
}

class ReadLineStrategy {
  constructor(reader) {
    this.reader = reader;
    this.width = this.reader.width;
    this.height = this.reader.height;
  }

  read(outBuffer, row) {
    const isTopDown = this.height < 0;
    const line = isTopDown ? row : this.height - 1 - row;

    const outPos = this.width * row * 4;
    const linePos =
      this.reader.headerSize +
      this.reader.optionalBitMasksSize +
      this.reader.paletteSize +
      this.reader.stride * line;

    this.readLine(outBuffer, outPos, linePos);
  }

  readLine(_outBuffer, _outPos, _linePos) {
    throw new Error("ReadLineStrategy.readLine() must be implemented");
  }

  getAlpha(r, g, b) {
    if (r !== 0 || g !== 0 || b !== 0) {
      return 0xff;
    } else {
      return 0x00;
    }
  }
}

class DefaultReadLineStrategy extends ReadLineStrategy {
  constructor(reader) {
    super(reader);
    this.bytesPerPixel = this.reader.depth >> 3;
  }

  readLine(outBuffer, outPos, linePos) {
    for (let i = 0; i < this.width; ++i) {
      let r = 0;
      let g = 0;
      let b = 0;

      let p = this.readUint32WithZeroPadding(linePos);
      r = this.bitFields.r.read(p);
      g = this.bitFields.g.read(p);
      b = this.bitFields.b.read(p);

      outBuffer[outPos++] = r;
      outBuffer[outPos++] = g;
      outBuffer[outPos++] = b;
      outBuffer[outPos++] = this.getAlpha(r, g, b);

      linePos += this.bytesPerPixel;
    }
  }

  readUint32WithZeroPadding(position) {
    if (position + 4 <= this.reader.dataView.byteLength) {
      return this.reader.readUint32(position);
    }

    let bytes = new Uint8Array([0, 0, 0, 0]);

    for (let i = 0; i < bytes.length; ++i) {
      if (position >= this.reader.dataView.byteLength) {
        break;
      }
      bytes[i] = this.reader.readUint8(position++);
    }

    return new DataView(bytes.buffer).getUint32(0, true);
  }

  get bitFields() {
    return this.reader.bitFields;
  }
}

class PalettedReadLineStrategy extends ReadLineStrategy {
  constructor(reader) {
    super(reader);
    this.pixelsPerByte = 8 / this.reader.depth;
    this.bytesPerLine = Math.ceil(this.width / this.pixelsPerByte);
    this.getPaletteIndices = PalettedReadLineStrategy.createGetPaletteIndices(
      this.reader.depth
    );
  }

  static createGetPaletteIndices(depth) {
    switch (depth) {
      case 1:
        return (byte) => {
          let indices = new Array(8);
          for (let i = 0; i < 8; ++i) {
            indices[7 - i] = (byte & (1 << i)) >> i;
          }
          return indices;
        };
      case 2:
        return (byte) => {
          return [
            (byte & 0xc0) >> 6,
            (byte & 0x30) >> 4,
            (byte & 0x0c) >> 2,
            byte & 0x03,
          ];
        };
      case 4:
        return (byte) => {
          return [(byte & 0xf0) >> 4, byte & 0x0f];
        };
      case 8:
        return (byte) => {
          return [byte];
        };
      default:
        throw Error(`Unhandled bit depth: ${depth}`);
    }
  }

  readLine(outBuffer, outPos, linePos) {
    let written = 0;

    for (let i = 0; i < this.bytesPerLine; ++i) {
      const byte = this.readUint8WithZeroPadding(linePos);
      const paletteIndices = this.getPaletteIndices(byte);

      for (let paletteIndex of paletteIndices) {
        const color = this.reader.colorFromPalette(paletteIndex);
        const { b, g, r } = color;

        outBuffer[outPos++] = r;
        outBuffer[outPos++] = g;
        outBuffer[outPos++] = b;
        outBuffer[outPos++] = this.getAlpha(r, g, b);

        if (++written === this.width) {
          return;
        }
      }

      ++linePos;
    }
  }

  readUint8WithZeroPadding(position) {
    if (position < this.reader.dataView.byteLength) {
      return this.reader.readUint8(position);
    }
    return 0;
  }
}
