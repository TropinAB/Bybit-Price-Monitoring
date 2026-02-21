const webpack = require("webpack");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const NODE_ENV = process.env.NODE_ENV || "production";
const PREFIX = NODE_ENV === "production" ? "/Weather-React/" : "/";

module.exports = {
  entry: "./src/index.tsx",
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  output: {
    publicPath: PREFIX,
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "public"),
    },
    port: 9000,
    historyApiFallback: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      publicPath: PREFIX,
      template: './public/index.html',
    }),
    new HtmlWebpackPlugin({
      filename: "404.html",
      publicPath: PREFIX,
      template: './public/index.html',
    }),
    new webpack.DefinePlugin({
      PRODUCTION: NODE_ENV === "production",
      NODE_ENV: JSON.stringify(NODE_ENV),
      PREFIX: JSON.stringify(PREFIX),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
};
