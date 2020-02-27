require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuid } = require('uuid');
const store = require('../bookmarks-server/store');

const app = express();

const morganSetting = process.env.NODE_ENV === 'production' ? 'tiny' : 'common';
app.use(morgan(morganSetting))
app.use(cors());
app.use(helmet());

app.use(function validateBearerToken(req, res, next) {
    const apiToken = process.env.API_TOKEN;
    const authToken = req.get('Authorization');
    if (!authToken || authToken.split(' ')[1] !== apiToken) {
        return res.status(401).json({ error: 'Unauthorized request' })
    }
    next()
});

app.get('/bookmarks', (req, res) => {
    return res
        .status(200)
        .json(store.bookmarks);
});

app.post('/bookmarks', (req, res) => {
    console.log(req.body[title]);
    const { title, url, description, rating} = req.query;

    const bookmark = { id: uuid(), title, url, description, rating };

    store.bookmarks.push(bookmark);
    res.status(200).json(store.bookmarks);
});

app.delete('/bookmarks', (req, res) => {

});

app.use((error, req, res, next) => {
    let response;
    if (process.env.NODE_ENV === 'production') {
        response = { error: { message: 'server error' }}
    } else {
        response = { error }
    }
    res.status(500).json(response)
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`)
});