const winston = require('winston');
const { format, transports } = winston;
const { NODE_ENV } = require('./config');

const logger = winston.createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.printf(i => `${i.timestamp} [${i.level}] ${i.message}`)
    ),
    transports: [
        new winston.transports.File({ filename: './src/info.log' })
    ]
});

if (!['production', 'test'].includes(NODE_ENV)) {
    logger.add(new transports.Console({
        format: format.simple()
    }));
}

module.exports = logger;