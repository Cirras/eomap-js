# eomap-js

An Endless Map File (EMF) editor written in JavaScript.

## Requirements

[Node.js](https://nodejs.org) is required to install dependencies and run scripts via `npm`.

## Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install project dependencies |
| `npm start` | Build project and open web server running project |
| `npm run build` | Builds code bundle with production settings (minification, uglification, etc..) |

## Writing Code

After cloning the repo, run `npm install` from your project directory. Then, you can start the local development server by running `npm start`.

After starting the development server with `npm start`, you can edit any files in the `src` folder and webpack will automatically recompile and reload your server (available at `http://localhost:8080` by default).

## Deploying Code

After you run the `npm run build` command, the project will be built into a single bundle located at `dist/bundle.min.js` along with assets that the application depends on.

If you put the contents of the `dist` folder in a publicly-accessible location (say something like `http://foo-bar.com`), you should be able to open `http://foo-bar.com/index.html` and use the application.
