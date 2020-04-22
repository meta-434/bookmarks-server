const BookmarksService = {
    getAllBookmarks(knex) {
        return knex
            .select('*')
            .from('bookmarks');
    },
    // TODO: add the rest of the CRUD here...
};

module.exports = BookmarksService;