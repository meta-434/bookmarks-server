const express = require('express');
const app = express();
const knex = require('knex');
const { PORT, DB_URL } = require('./config');
const BookmarksService = require('./bookmarks-service');

const db = knex({
    client: 'pg',
    connection: DB_URL,
});

app.set('db', db);

app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`)
});