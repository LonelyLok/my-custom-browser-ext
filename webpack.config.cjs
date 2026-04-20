const fs = require("node:fs");
const path = require("node:path");
const webpack = require("webpack");

class ExtensionAssetsPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap("ExtensionAssetsPlugin", (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: "ExtensionAssetsPlugin",
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          const manifestPath = path.resolve(__dirname, "public", "manifest.json");
          const popupHtmlPath = path.resolve(__dirname, "public", "popup.html");

          compilation.emitAsset(
            "manifest.json",
            new webpack.sources.RawSource(fs.readFileSync(manifestPath, "utf8")),
          );
          compilation.emitAsset(
            "popup.html",
            new webpack.sources.RawSource(fs.readFileSync(popupHtmlPath, "utf8")),
          );
        },
      );
    });
  }
}

module.exports = {
  mode: "development",
  devtool: "source-map",
  entry: {
    background: path.resolve(__dirname, "src", "background", "index.ts"),
    content: path.resolve(__dirname, "src", "content", "index.ts"),
    "route-hook": path.resolve(__dirname, "src", "injected", "route-hook.ts"),
    popup: path.resolve(__dirname, "src", "popup", "index.tsx"),
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    assetModuleFilename: "assets/[name][ext]",
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: "tsconfig.build.json",
          },
        },
      },
      {
        test: /\.(png|svg)$/i,
        type: "asset/resource",
      },
    ],
  },
  plugins: [new ExtensionAssetsPlugin()],
};
