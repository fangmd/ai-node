import * as fs from 'fs/promises';
import * as path from 'path';
import { getUserWorkspaceDir } from '../utils/workspace.js';

const BOOTSTRAP_FILES = ['AGENTS.md', 'SOUL.md', 'USER.md', 'IDENTITY.md'] as const;
const MEMORY_FILE = 'memory/MEMORY.md';
const MEMORY_MAX_CHARS = 4000;

/** Tool-like shape: has optional description (AI SDK tool objects). */
type ToolLike = { description?: string };

/**
 * Identity block similar to picoclaw getIdentity: time, runtime, workspace paths, important rules.
 */
function getIdentityBlock(workspacePath: string): string {
  const now = new Date().toLocaleString('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long',
  }).replace(/,/g, '');
  const runtime = `${process.platform} ${process.arch}, Node ${process.version}`;
  const memoryPath = path.join(workspacePath, 'memory', 'MEMORY.md');
  const skillsPath = path.join(workspacePath, 'skills');

  return `# Context

You are Panda, a helpful AI assistant.

## Current Time
${now}

## Runtime
${runtime}

## Workspace
Your workspace is at: ${workspacePath}
- Memory: ${memoryPath}
- Skills: ${skillsPath}/{skill-name}/SKILL.md

## Important Rules

1. **ALWAYS use tools** - When you need to perform an action (execute commands, read/write files, etc.), you MUST call the appropriate tool. Do NOT just say you'll do it or pretend to do it.

2. **Be helpful and accurate** - When using tools, briefly explain what you're doing.

3. **Memory** - When remembering something, write to ${memoryPath}
`;
}

/**
 * Build "Available Tools" section from a tools record (e.g. provider.tools).
 * Similar to picoclaw buildToolsSection.
 */
export function buildToolsSection(tools: Record<string, ToolLike>): string {
  const entries = Object.entries(tools).filter(([, t]) => t?.description);
  if (entries.length === 0) return '';

  const lines = [
    '## Available Tools',
    '',
    '**CRITICAL**: You MUST use tools to perform actions. Do NOT pretend to execute commands or edit files.',
    '',
    'You have access to the following tools:',
    '',
    ...entries.map(([name, t]) => `- **${name}**: ${t.description ?? ''}`),
  ];
  return lines.join('\n');
}

async function readFileIfExists(filePath: string): Promise<string> {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return data.trim();
  } catch {
    return '';
  }
}

/**
 * Build system prompt from user workspace: identity block + bootstrap files + memory excerpt.
 * Used when starting a chat so the model gets user-specific instructions.
 */
export async function buildSystemPrompt(userId: string | bigint): Promise<string> {
  const userDir = getUserWorkspaceDir(userId);
  const parts: string[] = [getIdentityBlock(userDir)];

  for (const filename of BOOTSTRAP_FILES) {
    const content = await readFileIfExists(path.join(userDir, filename));
    if (content) parts.push(`## ${filename}\n\n${content}`);
  }

  const memoryPath = path.join(userDir, MEMORY_FILE);
  const memoryContent = await readFileIfExists(memoryPath);
  if (memoryContent) {
    const excerpt =
      memoryContent.length <= MEMORY_MAX_CHARS
        ? memoryContent
        : memoryContent.slice(0, MEMORY_MAX_CHARS) + '\n\n...(truncated)';
    parts.push('# Memory\n\n' + excerpt);
  }

  return parts.join('\n\n---\n\n');
}
