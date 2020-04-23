const express = require('express');
const BookmarksService = require('./bookmarks-service');

const bookmarksRouter = express.Router();
const jsonParser = express.json();
const logger = require('../logger');
const xss = require('xss');
const { isWebUri } = require('valid-url');
const { v4: uuid } = require('uuid');

const serializeBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    description: xss(bookmark.description),
    url: xss(bookmark.url),
    rating: parseInt(bookmark.rating, 10)
});

bookmarksRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db');
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res.json(bookmarks.map(serializeBookmark))
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { title, url, description, rating } = req.body;

        for (const field of ['title', 'url', 'rating']) {
            if (!req.body[field]) {
                logger.error(`${field} is required`);
                return res.status(400).send(`'${field}' is required`)
            }
        }
        if (parseInt(rating, 10) < 1 || parseInt(rating, 10) > 5) {
            logger.error(`rating of ${rating} is invalid, must be greater than 0 and less than 6`);
            return res.status(400).send(`invalid rating ${rating}. rating must be 1-5`);
        }
        if (!isWebUri(url)) {
            logger.error(`invalid url ${url}`);
            return res.status(400).send(`invalid url ${url}. must be a valid url.`)
        }

        const newBookmark = { id: uuid(), title, url, description, rating: parseInt(rating, 10) };
        BookmarksService.insertBookmark(
            req.app.get('db'),
            newBookmark
        )
            .then(bookmark => {
                res
                    .status(201)
                    .location(`/bookmarks/${bookmark.id}`)
                    .json(serializeBookmark(bookmark))
            })
            .catch(next)
    });

bookmarksRouter
    .route('/:id')
    .all((req, res, next) => {
        BookmarksService.getById(
            req.app.get('db'),
            req.params.id
        )
            .then(bookmark => {
                if (!bookmark) {
                    return res.status(404).json({
                        error: { message: `Bookmark doesn't exist` }
                    })
                }
                res.bookmark = bookmark;
                next()
            })
            .catch(next)
    })
    .get((req, res) => {
        res.json(serializeBookmark(res.bookmark))
    })
    .delete((req, res, next) => {
        BookmarksService.deleteBookmark(
            req.app.get('db'),
            req.params.id
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    });

module.exports = bookmarksRouter;