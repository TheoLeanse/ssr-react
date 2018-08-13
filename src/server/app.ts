import express from 'express';
import bodyParser from 'body-parser';
import * as path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import exphbs from 'express-handlebars';
import indexRoute from './routes/index-route';
import log from '../lib/logger';

export const handlebarsEngine = exphbs({
	defaultLayout: 'main-express',
	extname: '.html',
	helpers: {
		json: context => JSON.stringify(context)
	}
});

const app = express();

app.engine('.html', handlebarsEngine);
app.set('view engine', '.html');

import morgan from 'morgan';
app.use(morgan('tiny'));

app.use(
	'/static',
	express.static('public', {
		immutable: false,
		maxAge: 1000 * 60 * 60 * 24 * 30 // = 1 month in ms
	})
);

app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
	res.setHeader('Cache-Control', 'private');
	next();
});

app.get('*', indexRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT);

log(`Scout App listening on ${PORT}`);
