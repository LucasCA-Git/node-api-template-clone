const pg = require('./postgres')

module.exports = class DatabaseFactory {
    static sql = pg
}
