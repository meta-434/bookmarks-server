module.exports = {
    PORT: process.env.PORT || 8080,
    NODE_ENV: process.env.NODE_ENV || 'development',
    API_TOKEN: process.env.API_TOKEN || 'default-dev-token',
    DB_URL: process.env.DB_URL || 'postgresql://dunder_mifflin@localhost/bookmarks',
    CLIENT_ORIGIN: 'http://localhost:3000'
};