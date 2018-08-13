import React from 'react';
import Layout from './Layout';
import News from './News';
import Loader from './Loader';
import './Home.scss';

const HomeLoading = () => <h1>Home page loading</h1>;

class Home extends React.Component<{}, { loading }> {
	constructor(props) {
		super(props);
		this.state = {
			loading: true
		};
	}
	componentDidMount() {
		if (this.state.loading) {
			setTimeout(() => {
				this.setState({
					loading: false
				});
			}, 3000);
		}
	}
	render() {
		return (
			<>
				<section>Welcome</section>
				<Loader loading={this.state.loading} loaderSFC={HomeLoading}>
					<section>My Targets in the news this week</section>
					<section>Related companies in the news this week</section>
					<News />
				</Loader>
			</>
		);
	}
}

export default () => (
	<Layout>
		<Home />
	</Layout>
);
