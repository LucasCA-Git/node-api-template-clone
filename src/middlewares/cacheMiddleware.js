const logger = require('../utils/logger')
module.exports = class CacheMiddleware {

    static setHeaderExpires(res, ttl) {

    }

    static cached(timeExpire = process.env.REDIS_CACHE_EXPIRATION) {
        return async function (req, res, next) {
            return next();
        }
    }
}