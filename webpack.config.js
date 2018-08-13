const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const cssExtractPlugin = require('extract-css-chunks-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const gitRevisionPlugin = new GitRevisionPlugin({
	branch: true
});
const SpritesmithPlugin = require('webpack-spritesmith');
const nodeExternals = require('webpack-node-externals');
const _ = require('lodash');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const ForkTsCheckerNotifierWebpackPlugin = require('fork-ts-checker-notifier-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');
const ManifestPlugin = require('webpack-manifest-plugin');
const hash = require('string-hash');
const { relative } = require('path');

const DEV_MODE = process.env.NODE_ENV !== 'production';

const basePlugins = [
	new webpack.DefinePlugin({
		/* Define variable values to be replaced in generated bundle */
		WEBPACK_GIT_VERSION: JSON.stringify(gitRevisionPlugin.version()),
		WEBPACK_GIT_COMMITHASH: JSON.stringify(gitRevisionPlugin.commithash()),
		WEBPACK_GIT_BRANCH: JSON.stringify(gitRevisionPlugin.branch())
	}),
	new ForkTsCheckerWebpackPlugin({
		/* Check typescript on a different process from webpack compile to speed up compilation */
		workers:
			process.env.NODE_ENV === 'production'
				? 2
				: ForkTsCheckerWebpackPlugin.TWO_CPUS_FREE
	}),
	new ForkTsCheckerNotifierWebpackPlugin({
		/* System notification for typescript compilation */
		title: 'Typescript'
	}),
	new WebpackNotifierPlugin() /* System notifications for webpack build */
];

const baseConfig = {
	resolve: {
		modules: ['node_modules', 'bower_components', 'public'],
		extensions: ['.ts', '.tsx', '.json', '.jsx', '.js', '*'],
		mainFields: ['browser', 'module', 'main'],
		descriptionFiles: ['package.json', 'bower.json'],
		alias: {
			'@assets': path.resolve(__dirname, 'src/assets'),
			'@react': path.resolve(__dirname, 'src/react'),
			'@redux': path.resolve(__dirname, 'src/redux'),
			'@svg': path.resolve(__dirname, 'src/assets/svg'),
			'@ui': path.resolve(__dirname, 'src/react/components/ui'),
			'@actions': path.resolve(__dirname, 'src/redux/actions'),
			'@domain': path.resolve(__dirname, 'src/redux/domain'),
			'@component-styles': path.resolve(__dirname, 'src/scss/components')
		}
	},
	module: {
		rules: [
			{
				test: /\.ts(x?)$/,
				exclude: [/node_modules/],
				use: [
					{
						loader: 'babel-loader?cacheDirectory'
					},
					{
						loader: 'ts-loader',
						options: {
							transpileOnly: !!DEV_MODE
						}
					}
				]
			},
			{
				test: /\.js(x?)$/,
				exclude: [/node_modules/],
				use: [
					{
						loader: 'babel-loader?cacheDirectory'
					}
				]
			},
			{
				test: /\.svg$/,
				include: path.resolve(__dirname, 'src'),
				use: ({ resource }) => [
					{
						loader: 'babel-loader?cacheDirectory'
					},
					{
						loader: 'react-svg-loader',
						options: {
							svgo: {
								plugins: [
									{
										cleanupIDs: {
											prefix: `svg${hash(
												relative(__dirname, resource)
											)}`
										}
									}
								]
							}
						}
					}
				]
			}
		]
	},
	devtool: 'source-map',
	performance: {
		maxAssetSize: 500000, // int (in bytes),
		maxEntrypointSize: 3000000 // int (in bytes)
	}
};

const serverConfig = _.cloneDeep(baseConfig);
_.merge(serverConfig, {
	name: 'server',
	target: 'node',
	externals: [nodeExternals()],
	resolve: {
		mainFiles: ['index', 'module', 'main']
	},
	entry: {
		express: ['babel-polyfill', 'isomorphic-fetch', './src/express/app.ts']
	},
	output: {
		path: path.join(__dirname, '/built'),
		filename: '[name].bundle.js',
		libraryTarget: 'umd'
	},
	plugins: basePlugins.concat([
		new CleanWebpackPlugin([
			/* Empty output directories before new bundles generated */
			'built/*.*'
		]),
		new webpack.IgnorePlugin(/manifest\.json$/),
		new webpack.DefinePlugin({
			WEBPACK_CONFIG_IS_NODE: true
		}),
		new webpack.BannerPlugin({
			banner: "require('source-map-support').install();",
			raw: true,
			entryOnly: false
		})
	]),
	module: {
		rules: baseConfig.module.rules.concat([
			{
				test: /\.scss$/,
				use: 'null-loader' // why do we use null-loader here? we're using the manifest to add stylesheet links to the html but they still need to be compiled from sass
			},
			{
				test: /\.png$/,
				loaders: 'null-loader'
			}
		])
	}
});

