const PostgreSQLManager = require('../config/postgres');

// Cria uma instância singleton
let postgresInstance = null;

function getPostgresInstance() {
    if (!postgresInstance) {
        postgresInstance = new PostgreSQLManager();
    }
    return postgresInstance;
}

module.exports = {
    get db() {
        const pg = getPostgresInstance();
        if (!pg.getIsInitialized()) {
            throw new Error('PostgreSQL não inicializado. Chame initialize() primeiro.');
        }
        return pg.getPool();
    },
    
    async initialize() {
        const pg = getPostgresInstance();
        await pg.initialize();
    },
    
    async close() {
        const pg = getPostgresInstance();
        if (pg.getIsInitialized()) {
            await pg.close();
        }
    }
};