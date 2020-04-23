require('dotenv').config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const validateBearerToken = require('./validate-bearer-token');
const errorHandler = require('./error-handler');
const { NODE_ENV, CLIENT_ORIGIN } = require('./config');
const bookmarksRouter = require('./bookmarks/bookmarks-router');

const morganSetting = NODE_ENV === 'production' ? 'tiny' : 'common';
app.use(morgan(morganSetting));
app.use(cors({origin: CLIENT_ORIGIN}));
app.use(validateBearerToken);
app.use(express.json());
app.use(helmet());

app.use('/bookmarks', bookmarksRouter);

app.use((error, req, res) => {
    let response;
    if (process.env.NODE_ENV === 'production') {
        response = { error: { message: 'server error' }}
    } else {
        response = { error }
    }
    console.error(error.stack);
    res.status(500).json(response)
});

app.use(errorHandler);

module.exports = app;