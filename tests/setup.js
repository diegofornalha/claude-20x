/**
 * Jest Setup - Configuração global para testes A2A
 */

// Aumentar timeout para testes que envolvem Redis
jest.setTimeout(10000);

// Mock console para testes que fazem log
global.mockConsole = () => {
  const originalConsole = global.console;
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  };
  return originalConsole;
};

// Restore console após mock
global.restoreConsole = (originalConsole) => {
  global.console = originalConsole;
};

// Helper para aguardar Promise com timeout
global.waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock environment variables para testes
process.env.NODE_ENV = 'test';
process.env.A2A_PORT = '0'; // Random port para testes
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Global cleanup após cada teste
afterEach(() => {
  jest.clearAllMocks();
});

console.log('🧪 Jest setup configurado para testes A2A');