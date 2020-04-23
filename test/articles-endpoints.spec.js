const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures');
//for better integration with my IDE (Webstorm) for testing, I'm adding these 2 imports here, in addition to setup.js
const { expect } = require('chai');
const supertest = require('supertest');

describe('Bookmarks Endpoints', function() {
    let db;

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        });
        app.set('db', db);
    });

    after('disconnect from db', () => db.destroy());

    before('clean the table', () => db('bookmarks').truncate());

    afterEach('cleanup', () => db('bookmarks').truncate());

    describe('GET /bookmarks', () => {
        context('Given no bookmarks', () => {
            it('responds with 200 and an empty list', () => {
               return supertest(app)
                   .get('/bookmarks')
                   .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                   .expect(200, []);
            });
        });

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray();

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks);
            });

            it('responds with 200 and all of the bookmarks', ()=> {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, testBookmarks);
            });
        });

        context('Given an xss attack payload', () => {
            const maliciousBookmark = {
                id: '77f0e2af-f3c1-4b09-b4a8-b68162caba87',
                title: 'Naughty naughty very naughty <script>alert("xss");</script>',
                rating: 3,
                url: 'www.xsstest.com',
                description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
            };



            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks')
                    .insert([maliciousBookmark]);
            });

            it('removes XSS attack payload', () => {
                const sanitizedBookmark = {
                    id: '77f0e2af-f3c1-4b09-b4a8-b68162caba87',
                    title: 'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;',
                    url: 'www.xsstest.com',
                    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
                };
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].title).to.eql(sanitizedBookmark.title);
                        expect(res.body[0].url).to.eql(sanitizedBookmark.url);
                        expect(res.body[0].description).to.eql(sanitizedBookmark.description);
                    });
            })
        });
    });

    describe('GET /bookmarks/:bookmark_id', () => {
        context('Given no bookmarks', () => {
           it('responds with 404 and appropriate error message', () => {
              const bookmarkId = 'ebdcb0ee-d7af-46ba-ada1-6102cf056f96';
              return supertest(app)
                  .get(`/bookmarks/${bookmarkId}`)
                  .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                  .expect(404, {error: {message: 'Bookmark doesn\'t exist'} });
           });
        });

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray();

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks);
            });

            it('responds with 200 and the specified bookmark', () => {
                const bookmarkId = 'ce7c1594-b097-4b31-95a9-2bb4e49196d5';
                const expectedArticle = testBookmarks[1];
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedArticle);
            });
        });

        context(`Given an XSS attack bookmark`, () => {
            const maliciousBookmark = {
                id: '77f0e2af-f3c1-4b09-b4a8-b68162caba87',
                title: 'Naughty naughty very naughty <script>alert("xss");</script>',
                rating: 3,
                url: 'www.test-url.com',
                description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
            };

            beforeEach('insert malicious bookmark', () => {
                return db
                    .into('bookmarks')
                    .insert([maliciousBookmark]);
            });

            it('removes XSS attack description', () => {
               return supertest(app)
                   .get(`/bookmarks/${maliciousBookmark.id}`)
                   .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                   .expect(200)
                   .expect(res => {
                       expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;');
                       expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`);
                   });
            });
        })
    });

    describe(`POST /bookmarks`, () => {
        context(`Given data is free of XSS attacks`, () => {
            it(`creates a bookmark, responding with 201 and the new bookmark`, () => {

                const newBookmark = {
                    id: '4c7663fb-6cdd-4904-a211-87b74f441002',
                    title: 'Test new bookmark',
                    url: 'www.testurl.com',
                    rating: 3,
                    description: 'Test new bookmark description...'
                };

                return supertest(app)
                    .post('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(newBookmark)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.title).to.eql(newBookmark.title);
                        expect(res.body.url).to.eql(newBookmark.url);
                        expect(res.body.description).to.eql(newBookmark.description);
                        expect(res.body).to.have.property('id');
                        expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
                    })
                    .then(postRes => {
                        supertest(app)
                            .get(`/bookmarks/${postRes.body.id}`)
                            .expect(postRes.body)
                    });
            });

            const requiredFields = ['title', 'url', 'description', 'rating'];

            requiredFields.forEach(field => {
                const newBookmark = {
                    title: 'Test new bookmark',
                    url: 'www.testbookmark.com',
                    rating: 4,
                    description: 'Test new bookmark description...'
                };

                it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                    delete newBookmark[field];

                    return supertest(app)
                        .post('/bookmarks')
                        .send(newBookmark)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(400, {
                            error: {
                                message: `Missing '${field}' in request body`
                            }
                        });
                });
            });
        });

        context(`Given an XSS attack bookmark`, () => {
            const maliciousBookmark = {
                id: '4c7663fb-6cdd-4904-a211-87b74f441002',
                title: 'Naughty naughty very naughty <script>alert("xss");</script>',
                rating: 3,
                url: 'www.xsstest.com',
                description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
            };

            it(`removes XSS attack description`, () => {
                return supertest(app)
                    .post('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(maliciousBookmark)
                    .expect(201)
                    .expect(res => {
                        expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;');
                        expect(res.body.url).to.eql(maliciousBookmark.url);
                        expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`);
                        expect(res.body).to.have.property('id');
                        expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
                        const expected = new Date().toLocaleString();
                        const actual = new Date(res.body.date_published).toLocaleString();
                        expect(actual).to.eql(expected);
                    });
            });
        });
    });

    describe(`DELETE /bookmarks/:bookmark_id`, () => {
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = makeBookmarksArray();

            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks);
            });

            it('responds with 204 and removes the bookmark', () => {
               const idToRemove = 'ce7c1594-b097-4b31-95a9-2bb4e49196d5';
               const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove);
               return supertest(app)
                   .delete(`/bookmarks/${idToRemove}`)
                   .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                   .expect(204)
                   .then(res => {
                       supertest(app)
                           .get(`/bookmarks`)
                           .expect(expectedBookmarks);
                   });
            });
        });

        context('Given no bookmarks', () => {
           it('responds with 404', () => {
               const bookmarkId = '4c7663fb-6cdd-4904-a211-87b74f441002';
               return supertest(app)
                   .delete(`/bookmarks/${bookmarkId}`)
                   .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                   .expect(404, {
                       error: {
                           message: `Bookmark doesn't exist`
                       }});
           }) ;
        });
    })
});