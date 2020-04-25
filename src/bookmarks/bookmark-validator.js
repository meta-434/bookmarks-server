const {isWebUri} = require('valid-url');
const logger = require('../logger');

const validateBookmark = ({url, rating}) => {
    if (!Number.isInteger(parseInt(rating, 10)) || parseInt(rating, 10) < 1 || parseInt(rating, 10) > 5) {
        logger.error(`rating of ${rating} is invalid, must be greater than 0 and less than 6`);
        return {
            error: {
                message: `invalid rating ${rating}. rating must be 1-5`
            }
        }
    }
    if (url && !isWebUri(url)) {
        logger.error(`invalid url ${url}`);
        return {
            error: {
                message: `invalid url ${url}. must be a valid url.`
            }
        }
    }
    // validation success!
    return true;
};

module.exports = {
    validateBookmark,
};