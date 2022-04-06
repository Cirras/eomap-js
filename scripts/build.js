const webpack = require("webpack");
const webpackCallback = require("./webpack-callback");
const configPreload = require("../webpack/electron/preload");
const configMain = require("../webpack/electron/main");
const configRenderer = require("../webpack/electron/renderer")();
const path = require("path");
const del = require("del");

const compilerPreload = webpack(configPreload);
const compilerMain = webpack(configMain);
const compilerRenderer = webpack(configRenderer);

(async () => {
  await del([path.join(__dirname, "../dist/electron")], { force: true });

  process.exitCode = 1;

  const buildRenderer = () => {
    console.log("> Building renderer");
    compilerRenderer.run(
      webpackCallback(() => {
        console.log("\x1b[32;1m%s\x1b[0m", "\n✓  Success");
        process.exitCode = 0;
      })
    );
  };

  const buildMain = () => {
    console.log("> Building main");
    compilerMain.run(webpackCallback(buildRenderer));
  };

  console.log("> Building preload");
  compilerPreload.run(webpackCallback(buildMain));
})();
