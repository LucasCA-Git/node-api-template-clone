// full-diagnostic.js
const { Pool } = require('pg');
const { exec } = require('child_process');

console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO');
console.log('==================================');

async function testPort(port) {
    console.log(`\n🧪 Testando porta ${port}...`);
    
    const pool = new Pool({
        host: '192.168.61.216',
        port: 31748, 
        user: 'postgres',
        password: 'admin',
        database: 'api-db',
        connectionTimeoutMillis: 3000,
    });

    try {
        const client = await pool.connect();
        console.log(`✅ PORTA ${port}: Conexão bem-sucedida!`);
        
        // Testar consulta básica
        const result = await client.query('SELECT version() as version');
        console.log(`   📋 PostgreSQL: ${result.rows[0].version.split(',')[0]}`);
        
        // Verificar se a tabela users existe
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            )
        `);
        
        if (tableExists.rows[0].exists) {
            console.log('   ✅ Tabela users: EXISTE');
            
            // Contar usuários
            const count = await client.query('SELECT COUNT(*) FROM users');
            console.log(`   👥 Total de usuários: ${count.rows[0].count}`);
            
            // Listar usuários se houver
            if (parseInt(count.rows[0].count) > 0) {
                const users = await client.query('SELECT id, name, email FROM users LIMIT 5');
                console.log('   📋 Primeiros usuários:');
                users.rows.forEach(user => {
                    console.log(`     - ${user.name} (${user.email})`);
                });
            }
        } else {
            console.log('   ❌ Tabela users: NÃO EXISTE');
        }
        
        client.release();
        await pool.end();
        return true;
        
    } catch (error) {
        console.log(`   ❌ PORTA ${port}: ${error.code === 'ECONNREFUSED' ? 'Connection refused' : error.message}`);
        await pool.end();
        return false;
    }
}

async function checkKubernetes() {
    console.log('\n📋 VERIFICANDO KUBERNETES...');
    
    return new Promise((resolve) => {
        exec('kubectl get pods', (error, stdout, stderr) => {
            if (error) {
                console.log('   ❌ Kubernetes não disponível ou kubectl não configurado');
                resolve(false);
                return;
            }
            
            console.log('   ✅ Kubernetes conectado');
            const lines = stdout.split('\n');
            let postgresFound = false;
            
            lines.forEach(line => {
                if (line.includes('postgres')) {
                    console.log(`   📦 Pod PostgreSQL: ${line.split(' ')[0]}`);
                    postgresFound = true;
                    
                    // Verificar status
                    if (line.includes('Running')) {
                        console.log('   ✅ Status: RUNNING');
                    } else {
                        console.log('   ⚠️  Status: NÃO está running');
                    }
                }
            });
            
            if (!postgresFound) {
                console.log('   ❌ Nenhum pod PostgreSQL encontrado');
            }
            
            resolve(postgresFound);
        });
    });
}

async function runDiagnostic() {
    console.log('1. 🔄 Verificando Kubernetes...');
    const k8sOk = await checkKubernetes();
    
    if (!k8sOk) {
        console.log('\n❌ Kubernetes não está configurado corretamente');
        console.log('💡 Execute: minikube start');
        return;
    }

    console.log('\n2. 🐘 Testando conexão PostgreSQL...');
    
    // Testar ambas as portas
    const port5432 = await testPort(5432);
    const port5433 = await testPort(5433);
    
    if (!port5432 && !port5433) {
        console.log('\n❌ Nenhuma porta respondendo!');
        console.log('\n🎯 SOLUÇÃO:');
        console.log('1. Em um terminal, execute:');
        console.log('   kubectl port-forward service/postgres-service 5433:5432');
        console.log('2. Deixe esse terminal ABERTO');
        console.log('3. Em outro terminal, execute:');
        console.log('   node full-diagnostic.js');
        console.log('\n🔍 Verifique também:');
        console.log('   - kubectl get pods (se PostgreSQL está running)');
        console.log('   - kubectl logs <pod-postgres> (ver logs)');
    } else {
        console.log('\n✅ Diagnóstico concluído!');
    }
}

// Timeout para não travar
setTimeout(() => {
    console.log('\n⏰ Timeout: O diagnóstico está demorando muito');
    console.log('💡 Verifique se o Kubernetes está respondendo');
    process.exit(1);
}, 15000);

runDiagnostic();