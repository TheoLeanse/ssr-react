import { Map } from 'immutable';

const Article = (state, action) => {
	if (typeof state === 'undefined') return Map({});

	switch (action.type) {
		default:
			return state;
	}
};

export default Article;
