import React from 'react';
import Loadable from 'react-loadable';

const LoadableHome = Loadable({
	loader: () => import('./Home'),
	loading: () => <h1>Don't wanna see this... or do you?</h1>
});

export default LoadableHome;
