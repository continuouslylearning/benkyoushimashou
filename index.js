'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { PORT, CLIENT_ORIGIN } = require('./config');
const app = express();

const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const questionsRouter = require('./routes/questions');

const jwtAuth = require('./authentication/jwt');

app.use(morgan('common'));
app.use(cors({ origin: CLIENT_ORIGIN }));

app.use('/api/users', usersRouter);
app.use('/auth', authRouter);
app.use('/api/questions', jwtAuth, questionsRouter);

app.use((req, res, next) => {
	const err = new Error('Not found');
	err.status = 404;
	next(err);
});

app.use((err, req, res, next) => {
	if (err.status) {
		return res.status(err.status).json({
			message: err.message
		});
	} else {
		console.error(err);
		res.status(500).json({ 
			message: 'Internal Server Error' 
		});
	}
});

function runServer(port = PORT) {
	const server = app
		.listen(port, () => {
			console.info(`Listening on port ${server.address().port}`);
		})
		.on('error', err => {
			console.error(err);
		});
}

if (require.main === module) {
	runServer();
}

module.exports = app;
