import log from '../shared/lib/logger';
import React from 'react';
import ReactDOM from 'react-dom';
import Loadable from 'react-loadable';
import createHistory from 'history/createBrowserHistory';
import App from '../shared/components/App';
const browserHistory = createHistory();
import { fromJS } from 'immutable';

// Redux
import { createStore, applyMiddleware } from 'redux';
import { combineReducers } from 'redux-immutable';
import { composeWithDevTools } from 'redux-devtools-extension';
import { Provider } from 'react-redux';
import {
	ConnectedRouter,
	routerMiddleware as createRouterMiddleware
} from 'react-router-redux';
import thunkMiddleware from 'redux-thunk';

import reducers from '../shared/redux/reducers/';

const preloadedState = fromJS(
	JSON.parse(document.getElementById('react-client-data').innerText)
);

const routerMiddleware = createRouterMiddleware(browserHistory);

let appliedMiddlewares;
const middlewares = [thunkMiddleware, routerMiddleware];

const isProd = () =>
	(!!process.env.NODE_ENV && process.env.NODE_ENV === 'production') ||
	preloadedState.System.isProd;

if (!isProd()) {
	const { createLogger } = require('redux-logger');

	const loggerMiddleware = createLogger({
		stateTransformer: state => state.toJS()
	});

	middlewares.push(loggerMiddleware);
	appliedMiddlewares = composeWithDevTools(applyMiddleware(...middlewares));
} else {
	appliedMiddlewares = applyMiddleware(...middlewares);
}

const store = createStore(
	combineReducers(reducers),
	preloadedState,
	appliedMiddlewares
);

Loadable.preloadReady().then(() => {
	log('ya boo sux');
	// Render the app via react-router with redux store attached
	ReactDOM.hydrate(
		<Provider store={store}>
			<ConnectedRouter history={browserHistory}>
				<App />
			</ConnectedRouter>
		</Provider>,
		document.getElementById('react-mount')
	);
});
