const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = (env) => {
  return {
    mode: "development",
    devtool: "eval-source-map",
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: "babel-loader",
        },
        {
          test: /\.worker\.js$/i,
          exclude: /node_modules/,
          use: [{ loader: "worker-loader" }, { loader: "babel-loader" }],
        },
        {
          test: /\.css$/i,
          use: [MiniCssExtractPlugin.loader, "css-loader"],
        },
        {
          test: /\.(gif|png|jpe?g|svg|xml)$/i,
          use: "url-loader",
        },
        {
          test: /\.html$/i,
          loader: "html-loader",
          options: {
            attributes: {
              list: [
                "...",
                {
                  tag: "link",
                  attribute: "href",
                  type: "src",
                },
              ],
            },
          },
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
      }),
      new HtmlWebpackPlugin({
        template: "./index.html",
      }),
      new MiniCssExtractPlugin(),
    ],
  };
};
