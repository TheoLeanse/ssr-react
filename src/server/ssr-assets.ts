// this slim file allows us to use __non_webpack_require__ to import the webpack manifest
// without it breaking our tests for the ssrAssetManager (as we do not currently run webpack before them)
// TODO: fix tests and consolidate this file and the file for the ssrAssetManager
const manifest = __non_webpack_require__('./../public/manifest.json');
import ssrAssetManager from './ssr-asset-manager';
export default modules => ssrAssetManager({ manifest, modules });
