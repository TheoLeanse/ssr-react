import React from 'react';

const Loader = ({
	error,
	notFound,
	loading,
	loaderSFC,
	children,
	className
}) => {
	if (error) {
		return <div>ERROR</div>;
	} else if (notFound) {
		return (
			<div
				className={
					'loader' +
					'loader--error' +
					'loader--not-found' +
					this.props.className
				}
			>
				{
					"Sorry, we couldn't find what you were looking for. If you think this is a mistake please"
				}
				<a href="mailto: scoutasia@ft.com?subject=${encodeURIComponent('Support request for scoutAsia: 404')}">
					{'contact us'}
				</a>
			</div>
		);
	} else if (loading) {
		return loaderSFC({});
	} else {
		return (
			<div className={'loader' + 'loader--complete' + className}>
				{children}
			</div>
		);
	}
};

export default Loader;
