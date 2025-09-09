const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for PWA assets
config.resolver.assetExts.push('html');

// Web-specific configuration
config.web = {
  ...config.web,
  template: './app.html'
};

module.exports = config;
