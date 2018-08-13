import ssrAssets from '../ssr-assets';

// React
import React from 'react';
import ReactDOMServer from 'react-dom/server';

// React Router
import { StaticRouter } from 'react-router';
import { matchPath } from 'react-router-dom';

// Redux
import { createStore, applyMiddleware } from 'redux';
import { combineReducers } from 'redux-immutable';
import Immutable from 'immutable';
import { Provider } from 'react-redux';
import thunkMiddleware from 'redux-thunk';
import reducers from '../../shared/redux/reducers/';

import { Helmet } from 'react-helmet';

// React-Loadable
// https://github.com/jamiebuilds/react-loadable#picking-up-a-server-side-rendered-app-on-the-client
import Loadable from 'react-loadable';

import App from '../../shared/components/App';

export default function indexRoute(req, res, next) {
	const store = createStore(
		combineReducers(reducers),
		Immutable.fromJS({
			User: {
				// user_id: req.user.user_id,
				// name: req.user.name,
				// email: req.user.email,
				// id_token: req.user.id_token,
				// image: req.user.image,
				// created_at: req.user.created_at,
				// clientID: req.user.clientID,
				// metadata: req.user.user_metadata,
				// app_metadata: req.user.app_metadata,
				// logins: {
				// 	[process.env.AUTH0_DOMAIN]: req.user.id_token
				// },
				// isImpersonated: req.user.isImpersonated,
				// impersonator_id: req.user.impersonator_id
			}
			// System: {
			// 	baseUrl: path.join(API_PREFIX, API_VERSION),

			// 	// Companies
			// 	esHost: getEsEnvVariable('ES_DOMAIN_ENDPOINT'),
			// 	esIndex: ES_COMPANY_INDEX, // Code config for easier deploys, see ckimrie

			// 	// News
			// 	esHostNews: getEsEnvVariable('ES_NEWS_DOMAIN_ENDPOINT_EU'),
			// 	esIndexNews: getEsEnvVariable('ES_NEWS_INDEX'),

			// 	// Business Lines
			// 	esHostNaics: getEsEnvVariable('ES_NAICS_DOMAIN_ENDPOINT'),
			// 	esIndexNaics: process.env.ES_NAICS_INDEX,

			// 	identityPoolId: process.env.AWS_IDENTITY_POOL_ID,
			// 	region: process.env.AWS_REGION,
			// 	showBeta: req.query.beta && parseInt(req.query.beta, 10) === 1,
			// 	isTest: isTest(),
			// 	isProd: process.env.NODE_ENV === 'production'
			// }
		}),
		applyMiddleware(thunkMiddleware)
	);

	const { dispatch, getState } = store;

	const promises = [];

	// Ensure all dynamically loaded webpack bundles are present
	// ( https://github.com/jamiebuilds/react-loadable#preloading-all-your-loadable-components-on-the-server )
	promises.push(Loadable.preloadAll());

	Promise.all(promises)
		.then(() => {
			const modules = [];

			// Using redux store, render react application to HTML string
			const reactOutput = ReactDOMServer.renderToString(
				<Loadable.Capture
					report={moduleName => modules.push(moduleName)}
				>
					<Provider store={store}>
						<StaticRouter location={req.url} context={{}}>
							<App />
						</StaticRouter>
					</Provider>
				</Loadable.Capture>
			);

			res.render('react-mount', {
				reactOutput,
				clientData: getState(), // Get current state of the redux store
				title: Helmet.rewind().title.toString(),
				assets: ssrAssets(modules)
			});
		})
		.catch(next);
}
