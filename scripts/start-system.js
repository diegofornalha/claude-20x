#!/usr/bin/env node
/**
 * 🚀 System Startup Script - Claude-20x
 * Inicia todos os serviços otimizados seguindo as recomendações da auditoria SPARC
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class SystemManager {
    constructor() {
        this.services = new Map();
        this.baseDir = '/Users/agents/Desktop/claude-20x';
        this.logFile = path.join(this.baseDir, 'logs', 'system-startup.log');
        
        // Garantir diretório de logs
        const logsDir = path.dirname(this.logFile);
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        console.log(message);
        fs.appendFileSync(this.logFile, logMessage);
    }

    async startService(name, command, cwd = this.baseDir, env = {}) {
        return new Promise((resolve, reject) => {
            this.log(`🚀 Iniciando ${name}...`);
            
            const process = spawn('bash', ['-c', command], {
                cwd,
                env: { ...process.env, ...env },
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let output = '';
            let errorOutput = '';

            process.stdout.on('data', (data) => {
                output += data.toString();
                // Log em tempo real para serviços importantes
                if (['Central Logger', 'Service Discovery'].includes(name)) {
                    console.log(`[${name}] ${data.toString().trim()}`);
                }
            });

            process.stderr.on('data', (data) => {
                errorOutput += data.toString();
                console.error(`[${name} ERROR] ${data.toString().trim()}`);
            });

            // Aguardar inicialização (timeout de 10s)
            setTimeout(() => {
                if (process.pid) {
                    this.services.set(name, {
                        process,
                        pid: process.pid,
                        command,
                        startTime: new Date(),
                        status: 'running'
                    });
                    this.log(`✅ ${name} iniciado (PID: ${process.pid})`);
                    resolve(process);
                } else {
                    reject(new Error(`Falha ao iniciar ${name}: ${errorOutput}`));
                }
            }, 2000);

            process.on('error', (error) => {
                this.log(`❌ Erro em ${name}: ${error.message}`);
                reject(error);
            });

            process.on('exit', (code) => {
                if (this.services.has(name)) {
                    this.services.get(name).status = 'stopped';
                }
                this.log(`⚠️ ${name} parou com código ${code}`);
            });
        });
    }

    async checkHealth(name, url, retries = 3) {
        this.log(`🔍 Verificando saúde de ${name}...`);
        
        for (let i = 0; i < retries; i++) {
            try {
                const response = await axios.get(url, { timeout: 5000 });
                if (response.status === 200) {
                    this.log(`💚 ${name} saudável!`);
                    return true;
                }
            } catch (error) {
                if (i === retries - 1) {
                    this.log(`❌ ${name} não responsivo: ${error.message}`);
                    return false;
                }
                // Aguardar antes de tentar novamente
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        return false;
    }

    async optimizeDependencies() {
        this.log('⚡ Executando otimização de dependências...');
        
        try {
            // Executar dependency optimizer
            await this.startService(
                'Dependency Optimizer',
                'node optimization/dependency-optimizer.js',
                this.baseDir
            );
            
            // Aguardar conclusão
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            this.log('✅ Otimização de dependências concluída');
        } catch (error) {
            this.log(`⚠️ Erro na otimização: ${error.message}`);
        }
    }

    async startCoreServices() {
        this.log('🏗️ Iniciando serviços principais...');
        
        const services = [
            {
                name: 'Central Logger',
                command: 'python3 logging/central-logger.py',
                healthUrl: 'http://localhost:8001/health',
                waitTime: 3000
            },
            {
                name: 'Service Discovery',
                command: 'python3 discovery/service-discovery.py',
                healthUrl: 'http://localhost:8002/health',
                waitTime: 3000
            }
        ];

        for (const service of services) {
            try {
                await this.startService(service.name, service.command);
                
                // Aguardar inicialização
                await new Promise(resolve => setTimeout(resolve, service.waitTime));
                
                // Verificar saúde
                if (service.healthUrl) {
                    await this.checkHealth(service.name, service.healthUrl);
                }
            } catch (error) {
                this.log(`❌ Falha ao iniciar ${service.name}: ${error.message}`);
            }
        }
    }

    async startAgentServices() {
        this.log('🤖 Iniciando serviços de agentes...');
        
        const agentServices = [
            {
                name: 'A2A Inspector',
                command: 'cd a2a-inspector/backend && uv run app.py',
                healthUrl: 'http://localhost:5001',
                cwd: path.join(this.baseDir, 'a2a-inspector')
            },
            {
                name: 'UI Service',
                command: 'python3 main.py',
                cwd: path.join(this.baseDir, 'ui'),
                healthUrl: 'http://localhost:12000'
            }
        ];

        for (const service of agentServices) {
            try {
                await this.startService(
                    service.name, 
                    service.command, 
                    service.cwd || this.baseDir
                );
                
                // Aguardar inicialização
                await new Promise(resolve => setTimeout(resolve, 4000));
                
                // Verificar saúde
                if (service.healthUrl) {
                    await this.checkHealth(service.name, service.healthUrl);
                }
            } catch (error) {
                this.log(`⚠️ Falha ao iniciar ${service.name}: ${error.message}`);
            }
        }
    }

    async discoverExistingServices() {
        this.log('🔍 Descobrindo serviços já em execução...');
        
        try {
            // Trigger service discovery
            const response = await axios.post('http://localhost:8002/discover', { force: true });
            
            // Obter lista de agentes
            const agentsResponse = await axios.get('http://localhost:8002/agents');
            const agents = agentsResponse.data.agents;
            
            this.log(`✅ Descobertos ${agents.length} agentes:`);
            agents.forEach(agent => {
                this.log(`  - ${agent.name} (${agent.url}) - ${agent.status}`);
            });
            
        } catch (error) {
            this.log(`⚠️ Erro na descoberta: ${error.message}`);
        }
    }

    async setupEnvironment() {
        this.log('🛠️ Configurando ambiente...');
        
        // Criar diretórios necessários
        const dirs = [
            'logs',
            'optimization',
            'logging/logs',
            'discovery'
        ];
        
        dirs.forEach(dir => {
            const fullPath = path.join(this.baseDir, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                this.log(`📁 Criado diretório: ${dir}`);
            }
        });
        
        // Configurar Chromium se necessário
        if (fs.existsSync(path.join(this.baseDir, 'optimization/setup-chromium.sh'))) {
            try {
                await this.startService(
                    'Chromium Setup',
                    './optimization/setup-chromium.sh',
                    this.baseDir
                );
                await new Promise(resolve => setTimeout(resolve, 3000));
                this.log('✅ Chromium configurado');
            } catch (error) {
                this.log(`⚠️ Erro no setup do Chromium: ${error.message}`);
            }
        }
    }

    displayStatus() {
        this.log('\n📊 Status dos Serviços:');
        this.log('=' .repeat(50));
        
        if (this.services.size === 0) {
            this.log('Nenhum serviço em execução');
        } else {
            this.services.forEach((service, name) => {
                const uptime = Math.floor((Date.now() - service.startTime) / 1000);
                this.log(`${service.status === 'running' ? '🟢' : '🔴'} ${name} (PID: ${service.pid}, Uptime: ${uptime}s)`);
            });
        }
        
        this.log('=' .repeat(50));
        this.log('\n🌐 URLs de Acesso:');
        this.log('  Central Logger:   http://localhost:8001');
        this.log('  Service Discovery: http://localhost:8002');
        this.log('  A2A Inspector:    http://localhost:5001');  
        this.log('  UI Service:       http://localhost:12000');
        this.log('\n📚 APIs e Documentação:');
        this.log('  Logger API docs:  http://localhost:8001/docs');
        this.log('  Discovery API:    http://localhost:8002/docs');
        this.log('  Agents List:      http://localhost:8002/agents');
    }

    async gracefulShutdown() {
        this.log('🛑 Iniciando shutdown gracioso...');
        
        const shutdownPromises = [];
        
        this.services.forEach((service, name) => {
            if (service.status === 'running') {
                shutdownPromises.push(
                    new Promise((resolve) => {
                        this.log(`⏹️ Parando ${name}...`);
                        service.process.kill('SIGTERM');
                        
                        setTimeout(() => {
                            if (service.process.killed === false) {
                                service.process.kill('SIGKILL');
                            }
                            resolve();
                        }, 5000);
                    })
                );
            }
        });
        
        await Promise.all(shutdownPromises);
        this.log('✅ Shutdown concluído');
        process.exit(0);
    }

    async run() {
        console.log('🚀 Claude-20x System Manager v1.0.0');
        console.log('📋 Implementando recomendações da auditoria SPARC...\n');
        
        // Configurar handlers de shutdown
        process.on('SIGINT', () => this.gracefulShutdown());
        process.on('SIGTERM', () => this.gracefulShutdown());
        
        try {
            // 1. Setup do ambiente
            await this.setupEnvironment();
            
            // 2. Otimizar dependências
            await this.optimizeDependencies();
            
            // 3. Iniciar serviços principais
            await this.startCoreServices();
            
            // 4. Iniciar serviços de agentes
            await this.startAgentServices();
            
            // 5. Descobrir serviços existentes
            await this.discoverExistingServices();
            
            // 6. Exibir status
            this.displayStatus();
            
            this.log('\n🎉 Sistema Claude-20x iniciado com sucesso!');
            this.log('💡 Use Ctrl+C para parar todos os serviços');
            
            // Manter processo vivo
            setInterval(() => {
                // Health check periódico
                this.services.forEach(async (service, name) => {
                    if (service.status === 'running' && !service.process.killed) {
                        // Processo ainda está rodando
                    } else {
                        this.log(`⚠️ ${name} parou inesperadamente`);
                    }
                });
            }, 30000); // Check a cada 30s
            
        } catch (error) {
            this.log(`❌ Erro crítico no startup: ${error.message}`);
            console.error(error);
            process.exit(1);
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const manager = new SystemManager();
    manager.run().catch(console.error);
}

module.exports = SystemManager;