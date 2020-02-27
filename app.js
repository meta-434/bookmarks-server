require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuid } = require('uuid');
const store = require('./store');


const app = express();

const morganSetting = process.env.NODE_ENV === 'production' ? 'tiny' : 'common';
app.use(morgan(morganSetting));
app.use(express.json());
app.use(cors());
app.use(helmet());

app.get('/', (req, res) => {
    res.send('Hello, world!')
})

app.get('/bookmarks/:id', (req, res) => {
    // indiv bookmark view.
})

app.post('/bookmarks', (req, res) => {
    const { title, url, description, rating} = req.body;

    const bookmark = { id: uuid(), title, url, description, rating };

    store.bookmarks.push(bookmark);
    console.log(store);
    res.status(201).json(bookmark);
});

app.delete('/bookmarks/:id', (req, res) => {
    console.log('req.params::::', req.params);
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