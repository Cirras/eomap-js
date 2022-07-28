# eomap-js

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Cirras_eomap-js&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Cirras_eomap-js)
![Format Status](https://github.com/cirras/eomap-js/actions/workflows/format.yml/badge.svg?event=push)
![Build Status](https://github.com/cirras/eomap-js/actions/workflows/build.yml/badge.svg?event=push)

An Endless Map File (EMF) editor written in JavaScript.

## Requirements

[Node.js](https://nodejs.org) is required to install dependencies and run scripts via `npm`.

## Available Commands

| Command                  | Description                                     |
| ------------------------ | ----------------------------------------------- |
| `npm install`            | Install project dependencies                    |
| `npm start`              | Build electron and open application             |
| `npm run start:web`      | Build web and open web server running project   |
| `npm run start:electron` | Build electron and open application             |
| `npm run dist`           | Build web and electron with production settings |
| `npm run dist:web`       | Build web with production settings              |
| `npm run dist:electron`  | Build electron with production settings         |
| `npm run format`         | Format changed files using Prettier             |

## Writing Code

After cloning the repo, run `npm install` from your project directory. Then, you can start the application by running `npm start`.

After starting the application with `npm start`, webpack will automatically recompile and reload the application when source files change.

## Deploying to Web

After you run the `npm run dist:web` command, the project will be built into `dist/web`.

If you put the contents of the `dist/web` folder in a publicly-accessible location (say something like `https://example.com`), you should be able to open `https://example.com/index.html` and use the application.

Configure your web server to use [ETags](https://en.wikipedia.org/wiki/HTTP_ETag) for cache validation.

## Connected Mode

In the application settings, you will find a section called `Connected Mode`.
When Connected Mode is enabled, graphics will be loaded from the remote Mapper Service specified by the `Mapper Service URL` setting.

### Hosting a Mapper Service

Currently, the steps for creating your own Mapper Service are:

- Set up a web server
- Configure your web server to use [ETags](https://en.wikipedia.org/wiki/HTTP_ETag) for cache validation.
- Configure your web server for CORS
  - Return the response header `Access-Control-Allow-Origin: *`
  - See: [Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
  - See: [Access-Control-Allow-Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin)
- Serve EGF files from `/gfx`
- Serve Mapper Assets from `/assets`
  - Copy the bundled assets out from `src/assets/bundled`

### Forced Connected Mode

If you're hosting an instance of eomap-js and want to lock it to a particular remote Mapper Service, then you can use the `FORCE_CONNECTED_MODE_URL` environment variable.

When `FORCE_CONNECTED_MODE_URL` is defined, Connected Mode will be forcibly enabled and the `Mapper Service URL` will be locked to the specified URL.

Usage examples:

- `npm run start:web -- --env FORCE_CONNECTED_MODE_URL="https://example.com"`
- `npm run dist:web -- --env FORCE_CONNECTED_MODE_URL="https://example.com"`
