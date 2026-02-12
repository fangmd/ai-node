import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Workspace root: apps/workspace (sibling of backend).
 * Used when no user context (e.g. scripts).
 */
export function getWorkspaceDir(): string {
  return path.resolve(process.cwd(), '..', 'workspace');
}

/**
 * User-specific workspace path: workspace/<userId>.
 * Folder name is the user id (string).
 */
export function getUserWorkspaceDir(userId: string | bigint): string {
  const root = getWorkspaceDir();
  return path.join(root, String(userId));
}

const WORKSPACE_TEMPLATES: Record<string, string> = {
  'AGENTS.md': `# Agent Instructions

You are a helpful AI assistant. Be concise, accurate, and friendly.

## Guidelines

- Always explain what you're doing before taking actions
- Ask for clarification when request is ambiguous
- Use tools to help accomplish tasks
- Remember important information in your memory files
- Be proactive and helpful
- Learn from user feedback
`,
  'SOUL.md': `# Soul

Personality and values of your AI assistant.

## Personality

- Helpful and friendly
- Concise and to the point
- Curious and eager to learn
- Honest and transparent

## Values

- Accuracy over speed
- User privacy and safety
- Transparency in actions
- Continuous improvement
`,
  'USER.md': `# User

Information about user goes here.

## Preferences

- Communication style: (casual/formal)
- Timezone: (your timezone)
- Language: (your preferred language)

## Personal Information

- Name: (optional)
- Location: (optional)
- Occupation: (optional)

## Learning Goals

- What the user wants to learn from AI
- Preferred interaction style
- Areas of interest
`,
  'IDENTITY.md': `# Identity

## Name
AI Assistant

## Description
Personal AI assistant workspace.

## Purpose

- Provide intelligent assistance
- Support file and shell operations
- Remember context and preferences
- Help accomplish tasks effectively

## Capabilities

- File system operations (read, write, edit)
- Shell command execution
- Memory and context management
`,
};

const MEMORY_TEMPLATE = `# Long-term Memory

This file stores important information that should persist across sessions.

## User Information

(Important facts about user)

## Preferences

(User preferences learned over time)

## Important Notes

(Things to remember)

## Configuration

- Model preferences
- Settings
`;

/**
 * Create user workspace directory, subdirs, and template files.
 * Idempotent: existing files are not overwritten.
 */
export async function createUserWorkspace(userId: string | bigint): Promise<void> {
  const userDir = getUserWorkspaceDir(userId);
  await fs.mkdir(userDir, { recursive: true });
  const memoryDir = path.join(userDir, 'memory');
  await fs.mkdir(memoryDir, { recursive: true });
  await fs.mkdir(path.join(userDir, 'skills'), { recursive: true });

  for (const [filename, content] of Object.entries(WORKSPACE_TEMPLATES)) {
    const filePath = path.join(userDir, filename);
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, content, 'utf8');
    }
  }

  const memoryFile = path.join(memoryDir, 'MEMORY.md');
  try {
    await fs.access(memoryFile);
  } catch {
    await fs.writeFile(memoryFile, MEMORY_TEMPLATE, 'utf8');
  }
}
