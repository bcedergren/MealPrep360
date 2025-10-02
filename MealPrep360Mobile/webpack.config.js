const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const webpack = require('webpack');
const path = require('path');

module.exports = async function (env, argv) {
	const config = await createExpoWebpackConfigAsync(env, argv);

	// Configure Node.js polyfills for browser (monorepo setup)
	config.resolve.fallback = {
		...config.resolve.fallback,
		stream: path.resolve(__dirname, '../node_modules/stream-browserify'),
		util: path.resolve(__dirname, '../node_modules/util'),
		buffer: path.resolve(__dirname, '../node_modules/buffer'),
		process: path.resolve(__dirname, '../node_modules/process/browser'),
		crypto: false,
		fs: false,
		path: false,
		os: false,
	};

	// Configure webpack plugins
	config.plugins.push(
		new webpack.DefinePlugin({
			'process.env.EXPO_ROUTER_APP_ROOT': JSON.stringify(
				path.resolve(__dirname, 'app')
			),
			__DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
			'process.env.NODE_ENV': JSON.stringify(
				process.env.NODE_ENV || 'development'
			),
		}),
		new webpack.ProvidePlugin({
			process: 'process/browser',
			Buffer: ['buffer', 'Buffer'],
		})
	);

	// Configure module resolution aliases
	config.resolve.alias = {
		...config.resolve.alias,
		'@app': path.resolve(__dirname, 'app'),
		'react-native$': 'react-native-web',
		// Add explicit aliases for react-native-web exports (monorepo setup)
		'react-native-web/dist/exports/View': path.resolve(
			__dirname,
			'../node_modules/react-native-web/dist/exports/View'
		),
		'react-native-web/dist/exports/StyleSheet': path.resolve(
			__dirname,
			'../node_modules/react-native-web/dist/exports/StyleSheet'
		),
		'react-native-web/dist/exports/Dimensions': path.resolve(
			__dirname,
			'../node_modules/react-native-web/dist/exports/Dimensions'
		),
		'react-native-web/dist/exports/Text': path.resolve(
			__dirname,
			'../node_modules/react-native-web/dist/exports/Text'
		),
		'react-native-web/dist/exports/Image': path.resolve(
			__dirname,
			'../node_modules/react-native-web/dist/exports/Image'
		),
		'react-native-web/dist/exports/TouchableOpacity': path.resolve(
			__dirname,
			'../node_modules/react-native-web/dist/exports/TouchableOpacity'
		),
		'react-native-web/dist/exports/ScrollView': path.resolve(
			__dirname,
			'../node_modules/react-native-web/dist/exports/ScrollView'
		),
		'react-native-web/dist/exports/Pressable': path.resolve(
			__dirname,
			'../node_modules/react-native-web/dist/exports/Pressable'
		),
		// Fix nanoid ES modules import issue
		nanoid: path.resolve(__dirname, '../node_modules/nanoid/index.js'),
		'nanoid/non-secure': path.resolve(
			__dirname,
			'../node_modules/nanoid/non-secure/index.js'
		),
		'nanoid/async': path.resolve(
			__dirname,
			'../node_modules/nanoid/async/index.js'
		),
		'nanoid/url-alphabet': path.resolve(
			__dirname,
			'../node_modules/nanoid/url-alphabet/index.js'
		),
	};

	// Configure module resolution extensions
	config.resolve.extensions = [
		'.web.tsx',
		'.web.ts',
		'.web.jsx',
		'.web.js',
		'.tsx',
		'.ts',
		'.jsx',
		'.js',
		'.json',
		...config.resolve.extensions,
	];

	// Configure ignore warnings to suppress known issues
	config.ignoreWarnings = [
		{
			module: /LogBox\.web\.ts$/,
			message: /export .* was not found in/,
		},
		{
			module: /react\/cjs\/react\.development\.js$/,
			message: /Cannot read properties of undefined/,
		},
		{
			module: /process\/browser/,
			message: /Cannot resolve/,
		},
		{
			module: /react-native-web/,
			message: /Cannot resolve/,
		},
	];

	// Configure module resolution for better compatibility
	config.resolve.mainFields = ['browser', 'module', 'main'];
	config.resolve.conditionNames = ['browser', 'import', 'require', 'default'];

	// Add parent directory's node_modules to resolve modules (monorepo setup)
	config.resolve.modules = [
		path.resolve(__dirname, 'node_modules'),
		path.resolve(__dirname, '../node_modules'),
		'node_modules',
	];

	// Ensure proper module resolution for Node.js polyfills
	config.module.rules.push({
		test: /\.m?js$/,
		resolve: {
			fullySpecified: false,
		},
	});

	// Add webpack plugin to handle nanoid ES module import issue
	config.plugins.push(
		new webpack.NormalModuleReplacementPlugin(
			/^nanoid$/,
			path.resolve(__dirname, '../node_modules/nanoid/index.browser.cjs')
		)
	);

	return config;
};
