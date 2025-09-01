const { Pool } = require("pg");
const logger = require('../src/utils/logger');

class PostgreSQLManager {
    constructor() {
        if (PostgreSQLManager.instance) {
            return PostgreSQLManager.instance;
        }
        
        this.isEnabled = false;
        this.pool = null;
        this.isInitialized = false;
        PostgreSQLManager.instance = this;
    }

    async initialize(config) {
        if (this.isInitialized) {
            return this;
        }

        this.isEnabled = process.env.POSTGRES_ENABLE === 'true';
        
        if (!this.isEnabled) {   
            logger.warn('PostgreSQL desabilitado.');
            this.isInitialized = true;
            return this;
        }

        try {
            this.pool = new Pool(config || {
                user: process.env.PG_USER,
                host: process.env.PG_HOST,
                database: process.env.PG_DATABASE,
                password: process.env.PG_PASSWORD,
                port: process.env.PG_PORT,
                max: 1200,
                idleTimeoutMillis: 15000
            });

            // Testa a conexão
            const client = await this.pool.connect();
            await client.query('SELECT 1');
            client.release();

            this.isInitialized = true;
            logger.info('Pool PostgreSQL inicializado com sucesso.');
        } catch (error) {
            logger.error('Erro ao inicializar PostgreSQL:', error.message);
            throw error;
        }

        return this;
    }

    getPool() {
        if (!this.isInitialized) {
            throw new Error('PostgreSQL não inicializado. Chame initialize() primeiro.');
        }
        if (!this.isEnabled || !this.pool) {
            throw new Error('PostgreSQL não está habilitado ou inicializado.');
        }
        return this.pool;
    }

    async query(text, params) {
        if (!this.isEnabled || !this.pool) {
            throw new Error('PostgreSQL não está habilitado ou inicializado.');
        }
        
        const client = await this.pool.connect();
        try {
            return await client.query(text, params);
        } finally {
            client.release();
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            this.isInitialized = false;
            this.pool = null;
            logger.info("Pool PostgreSQL fechado.");
        }
    }

    getIsEnabled() {
        return this.isEnabled;
    }

    getIsInitialized() {
        return this.isInitialized;
    }
}

// Exporta a classe para ser instanciada quando necessário
module.exports = PostgreSQLManager;