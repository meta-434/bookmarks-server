const express = require('express');
const BookmarksService = require('./bookmarks-service');
const { validateBookmark } = require('./bookmark-validator');
const bookmarksRouter = express.Router();
const jsonParser = express.json();
const logger = require('../logger');
const xss = require('xss');
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
                res.status(400).send({
                    error: {
                        message: `Missing '${field}' in request body`
                    }
                });

            }
        }

        const isValid = !!validateBookmark({url, rating});
        if (isValid !== true) {
            return res
                .status(400)
                .send(isValid);
        }
        console.log('isValid?> ', isValid);
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
    })
    .patch((req, res, next) => {
        const {title, url, description, rating } = req.body;
        const updateBookmarkTarget = {title, url, description, rating: parseInt(rating, 10)};
        console.log('updateBookmarkTarget', updateBookmarkTarget);
        // this filter is a falsy bouncer, if a value in updateBookmarkTarget is falsy or doesn't exist, it is not
        // added to the resultant filter() array.
        const numberOfValues = Object.values(updateBookmarkTarget).filter(Boolean).length;
        if (numberOfValues === 0) {
            logger.error(`Invalid update without required fields`);
            return res
                .status(400)
                .json({
                    error: {
                        message: `Request body content must be one of 'title', 'url', 'description', or 'rating'`
                    }
                });
        }

        const isValid = !!validateBookmark({url, rating});
        if (isValid !== true) {
            return res
                .status(400)
                .send(isValid);
        }

        const { id } = req.params;
        BookmarksService.updateBookmark(
          req.app.get('db'),
          id,
          updateBookmarkTarget
        )
            .then(numRowsAffected => {
                res
                    .status(204)
                    .end();
            })
            .catch(next);
    });

module.exports = bookmarksRouter;