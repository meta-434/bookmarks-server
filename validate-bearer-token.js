const { API_TOKEN } = require('./config');
const logger = require('./logger');

function validateBearerToken(req, res, next) {
    const authToken = req.get('authorization') || req.get('Authorization');
    console.log('authToken', authToken ,'req.headers.authorziation', req.headers);
    if (!authToken || authToken.split(' ')[1] !== API_TOKEN) {
        console.log('authToken', authToken);
        logger.info(`Unauthorized request to path: ${req.path}`);
        return res.status(401).json({ error: 'Unauthorized Request' });
    }

    next();
}

module.exports = validateBearerToken;