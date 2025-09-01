// verify-database.js
const { Pool } = require('pg');

// Configuração da conexão
const pool = new Pool({
    host: '192.168.61.216',
    port: 31748, 
    user: 'postgres',
    password: 'admin',
    database: 'api-db',
});

async function verifyDatabase() {
    console.log('🔍 INICIANDO VERIFICAÇÃO COMPLETA DO BANCO');
    console.log('===========================================');
    
    const client = await pool.connect();
    
    try {
        // 1. INFORMAÇÕES GERAIS DO BANCO
        console.log('\n1. 📊 INFORMAÇÕES GERAIS');
        console.log('-----------------------');
        
        const dbInfo = await client.query('SELECT version() as postgres_version');
        console.log(`✅ PostgreSQL: ${dbInfo.rows[0].postgres_version.split(',')[0]}`);
        
        const dbSize = await client.query('SELECT pg_size_pretty(pg_database_size(current_database())) as size');
        console.log(`📦 Tamanho do banco: ${dbSize.rows[0].size}`);

        // 2. VERIFICAR TODAS AS TABELAS
        console.log('\n2. 🏗️  ESTRUTURA DO BANCO');
        console.log('-----------------------');
        
        const tables = await client.query(`
            SELECT table_name, table_type 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('📋 Tabelas encontradas:');
        tables.rows.forEach(table => {
            console.log(`   - ${table.table_name} (${table.table_type})`);
        });

        // 3. VERIFICAR ESTRUTURA DA TABELA USERS
        console.log('\n3. 📋 ESTRUTURA DA TABELA USERS');
        console.log('-----------------------------');
        
        const usersStructure = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        `);
        
        console.log('🏗️  Colunas da tabela users:');
        usersStructure.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
        });

        // 4. ESTATÍSTICAS COMPLETAS DOS USUÁRIOS
        console.log('\n4. 📈 ESTATÍSTICAS DOS USUÁRIOS');
        console.log('-----------------------------');
        
        const totalUsers = await client.query('SELECT COUNT(*) as total FROM users');
        console.log(`👥 Total de usuários: ${totalUsers.rows[0].total}`);
        
        const latestUser = await client.query('SELECT MAX(created_at) as ultimo_cadastro FROM users');
        console.log(`🕒 Último cadastro: ${latestUser.rows[0].ultimo_cadastro}`);
        
        const usersPerDay = await client.query(`
            SELECT DATE(created_at) as data, COUNT(*) as cadastros
            FROM users 
            GROUP BY DATE(created_at) 
            ORDER BY data DESC
        `);
        
        console.log('📅 Cadastros por dia:');
        usersPerDay.rows.forEach(row => {
            console.log(`   - ${row.data}: ${row.cadastros} usuários`);
        });

        // 5. LISTAGEM COMPLETA DOS USUÁRIOS
        console.log('\n5. 👥 LISTAGEM COMPLETA DE USUÁRIOS');
        console.log('---------------------------------');
        
        const allUsers = await client.query(`
            SELECT id, name, email, created_at 
            FROM users 
            ORDER BY created_at DESC
        `);
        
        console.log(`📋 ${allUsers.rows.length} usuários encontrados:`);
        allUsers.rows.forEach((user, index) => {
            console.log(`\n   ${index + 1}. 👤 ${user.name}`);
            console.log(`      📧 Email: ${user.email}`);
            console.log(`      🆔 ID: ${user.id}`);
            console.log(`      📅 Criado em: ${user.created_at}`);
        });

        // 6. VERIFICAÇÃO ESPECÍFICA DOS USUÁRIOS DO SEED
        console.log('\n6. ✅ VERIFICAÇÃO DO SEED');
        console.log('------------------------');
        
        const seedEmails = [
            'joao.silva@example.com', 'maria.souza@example.com', 'carlos.pereira@example.com',
            'ana.lima@example.com', 'pedro.rocha@example.com', 'juliana.alves@example.com',
            'fernando.costa@example.com', 'larissa.martins@example.com', 'ricardo.gomes@example.com',
            'patricia.dias@example.com', 'lucas.fernandes@example.com', 'beatriz.melo@example.com'
        ];
        
        let found = 0;
        let missing = 0;
        
        for (const email of seedEmails) {
            const user = await client.query(
                'SELECT id, name FROM users WHERE email = $1',
                [email]
            );
            
            if (user.rows.length > 0) {
                console.log(`   ✅ ${email} - ENCONTRADO (${user.rows[0].name})`);
                found++;
            } else {
                console.log(`   ❌ ${email} - NÃO ENCONTRADO`);
                missing++;
            }
        }
        
        console.log(`\n   📊 Resultado: ${found} encontrados, ${missing} faltantes`);

        // 7. TESTES DE CONSULTAS AVANÇADAS
        console.log('\n7. 🧪 TESTES AVANÇADOS');
        console.log('---------------------');
        
        // Usuários criados hoje
        const todayUsers = await client.query(`
            SELECT COUNT(*) as hoje 
            FROM users 
            WHERE DATE(created_at) = CURRENT_DATE
        `);
        console.log(`📅 Usuários criados hoje: ${todayUsers.rows[0].hoje}`);
        
        // Primeiro usuário criado
        const firstUser = await client.query(`
            SELECT name, email, created_at 
            FROM users 
            ORDER BY created_at ASC 
            LIMIT 1
        `);
        
        if (firstUser.rows.length > 0) {
            console.log(`🥇 Primeiro usuário: ${firstUser.rows[0].name} (${firstUser.rows[0].email})`);
        }
        
        // Distribuição de domínios de email
        const emailDomains = await client.query(`
            SELECT 
                SUBSTRING(email FROM '@(.+)$') as dominio,
                COUNT(*) as quantidade
            FROM users 
            GROUP BY dominio 
            ORDER BY quantidade DESC
        `);
        
        console.log('📧 Domínios de email mais usados:');
        emailDomains.rows.forEach(domain => {
            console.log(`   - ${domain.dominio}: ${domain.quantidade} usuários`);
        });

        console.log('\n🎉 VERIFICAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('===========================================');

    } catch (error) {
        console.error('❌ ERRO DURANTE A VERIFICAÇÃO:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

// Executar a verificação
verifyDatabase();