const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure that all platforms can use the same JS bundle
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add support for .env files
config.resolver.sourceExts = [...config.resolver.sourceExts, 'env'];

// Fix for SHA-1 computation issues with virtual files
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add proper handling for virtual files
config.resolver.unstable_enableSymlinks = false;

// Ensure proper file watching
config.watchFolders = [__dirname];

// Add resolver configuration to handle virtual files better
config.resolver.alias = {
	...config.resolver.alias,
	stream: 'stream-browserify',
	streams: 'stream-browserify',
	util: 'util',
	buffer: 'buffer',
	process: 'process/browser',
};

module.exports = config;
