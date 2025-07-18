/**
 * Testes para utilitários
 */

import { 
  withRetry, 
  withTimeout, 
  SimpleCache,
  pipe,
  compose,
  debounce 
} from '../../utils';

describe('Utils', () => {
  describe('withRetry', () => {
    it('deve executar função com sucesso na primeira tentativa', async () => {
      const mockFn = jest.fn().mockResolvedValue('sucesso');
      const fnWithRetry = withRetry(mockFn, 3, 10);
      
      const result = await fnWithRetry();
      
      expect(result).toBe('sucesso');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('deve retentar após falha', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('falha 1'))
        .mockResolvedValue('sucesso');
      
      const fnWithRetry = withRetry(mockFn, 3, 10);
      const result = await fnWithRetry();
      
      expect(result).toBe('sucesso');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('deve falhar após esgotar tentativas', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('falha'));
      const fnWithRetry = withRetry(mockFn, 2, 10);
      
      await expect(fnWithRetry()).rejects.toThrow('falha');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('withTimeout', () => {
    it('deve completar antes do timeout', async () => {
      const mockFn = jest.fn().mockResolvedValue('rápido');
      const fnWithTimeout = withTimeout(mockFn, 1000);
      
      const result = await fnWithTimeout();
      
      expect(result).toBe('rápido');
    });

    it('deve falhar com timeout', async () => {
      const mockFn = jest.fn(() => new Promise(resolve => setTimeout(resolve, 200)));
      const fnWithTimeout = withTimeout(mockFn, 50);
      
      await expect(fnWithTimeout()).rejects.toThrow('timeout');
    });
  });

  describe('SimpleCache', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('deve armazenar e recuperar valores', () => {
      const cache = new SimpleCache<string>();
      
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('deve retornar undefined para chave inexistente', () => {
      const cache = new SimpleCache<string>();
      
      expect(cache.get('inexistente')).toBeUndefined();
    });

    it('deve respeitar TTL', () => {
      const cache = new SimpleCache<string>(100); // 100ms TTL
      
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
      
      jest.advanceTimersByTime(101);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('deve limpar cache', () => {
      const cache = new SimpleCache<string>();
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });
  });

  describe('pipe', () => {
    it('deve compor funções da esquerda para direita', () => {
      const add1 = (x: number) => x + 1;
      const mult2 = (x: number) => x * 2;
      const toString = (x: number) => x.toString();
      
      const pipeline = pipe(add1, mult2, toString);
      
      expect(pipeline(5)).toBe('12'); // (5 + 1) * 2 = 12
    });
  });

  describe('compose', () => {
    it('deve compor funções da direita para esquerda', () => {
      const add1 = (x: number) => x + 1;
      const mult2 = (x: number) => x * 2;
      const toString = (x: number) => x.toString();
      
      const composed = compose(toString, mult2, add1);
      
      expect(composed(5)).toBe('12'); // (5 + 1) * 2 = 12
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('deve atrasar execução', () => {
      const mockFn = jest.fn();
      const debounced = debounce(mockFn, 100);
      
      debounced('test');
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(101);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('deve cancelar execuções anteriores', () => {
      const mockFn = jest.fn();
      const debounced = debounce(mockFn, 100);
      
      debounced('first');
      jest.advanceTimersByTime(50);
      debounced('second');
      jest.advanceTimersByTime(50);
      debounced('third');
      jest.advanceTimersByTime(101);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');
    });
  });
});