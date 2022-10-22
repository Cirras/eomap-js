# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.5] - 2022-10-22

### Added

- Support for bitmaps with `BI_RLE4` compression.
- Support for bitmaps with `BI_RLE8` compression.
- Support for bitmaps with `BI_ALPHABITFIELDS` compression.
- Support for bitmaps with unusually-sized bitfield masks.
- Support for bitmaps with non-paletted pixel data and superfluous color tables.

## [1.0.4] - 2022-10-15

### Fixed

- Fix issue where unusually-large Top tiles were drawn at the incorrect position.

## [1.0.3] - 2022-09-19

### Added

- Support for obscure Windows 2.x `BITMAPCOREHEADER` bitmaps.
- Support for 1-bit, 2-bit, and 4-bit bitmaps.

### Changed

- More robust validation in the bitmap decoder.

### Fixed

- Fix issue where Down Walls were rendered below Overlays on the same tile.
- Fix issue where `BITMAPINFOHEADER` dimensions were erroneously read as unsigned integers.

## [1.0.2] - 2022-08-25

### Added

- Support for jumbo-sized (larger than 1024x1024) resources.

### Fixed

- Exit menu item. (Windows)
- Prevent the texture cache from breaking when an asset can't fit into an empty cache page.
- Prevent an error triggered by creating a new map while GFX is loading.

## [1.0.1] - 2022-08-21

### Added

- Menu item to clear recent files.
- Menu item to show release notes.
- Menu item to close window. (Linux)
- Menu item to quit application. (Linux)

### Fixed

- Allow menu items to be triggered by repeating keyboard events.
- Prevent cursor flickering when resizing the palette.

## [1.0.0] - 2022-08-08

### Added

- Desktop app for Windows, Linux, and macOS.
- Web app available at [https://eomap.dev](https://eomap.dev)

[unreleased]: https://github.com/cirras/eomap-js/compare/v1.0.5...HEAD
[1.0.5]: https://github.com/cirras/eomap-js/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/cirras/eomap-js/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/cirras/eomap-js/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/cirras/eomap-js/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/cirras/eomap-js/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/cirras/eomap-js/releases/tag/v1.0.0
