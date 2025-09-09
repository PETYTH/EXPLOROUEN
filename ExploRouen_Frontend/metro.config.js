const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// --- Support SVG ---
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...config.resolver.sourceExts, "svg", "js", "jsx", "ts", "tsx"],
};

// --- Add support for PWA assets ---
config.resolver.assetExts.push("html");

// --- Web-specific configuration ---
config.web = {
  ...config.web,
  template: "./app.html",
};

module.exports = config;
