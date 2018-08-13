const getBundles = ({ modules, manifest, extension }) =>
	modules
		.map(moduleName => moduleName.replace(/^.\//, ''))
		.reduce((result, moduleName) => {
			const rx = new RegExp(`${moduleName}(.*)${extension}$`);
			return result.concat(
				Object.keys(manifest)
					.filter(key => rx.test(key))
					.map(key => manifest[key])
			);
		}, []);

export default function ssrAssetManager({ modules, manifest }) {
	const js = getBundles({ extension: '.js', modules, manifest }).concat(
		// js bundles to include in every SSR page
		manifest['runtime~main.js'],
		manifest['vendor.js'],
		manifest['main.js']
	);

	const css = getBundles({ extension: '.css', modules, manifest }); // this will be duplicated, but we need the styles at laod for the chrome and the loaders

	// a map of a bundle/page name to the publicPath for its css
	// used by the importCss function of the babel-dual-imports library
	const cssChunkMap = Object.keys(manifest).reduce((result, key) => {
		if (/.css$/.test(key)) {
			result[key.replace(/.css$/, '')] = manifest[key];
		}
		return result;
	}, {});

	return {
		css,
		js,
		cssChunkMap,
		modernizr: manifest['modernizr.js']
	};
}
