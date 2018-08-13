import React from 'react';

const Layout = ({ children }) => (
	<>
		<header>App title</header>
		<aside>Sidebar</aside>
		{children}
	</>
);

export default Layout;
