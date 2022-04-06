const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const mode = process.env.NODE_ENV || "development";
const dev = mode === "development";

module.exports = (env) => {
  return {
    mode,
    devtool: dev ? "cheap-module-source-map" : "source-map",
    performance: {
      maxEntrypointSize: 3145728,
      maxAssetSize: 3145728,
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },
        {
          test: /\.(gif|png|jpe?g|svg|xml)$/i,
          type: "asset/inline",
        },
        {
          test: /\.html$/i,
          loader: "html-loader",
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        CANVAS_RENDERER: JSON.stringify(true),
        WEBGL_RENDERER: JSON.stringify(true),
        FORCE_CONNECTED_MODE_URL: JSON.stringify(
          (env && env.FORCE_CONNECTED_MODE_URL) || ""
        ),
        NPM_VERSION: JSON.stringify(require("../package.json").version),
      }),
      new HtmlWebpackPlugin({
        template: "./index.html",
      }),
      new MiniCssExtractPlugin(),
    ],
  };
};
