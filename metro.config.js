const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Keep essential source extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'js', 'ts', 'tsx', 'jsx'];

// Add necessary Node.js polyfills for websocket functionality
config.resolver.extraNodeModules = {
  https: require.resolve('https-browserify'),
  http: require.resolve('@tradle/react-native-http'),
  stream: require.resolve('stream-browserify'),
  crypto: require.resolve('react-native-crypto'),
  zlib: require.resolve('browserify-zlib'),
  net: path.resolve(__dirname, 'shims/net.js'),
  tls: path.resolve(__dirname, 'shims/tls.js'),
  fs: require.resolve('react-native-level-fs'),
  path: require.resolve('path-browserify'),
  querystring: require.resolve('querystring-es3'),
  process: require.resolve('process/browser')
};

module.exports = config; 