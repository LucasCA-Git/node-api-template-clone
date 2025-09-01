// corrected-seed.js
const { Pool } = require('pg');

const pool = new Pool({
    
    user: 'postgres',
    password: 'admin',
    database: 'api-db',
});

const usersToSeed = [
  { name: 'João Silva', email: 'joao.silva@example.com', password: 'password123' },
  { name: 'Maria Souza', email: 'maria.souza@example.com', password: 'password456' },
  { name: 'Carlos Pereira', email: 'carlos.pereira@example.com', password: 'senha789' },
  { name: 'Ana Lima', email: 'ana.lima@example.com', password: 'minhasenha321' },
  { name: 'Pedro Rocha', email: 'pedro.rocha@example.com', password: '12345678' },
  { name: 'Juliana Alves', email: 'juliana.alves@example.com', password: 'senha1234' },
  { name: 'Fernando Costa', email: 'fernando.costa@example.com', password: 'securepass' },
  { name: 'Larissa Martins', email: 'larissa.martins@example.com', password: 'pass2024' },
  { name: 'Ricardo Gomes', email: 'ricardo.gomes@example.com', password: 'gomespass' },
  { name: 'Patrícia Dias', email: 'patricia.dias@example.com', password: 'dias123' },
  { name: 'Lucas Fernandes', email: 'lucas.fernandes@example.com', password: 'lucaspass' },
  { name: 'Beatriz Melo', email: 'beatriz.melo@example.com', password: 'beatriz789' }
];

async function correctedSeed() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        for (const user of usersToSeed) {
            try {
                // Verifica se já existe
                const checkResult = await client.query(
                    'SELECT id FROM users WHERE email = $1',
                    [user.email]
                );
                
                if (checkResult.rows.length > 0) {
                    console.log(`⚠️  ${user.email} já existe`);
                    continue;
                }
                
                // Insere novo usuário com a estrutura correta
                const result = await client.query(
                    `INSERT INTO users (name, email, password, created_at) 
                     VALUES ($1, $2, $3, NOW()) RETURNING id, email, name`,
                    [user.name, user.email, user.password]
                );
                
                console.log(`✅ ${result.rows[0].email} criado (ID: ${result.rows[0].id}, Nome: ${result.rows[0].name})`);
            } catch (error) {
                console.error(`❌ Erro com ${user.email}:`, error.message);
                // Continua com os próximos usuários mesmo se um falhar
            }
        }
        
        await client.query('COMMIT');
        console.log('🎉 Seed concluído com sucesso!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro no transaction:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

correctedSeed();