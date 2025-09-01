// test-connection-final.js
require('dotenv').config();
const { Pool } = require('pg');

async function testConnection() {
    const pool = new Pool({
        host: '192.168.61.216',
        port: 31748, 
        user: 'postgres',
        password: 'admin', 
        database: 'api-db',
    });

    try {
        const client = await pool.connect();
        console.log('✅ Conexão bem-sucedida!');
        
        // Testa se a tabela users existe
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        console.log('📊 Tabelas no banco:');
        tables.rows.forEach(table => console.log('  -', table.table_name));
        
        client.release();
        await pool.end();
    } catch (error) {
        console.error('❌ Erro de conexão:', error.message);
    }
}

testConnection();