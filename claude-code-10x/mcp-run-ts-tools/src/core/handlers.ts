/**
 * Tool handlers extracted from main index
 */

import puppeteer, { Browser, Page } from 'puppeteer';
// Removido: import { Octokit } from '@octokit/rest';
import {
  NavigateParams,
  ScreenshotParams,
  ClickParams,
  TypeParams,
  CreateIssueParams,
  ListIssuesParams,
  CreatePRParams,
  CreateRepoParams,
  PushFilesParams,
  ServerState,
  MCPError,
  ErrorCode
} from './types.js';
import { withRetry, withTimeout, successResponse, SimpleCache } from '../utils.js';

// ==================== Configuration ====================

const CONFIG = {
  puppeteer: {
    headless: false,
    defaultTimeout: 30000,
    viewportWidth: 1280,
    viewportHeight: 800
  },
  cache: {
    ttl: 300000 // 5 minutes
  }
} as const;

// ==================== State ====================

export const state: ServerState = {
  browser: undefined,
  page: undefined,
  octokit: undefined,
  lastActivity: Date.now(),
  requestCount: 0
};

const cache = new SimpleCache<any>(CONFIG.cache.ttl);

// ==================== Helper Functions ====================

export async function ensureBrowser(): Promise<{ browser: Browser; page: Page }> {
  try {
    if (!state.browser || !state.browser.isConnected()) {
      state.browser = await puppeteer.launch({
        headless: CONFIG.puppeteer.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      state.page = await state.browser.newPage();
      
      await state.page.setViewport({
        width: CONFIG.puppeteer.viewportWidth,
        height: CONFIG.puppeteer.viewportHeight
      });
      
      state.page.setDefaultTimeout(CONFIG.puppeteer.defaultTimeout);
    }
    
    if (!state.page || state.page.isClosed()) {
      state.page = await state.browser.newPage();
    }
    
    state.lastActivity = Date.now();
    return { browser: state.browser, page: state.page };
  } catch (error) {
    throw new MCPError(
      ErrorCode.BROWSER_NOT_INITIALIZED,
      'Failed to initialize browser',
      error
    );
  }
}

export function ensureGitHub(): Octokit {
  if (!state.octokit) {
    const token = process.env.GITHUB_TOKEN;
    
    if (!token) {
      throw new MCPError(
        ErrorCode.GITHUB_NOT_INITIALIZED,
        'GitHub token not found. Please set GITHUB_TOKEN environment variable.'
      );
    }
    
    state.octokit = new Octokit({
      auth: token,
      baseUrl: process.env.GITHUB_API_URL,
      userAgent: `DiegoTools/2.0.0`
    });
  }
  
  state.lastActivity = Date.now();
  return state.octokit;
}

// ==================== Puppeteer Handlers ====================

export async function handleNavigate(params: NavigateParams) {
  const { page } = await ensureBrowser();
  
  await withTimeout(
    async () => {
      await page.goto(params.url, { waitUntil: 'networkidle2' });
    },
    CONFIG.puppeteer.defaultTimeout,
    `Navigation to ${params.url} timed out`
  );
  
  return successResponse(null, `Navigated to ${params.url}`);
}

export async function handleScreenshot(params: ScreenshotParams) {
  const { page } = await ensureBrowser();
  
  let path = params.path;
  if (!path.match(/\.(png|jpg|jpeg|webp)$/i)) {
    path = `${path}.png`;
  }
  
  await page.screenshot({
    path: path as any,
    fullPage: params.fullPage
  });
  
  return successResponse({ path }, `Screenshot saved to ${path}`);
}

export async function handleClick(params: ClickParams) {
  const { page } = await ensureBrowser();
  
  await withTimeout(
    async () => {
      await page.waitForSelector(params.selector, { visible: true });
      await page.click(params.selector);
    },
    5000,
    `Element ${params.selector} not found or not clickable`
  );
  
  return successResponse(null, `Clicked on element: ${params.selector}`);
}

export async function handleType(params: TypeParams) {
  const { page } = await ensureBrowser();
  
  await withTimeout(
    async () => {
      await page.waitForSelector(params.selector, { visible: true });
      await page.type(params.selector, params.text);
    },
    5000,
    `Element ${params.selector} not found`
  );
  
  return successResponse(null, `Typed text into element: ${params.selector}`);
}

export async function handleGetContent() {
  const { page } = await ensureBrowser();
  const content = await page.content();
  return successResponse(content);
}

// ==================== GitHub Handlers ====================

export async function handleCreateIssue(params: CreateIssueParams) {
  const github = ensureGitHub();
  
  const response = await withRetry(
    async () => github.issues.create({
      owner: params.owner,
      repo: params.repo,
      title: params.title,
      body: params.body,
      labels: params.labels,
      assignees: params.assignees
    }),
    { retries: 2, delay: 1000 }
  );
  
  return successResponse(response.data, `Issue #${response.data.number} created successfully`);
}

export async function handleListIssues(params: ListIssuesParams) {
  const github = ensureGitHub();
  
  const cacheKey = `issues:${params.owner}/${params.repo}:${params.state}`;
  
  const response = await cache.getOrCompute(
    cacheKey,
    async () => {
      return await github.issues.listForRepo({
        owner: params.owner,
        repo: params.repo,
        state: params.state as any,
        labels: params.labels?.join(','),
        sort: params.sort,
        direction: params.direction,
        per_page: params.per_page,
        page: params.page
      });
    }
  );
  
  return successResponse(response.data, `Found ${response.data.length} issues`);
}

export async function handleCreatePR(params: CreatePRParams) {
  const github = ensureGitHub();
  
  const response = await withRetry(
    async () => github.pulls.create({
      owner: params.owner,
      repo: params.repo,
      title: params.title,
      body: params.body,
      head: params.head,
      base: params.base || 'main',
      draft: params.draft
    }),
    { retries: 2, delay: 1000 }
  );
  
  return successResponse(response.data, `Pull request #${response.data.number} created successfully`);
}

export async function handleCreateRepo(params: CreateRepoParams) {
  const github = ensureGitHub();
  
  const response = await github.repos.createForAuthenticatedUser({
    name: params.name,
    description: params.description,
    private: params.private,
    auto_init: params.auto_init,
    gitignore_template: params.gitignore_template,
    license_template: params.license_template
  });
  
  return successResponse(response.data, `Repository ${response.data.full_name} created successfully`);
}

export async function handlePushFiles(params: PushFilesParams) {
  const github = ensureGitHub();
  const { owner, repo, branch = 'main', files, message } = params;
  
  const { data: ref } = await github.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`
  });
  const latestCommitSha = ref.object.sha;
  
  const { data: commit } = await github.git.getCommit({
    owner,
    repo,
    commit_sha: latestCommitSha
  });
  const treeSha = commit.tree.sha;
  
  const blobs = await Promise.all(
    files.map(async (file) => {
      const content = file.encoding === 'base64' 
        ? file.content 
        : Buffer.from(file.content).toString('base64');
        
      const { data: blob } = await github.git.createBlob({
        owner,
        repo,
        content,
        encoding: 'base64'
      });
      
      return {
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha
      };
    })
  );
  
  const { data: newTree } = await github.git.createTree({
    owner,
    repo,
    tree: blobs,
    base_tree: treeSha
  });
  
  const { data: newCommit } = await github.git.createCommit({
    owner,
    repo,
    message,
    tree: newTree.sha,
    parents: [latestCommitSha]
  });
  
  await github.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.sha
  });
  
  return successResponse(
    { commit: newCommit, files: files.length },
    `Pushed ${files.length} files to ${owner}/${repo}@${branch}`
  );
}