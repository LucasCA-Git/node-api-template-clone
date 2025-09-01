const PostgreSQLManager = require('../../../config/postgres');
const logger = require('../../utils/logger');

class UserRepository {
    constructor() {
        this.postgres = new PostgreSQLManager();
        this.initialized = false;
    }
    
    async ensureInitialized() {
        if (!this.initialized) {
            const config = {
                host: 'localhost',
                port: 5432,
                user: process.env.PG_USER,
                database: process.env.PG_DATABASE,
                password: process.env.PG_PASSWORD
            };
            await this.postgres.initialize(config);
            this.initialized = true;
        }
    }

    async findAllUsers() {
        await this.ensureInitialized();
        
        try {
            const result = await this.postgres.query(
                'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC'
            );
            return result.rows;
        } catch (error) {
            logger.error('Error in findAllUsers:', error);
            throw new Error('Erro ao buscar usuários');
        }
    }

    async updateUser(userId, updateData) {
        await this.ensureInitialized();
        
        try {
            const fields = [];
            const values = [];
            let paramCount = 1;

            if (updateData.name !== undefined) {
                fields.push(`name = $${paramCount}`);
                values.push(updateData.name);
                paramCount++;
            }
            
            if (updateData.email !== undefined) {
                fields.push(`email = $${paramCount}`);
                values.push(updateData.email);
                paramCount++;
            }
            
            if (updateData.password !== undefined) {
                fields.push(`password = $${paramCount}`);
                values.push(updateData.password);
                paramCount++;
            }

            if (fields.length === 0) {
                throw new Error('Nenhum campo para atualizar');
            }

            values.push(userId);
            
            const result = await this.postgres.query(
                `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
                values
            );
            
            if (result.rows.length === 0) {
                throw new Error('Usuário não encontrado');
            }
            
            return result.rows[0];
        } catch (error) {
            logger.error('Error in updateUser:', error);
            throw new Error('Erro ao atualizar usuário');
        }
    }
    async deleteUser(userId) {
        await this.ensureInitialized();
        
        try {
            const result = await this.postgres.query(
                'DELETE FROM users WHERE id = $1 RETURNING id',
                [userId]
            );
            
            if (result.rows.length === 0) {
                throw new Error('Usuário não encontrado');
            }
            
            return { message: 'Usuário deletado com sucesso' };
        } catch (error) {
            logger.error('Error in deleteUser:', error);
            throw new Error('Erro ao deletar usuário');
        }
    }
    async createUser(user) {
        await this.ensureInitialized();
        
        const result = await this.postgres.query(
            `INSERT INTO users (name, email, password, created_at) 
             VALUES($1, $2, $3, NOW()) RETURNING *`,
            [user.name, user.email, user.password]
        );
        return result.rows[0];
    }

    async findUserByEmail(email) {
        await this.ensureInitialized();
        
        const result = await this.postgres.query(
            'SELECT * FROM users WHERE email = $1', 
            [email]
        );
        return result.rows[0];
    }

    async findUserById(id) {
        await this.ensureInitialized();
        
        const result = await this.postgres.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    async close() {
        if (this.initialized) {
            await this.postgres.close();
            this.initialized = false;
        }
    }
}

module.exports = new UserRepository();