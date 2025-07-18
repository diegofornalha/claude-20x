/**
 * Browser Tools Module
 * 
 * Ferramentas para interagir com o navegador do sistema operacional
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
import { successResponse } from '../../utils.js';
import { MCPError, ErrorCode } from '../../types.js';

const execAsync = promisify(exec);

// Schema de validação
export const OpenUrlSchema = z.object({
  url: z.string().url('URL inválida fornecida'),
  browser: z.enum(['default', 'chrome', 'safari', 'firefox']).optional().default('default')
});

// Handler para abrir URL no navegador do sistema
export async function handleOpenUrl(params: { url: string; browser?: string }) {
  const validated = OpenUrlSchema.parse(params);
  
  try {
    let command: string;
    
    // macOS commands
    switch (validated.browser) {
      case 'chrome':
        command = `open -a "Google Chrome" "${validated.url}"`;
        break;
      case 'safari':
        command = `open -a Safari "${validated.url}"`;
        break;
      case 'firefox':
        command = `open -a Firefox "${validated.url}"`;
        break;
      default:
        command = `open "${validated.url}"`;
    }
    
    await execAsync(command);
    
    return successResponse(
      { 
        url: validated.url,
        browser: validated.browser
      },
      `✅ URL aberta no navegador ${validated.browser === 'default' ? 'padrão' : validated.browser}: ${validated.url}`
    );
  } catch (error: any) {
    throw new MCPError(
      ErrorCode.INTERNAL_ERROR,
      `Erro ao abrir URL: ${error.message}`
    );
  }
}

// Metadados das ferramentas do navegador
export const browserTools = [
  {
    name: 'browser_open_url',
    description: 'Abre uma URL no navegador padrão do sistema ou em um navegador específico',
    inputSchema: {
      type: 'object',
      properties: {
        url: { 
          type: 'string', 
          description: 'URL para abrir no navegador'
        },
        browser: {
          type: 'string',
          enum: ['default', 'chrome', 'safari', 'firefox'],
          description: 'Navegador específico para usar (padrão: navegador padrão do sistema)',
          default: 'default'
        }
      },
      required: ['url']
    }
  }
];