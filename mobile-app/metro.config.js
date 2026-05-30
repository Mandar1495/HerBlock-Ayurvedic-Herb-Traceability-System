const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add WASM support for expo-sqlite on the web
config.resolver.assetExts.push('wasm');

module.exports = config;