const clientConfig = _.cloneDeep(baseConfig);
_.merge(clientConfig, {
	name: 'client',
	resolve: {
		alias: {
			querystring: 'querystring-browser',

			// dedupes
			lodash: path.resolve(__dirname, 'node_modules/lodash'),
			qs: path.resolve(__dirname, 'node_modules/qs'),
			'core-js': path.resolve(__dirname, 'node_modules/core-js')
		},
		extensions: [].concat(baseConfig.resolve.extensions, ['.scss']),
		mainFiles: ['browser', 'index', 'module', 'main']
	},
	entry: {
		vendor: [
			'babel-polyfill',
			'lodash',
			'react',
			'react-dom',
			'redux',
			'react-redux',
			'react-router',
			'react-router-redux',
			'immutable'
		],
		main: ['core-js', 'aws-sdk/global', './src/react/client-mount.tsx']
	},
	output: {
		path: path.join(__dirname, '/public'),
		filename: DEV_MODE
			? '[name].bundle.js'
			: '[name].[chunkhash].bundle.js',
		publicPath: '/static/'
	},
	optimization: {
		splitChunks: {
			cacheGroups: {
				vendor: {
					chunks: 'all',
					name: 'vendor',
					test: 'vendor',
					enforce: true
				}
			}
		},
		runtimeChunk: true
	},
	plugins: basePlugins.concat([
		new CleanWebpackPlugin([
			/* Empty output directories before new bundles generated */
			'public/*.*'
		]),
		new CopyWebpackPlugin([
			{
				from: path.resolve(
					__dirname,
					'src/lib/js-lib/modernizr-custom.js'
				),
				to: DEV_MODE
					? 'modernizr.js'
					: 'modernizr.[md5:hash:hex:20].js',
				toType: 'template'
			},
			{
				from: path.resolve(__dirname, 'src/css/express-errors.css'),
				to: DEV_MODE
					? 'express-errors.css'
					: 'express-errors.[md5:hash:hex:20].css',
				toType: 'template'
			}
		]),
		new ManifestPlugin({
			// Generate manifest file with mapping from file name to hashed generated file location
			map: file => {
				file.name = file.name.replace(/\.[a-f0-9]{20}\./, '.');
				return file;
			}
		}),
		new webpack.DefinePlugin({
			WEBPACK_CONFIG_IS_NODE: false
		}),
		new webpack.IgnorePlugin(/vertx/),
		new cssExtractPlugin({
			filename: DEV_MODE ? '[name].css' : '[name].[contenthash].css',
			chunkFilename: DEV_MODE ? '[name].css' : '[name].[contenthash].css'
		}),
		new SpritesmithPlugin({
			src: {
				cwd: path.resolve(__dirname, 'src/assets/img'),
				glob: '**/*.png'
			},
			target: {
				image: path.resolve(__dirname, 'public/sprite.png'),
				css: [
					[
						path.resolve(
							__dirname,
							'src/scss/spritesmith-generated/sprite.scss'
						),
						{
							format: 'template'
						}
					]
				]
			},
			apiOptions: {
				cssImageRef: '~sprite.png'
			},
			retina: '@2x',
			customTemplates: {
				template: path.resolve(
					__dirname,
					'src/scss/spritesmith-template.handlebars.scss'
				),
				template_retina: path.resolve(
					__dirname,
					'src/scss/spritesmith-template.handlebars.scss'
				)
			}
		})
	]),
	node: {
		fs: 'empty' //https://github.com/webpack-contrib/css-loader/issues/447
	},
	module: {
		rules: baseConfig.module.rules.concat([
			{
				test: /\.scss$/,
				use: [
					cssExtractPlugin.loader,
					{
						loader: 'css-loader'
					},
					{
						loader: 'postcss-loader'
					},
					{
						loader: 'sass-loader',
						options: {
							includePaths: [
								path.resolve(__dirname, 'bower_components')
							]
						}
					}
				]
			},
			{
				test: /\.png$/,
				loaders: [
					DEV_MODE
						? 'file-loader?name=i/[name].[ext]'
						: 'file-loader?name=i/[name].[md5:hash:hex:20].[ext]'
				]
			}
		]),
		noParse: [
			/lodash\.js$/,
			/immutable\.js$/,
			/core-js\.js$/,
			/babel-polyfill\.js$/
		]
	}
});

module.exports = [clientConfig, serverConfig];
