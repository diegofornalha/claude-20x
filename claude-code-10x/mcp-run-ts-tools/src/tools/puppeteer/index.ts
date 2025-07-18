/**
 * Puppeteer Tools Module
 * 
 * Ferramentas de automação web usando Puppeteer
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import { 
  successResponse 
} from '../../utils.js';
import {
  NavigateParams,
  ScreenshotParams,
  ClickParams,
  TypeParams,
  MCPError,
  ErrorCode
} from '../../types.js';

const execAsync = promisify(exec);

// Schemas de validação
export const NavigateSchema = z.object({
  url: z.string().url('URL inválida fornecida')
});

export const ScreenshotSchema = z.object({
  path: z.string().min(1, 'Caminho do arquivo é obrigatório'),
  fullPage: z.boolean().optional().default(false)
});

export const ClickSchema = z.object({
  selector: z.string().min(1, 'Seletor CSS é obrigatório')
});

export const TypeSchema = z.object({
  selector: z.string().min(1, 'Seletor CSS é obrigatório'),
  text: z.string()
});

export const OpenBrowserSchema = z.object({
  url: z.string().url('URL inválida fornecida')
});

// Estado do browser
let browser: Browser | null = null;
let page: Page | null = null;
let lastActivity = Date.now();

// Configurações
const BROWSER_TIMEOUT = 5 * 60 * 1000; // 5 minutos
const DEFAULT_VIEWPORT = { width: 1280, height: 720 };

// Configurações do browser - simplificadas como no reference server
const BROWSER_CONFIG = {
  headless: false
};

/**
 * Garante que o browser está inicializado
 */
async function ensureBrowser(): Promise<void> {
  if (!browser || !browser.isConnected()) {
    console.log('🚀 Iniciando novo browser Puppeteer...');
    
    // Usa configuração simples como no reference server
    browser = await puppeteer.launch(BROWSER_CONFIG);
    
    // Adiciona listener para fechar gracefully
    browser.on('disconnected', () => {
      console.log('❌ Browser desconectado');
      browser = null;
      page = null;
    });
  }
  
  if (!page || page.isClosed()) {
    console.log('📄 Criando nova página...');
    const pages = await browser.pages();
    page = pages[0] || await browser.newPage();
  }
  
  lastActivity = Date.now();
}

/**
 * Fecha o browser após inatividade
 */
export function startBrowserCleanup() {
  setInterval(async () => {
    if (browser && Date.now() - lastActivity > BROWSER_TIMEOUT) {
      console.log('⏰ Fechando browser por inatividade...');
      await browser.close();
      browser = null;
      page = null;
    }
  }, 60000); // Verifica a cada minuto
}

// Handlers das ferramentas
export async function handleNavigate(params: NavigateParams) {
  const validated = NavigateSchema.parse(params);
  
  await ensureBrowser();
  if (!page) throw new MCPError(ErrorCode.PAGE_LOAD_FAILED, 'Página não inicializada');
  
  await page.goto(validated.url, { waitUntil: 'networkidle2' });
  
  return successResponse(
    { url: validated.url },
    `Navegado para ${validated.url}`
  );
}

export async function handleScreenshot(params: ScreenshotParams) {
  const validated = ScreenshotSchema.parse(params);
  
  await ensureBrowser();
  if (!page) throw new MCPError(ErrorCode.PAGE_LOAD_FAILED, 'Página não inicializada');
  
  let path = validated.path;
  if (!path.match(/\.(png|jpg|jpeg)$/i)) {
    path += '.png';
  }
  
  await page.screenshot({
    path: path as any, // Type assertion para resolver conflito de tipos
    fullPage: validated.fullPage
  });
  
  return successResponse(
    { path },
    `Screenshot salvo em ${path}`
  );
}

export async function handleClick(params: ClickParams) {
  const validated = ClickSchema.parse(params);
  
  await ensureBrowser();
  if (!page) throw new MCPError(ErrorCode.PAGE_LOAD_FAILED, 'Página não inicializada');
  
  await page.click(validated.selector);
  
  return successResponse(
    { selector: validated.selector },
    `Clicado no elemento: ${validated.selector}`
  );
}

export async function handleType(params: TypeParams) {
  const validated = TypeSchema.parse(params);
  
  await ensureBrowser();
  if (!page) throw new MCPError(ErrorCode.PAGE_LOAD_FAILED, 'Página não inicializada');
  
  await page.type(validated.selector, validated.text);
  
  return successResponse(
    { selector: validated.selector, text: validated.text },
    `Texto digitado no elemento: ${validated.selector}`
  );
}

export async function handleGetContent() {
  await ensureBrowser();
  if (!page) throw new MCPError(ErrorCode.PAGE_LOAD_FAILED, 'Página não inicializada');
  
  const content = await page.content();
  
  return successResponse(
    { content },
    'Conteúdo HTML obtido com sucesso'
  );
}

// Nova função para abrir URL em nova aba
export async function handleNewTab(params: NavigateParams) {
  const validated = NavigateSchema.parse(params);
  
  await ensureBrowser();
  if (!browser) throw new MCPError(ErrorCode.PAGE_LOAD_FAILED, 'Browser não inicializado');
  
  // Cria nova aba
  const newPage = await browser.newPage();
  await newPage.setViewport(DEFAULT_VIEWPORT);
  await newPage.goto(validated.url, { waitUntil: 'networkidle2' });
  
  // Foca na nova aba
  await newPage.bringToFront();
  
  return successResponse(
    { url: validated.url },
    `Nova aba aberta com ${validated.url}`
  );
}

// Função para abrir URL no navegador padrão do sistema
export async function handleOpenBrowser(params: { url: string }) {
  const validated = OpenBrowserSchema.parse(params);
  
  try {
    // Usa o comando 'open' do macOS para abrir a URL no navegador padrão
    await execAsync(`open "${validated.url}"`);
    
    return successResponse(
      { url: validated.url },
      `URL ${validated.url} aberta no navegador padrão do sistema`
    );
  } catch (error) {
    throw new MCPError(
      ErrorCode.INTERNAL_ERROR,
      `Falha ao abrir navegador: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
}

// Metadados das ferramentas Puppeteer
export const puppeteerTools = [
  {
    name: 'puppeteer_navigate',
    description: 'Navigate to a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to navigate to' }
      },
      required: ['url']
    }
  },
  {
    name: 'puppeteer_screenshot',
    description: 'Take a screenshot of the current page',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to save the screenshot' },
        fullPage: { type: 'boolean', description: 'Capture full page', default: false }
      },
      required: ['path']
    }
  },
  {
    name: 'puppeteer_click',
    description: 'Click on an element',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector of element to click' }
      },
      required: ['selector']
    }
  },
  {
    name: 'puppeteer_type',
    description: 'Type text into an element',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'CSS selector of element' },
        text: { type: 'string', description: 'Text to type' }
      },
      required: ['selector', 'text']
    }
  },
  {
    name: 'puppeteer_get_content',
    description: 'Get the HTML content of the current page',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'puppeteer_new_tab',
    description: 'Open URL in a new browser tab',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to open in new tab' }
      },
      required: ['url']
    }
  },
  {
    name: 'open_browser',
    description: 'Open URL in the system default browser',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to open in default browser' }
      },
      required: ['url']
    }
  }
];