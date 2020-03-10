require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { isWebUri } = require('valid-url');
const helmet = require('helmet');
const { v4: uuid } = require('uuid');
const logger = require('./logger');
const store = require('./store');
const validateBearerToken = require('./validate-bearer-token');
const errorHandler = require('./error-handler');

const app = express();

const morganSetting = process.env.NODE_ENV === 'production' ? 'tiny' : 'common';
app.use(morgan(morganSetting));
app.use(validateBearerToken);
app.use(express.json());
app.use(cors());
app.use(helmet());

app.get('/bookmarks/:id', (req, res) => {
    const get_id = req.params.id;

    const bookmark = store.bookmarks.find(bkmrk => bkmrk.id == get_id);
    console.log('matched bookmark: ', bookmark);
    if (!bookmark) {
        return res
            .status(404)
            .send('Bookmark Not Found')
    }
    res.json(bookmark)
});

app.get('/bookmarks', (req, res) => {
    res.status(200).json(store.bookmarks);
});

app.post('/bookmarks', (req, res) => {
    for (const field of ['title', 'url', 'rating']) {
        if (!req.body[field]) {
            logger.error(`${field} is required`);
            return res.status(400).send(`'${field}' is required`)
        }
    }
    const { title, url, description, rating } = req.body;
    if (parseInt(rating, 10) < 1 || parseInt(rating, 10) > 5) {
        logger.error(`rating of ${rating} is invalid, must be greater than 0 and less than 6`);
        return res.status(400).send(`invalid rating ${rating}. rating must be 1-5`);
    }
    if (!isWebUri(url)) {
        logger.error(`invalid url ${url}`);
        return res.status(400).send(`invalid url ${url}. must be a valid url.`)
    }
    const bookmark = { id: uuid(), title, url, description, rating: parseInt(rating, 10) };
    store.bookmarks.push(bookmark);
    res.status(201).json(bookmark);
});

app.delete('/bookmarks/:id', (req, res) => {
    const delete_id = req.params.id;
    const del_idx = store.bookmarks.findIndex(bkmrk => bkmrk.id === delete_id);
    store.bookmarks.splice(del_idx, 1);
    res.status(204).send(`deleted: ${delete_id}`);
});

app.use((error, req, res, next) => {
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
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`)
});