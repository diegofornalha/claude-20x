/**
 * Zod schemas for input validation
 */

import { z } from 'zod';
import { IssueState } from './types.js';

// ==================== Puppeteer Schemas ====================

export const NavigateSchema = z.object({
  url: z.string().url('URL deve ser válida')
});

export const ScreenshotSchema = z.object({
  path: z.string().min(1, 'Path é obrigatório'),
  fullPage: z.boolean().optional().default(false)
});

export const ClickSchema = z.object({
  selector: z.string().min(1, 'Selector é obrigatório')
});

export const TypeSchema = z.object({
  selector: z.string().min(1, 'Selector é obrigatório'),
  text: z.string().min(1, 'Text é obrigatório')
});

// ==================== GitHub Schemas ====================

export const CreateIssueSchema = z.object({
  owner: z.string().min(1, 'Owner é obrigatório'),
  repo: z.string().min(1, 'Repo é obrigatório'),
  title: z.string().min(1, 'Title é obrigatório').max(256, 'Title muito longo'),
  body: z.string().optional(),
  labels: z.array(z.string()).optional(),
  assignees: z.array(z.string()).optional()
});

export const ListIssuesSchema = z.object({
  owner: z.string().min(1, 'Owner é obrigatório'),
  repo: z.string().min(1, 'Repo é obrigatório'),
  state: z.nativeEnum(IssueState).optional().default(IssueState.OPEN),
  labels: z.array(z.string()).optional(),
  sort: z.enum(['created', 'updated', 'comments']).optional(),
  direction: z.enum(['asc', 'desc']).optional(),
  per_page: z.number().min(1).max(100).optional().default(30),
  page: z.number().min(1).optional().default(1)
});

export const CreatePRSchema = z.object({
  owner: z.string().min(1, 'Owner é obrigatório'),
  repo: z.string().min(1, 'Repo é obrigatório'),
  title: z.string().min(1, 'Title é obrigatório').max(256, 'Title muito longo'),
  body: z.string().optional(),
  head: z.string().min(1, 'Head branch é obrigatório'),
  base: z.string().optional().default('main'),
  draft: z.boolean().optional().default(false)
});

export const CreateRepoSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Nome contém caracteres inválidos'),
  description: z.string().max(200).optional(),
  private: z.boolean().optional().default(false),
  auto_init: z.boolean().optional().default(true),
  gitignore_template: z.string().optional(),
  license_template: z.string().optional()
});

const FileContentSchema = z.object({
  path: z.string().min(1, 'Path é obrigatório'),
  content: z.string(),
  encoding: z.enum(['utf-8', 'base64']).optional().default('utf-8')
});

export const PushFilesSchema = z.object({
  owner: z.string().min(1, 'Owner é obrigatório'),
  repo: z.string().min(1, 'Repo é obrigatório'),
  branch: z.string().optional().default('main'),
  files: z.array(FileContentSchema).min(1, 'Pelo menos um arquivo é necessário'),
  message: z.string().min(1, 'Commit message é obrigatório')
});

export const CommitSchema = z.object({
  owner: z.string().min(1, 'Owner é obrigatório'),
  repo: z.string().min(1, 'Repo é obrigatório'),
  message: z.string().min(1, 'Commit message é obrigatório'),
  files: z.array(z.object({
    path: z.string().min(1, 'Caminho do arquivo é obrigatório'),
    content: z.string()
  })).min(1, 'Pelo menos um arquivo é necessário'),
  branch: z.string().optional().default('main'),
  author: z.object({
    name: z.string(),
    email: z.string().email()
  }).optional()
});

// Git Local Schemas
export const GitStatusSchema = z.object({
  detailed: z.boolean().optional().default(false)
});

export const GitCommitSchema = z.object({
  message: z.string().min(1, 'Mensagem de commit é obrigatória'),
  addAll: z.boolean().optional().default(true),
  files: z.array(z.string()).optional()
});

export const GitPushSchema = z.object({
  branch: z.string().optional(),
  force: z.boolean().optional().default(false),
  upstream: z.boolean().optional().default(false)
});

export const GitPullSchema = z.object({
  branch: z.string().optional(),
  rebase: z.boolean().optional().default(false)
});

// ==================== Mem0 Memory Schemas ====================

export const AddMemorySchema = z.object({
  content: z.string().min(1, 'Conteúdo da memória é obrigatório'),
  user_id: z.string().min(1, 'ID do usuário é obrigatório'),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional()
});

export const SearchMemorySchema = z.object({
  query: z.string().min(1, 'Query de busca é obrigatória'),
  user_id: z.string().min(1, 'ID do usuário é obrigatório'),
  limit: z.number().int().positive().max(100).optional().default(10),
  filters: z.record(z.any()).optional()
});

export const ListMemoriesSchema = z.object({
  user_id: z.string().min(1, 'ID do usuário é obrigatório'),
  limit: z.number().int().positive().max(100).optional().default(50)
});

export const DeleteMemoriesSchema = z.object({
  user_id: z.string().min(1, 'ID do usuário é obrigatório'),
  memory_id: z.string().optional()
});


// ==================== Schema Map ====================

import { ToolName } from './types.js';

export const ToolSchemas = {
  [ToolName.PUPPETEER_NAVIGATE]: NavigateSchema,
  [ToolName.PUPPETEER_SCREENSHOT]: ScreenshotSchema,
  [ToolName.PUPPETEER_CLICK]: ClickSchema,
  [ToolName.PUPPETEER_TYPE]: TypeSchema,
  [ToolName.GITHUB_CREATE_ISSUE]: CreateIssueSchema,
  [ToolName.GITHUB_LIST_ISSUES]: ListIssuesSchema,
  [ToolName.GITHUB_CREATE_PR]: CreatePRSchema,
  [ToolName.GITHUB_CREATE_REPO]: CreateRepoSchema,
  [ToolName.GITHUB_PUSH_FILES]: PushFilesSchema,
  [ToolName.GITHUB_COMMIT]: CommitSchema,
  [ToolName.PUPPETEER_GET_CONTENT]: z.object({}),
  [ToolName.GIT_STATUS]: GitStatusSchema,
  [ToolName.GIT_COMMIT]: GitCommitSchema,
  [ToolName.GIT_PUSH]: GitPushSchema,
  [ToolName.GIT_PULL]: GitPullSchema,
  [ToolName.MEM0_ADD_MEMORY]: AddMemorySchema,
  [ToolName.MEM0_SEARCH_MEMORY]: SearchMemorySchema,
  [ToolName.MEM0_LIST_MEMORIES]: ListMemoriesSchema,
  [ToolName.MEM0_DELETE_MEMORIES]: DeleteMemoriesSchema
} as const;

// ==================== Validation Helper ====================

export function validateToolInput<T extends ToolName>(
  toolName: T,
  input: unknown
): z.infer<typeof ToolSchemas[T]> {
  const schema = ToolSchemas[toolName];
  
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Validação falhou:\n${messages.join('\n')}`);
    }
    throw error;
  }
}

// ==================== Type Inference Helpers ====================

export type InferToolInput<T extends ToolName> = z.infer<typeof ToolSchemas[T]>;