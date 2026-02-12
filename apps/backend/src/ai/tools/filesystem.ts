import { tool } from 'ai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';
import { getWorkspaceDir } from '../../utils/workspace';

/** Resolve path under workspace; reject if it escapes workspace. */
function makeResolveInWorkspace(getBase: () => string) {
  return function resolveInWorkspace(relativePath: string): { resolved: string; error?: string } {
    const base = getBase();
    const resolved = path.resolve(base, relativePath || '.');
    if (!resolved.startsWith(base + path.sep) && resolved !== base) {
      return { resolved: '', error: 'Path must be inside workspace' };
    }
    return { resolved };
  };
}

const defaultResolve = makeResolveInWorkspace(getWorkspaceDir);

const MAX_READ_LEN = 100_000;

function createFileTools(resolveInWorkspace: (p: string) => { resolved: string; error?: string }) {
  return {
    read_file: tool({
      description: 'Read the contents of a file. Path is relative to your workspace (see system prompt).',
      inputSchema: z.object({
        path: z.string().describe('Path to the file to read (relative to workspace)'),
      }),
      execute: async ({ path: filePath }) => {
        const { resolved, error } = resolveInWorkspace(filePath);
        if (error) return `Error: ${error}`;
        try {
          const stat = await fs.stat(resolved);
          if (!stat.isFile()) return 'Error: Path is not a file';
          const content = await fs.readFile(resolved, 'utf-8');
          if (content.length > MAX_READ_LEN) {
            return content.slice(0, MAX_READ_LEN) + `\n... (truncated, ${content.length - MAX_READ_LEN} more chars)`;
          }
          return content;
        } catch (e) {
          const err = e as NodeJS.ErrnoException;
          return `Error: failed to read file: ${err.message ?? String(e)}`;
        }
      },
    }),
    write_file: tool({
      description: 'Write content to a file. Creates parent directories if needed. Path is relative to workspace.',
      inputSchema: z.object({
        path: z.string().describe('Path to the file to write (relative to workspace)'),
        content: z.string().describe('Content to write to the file'),
      }),
      execute: async ({ path: filePath, content }) => {
        const { resolved, error } = resolveInWorkspace(filePath);
        if (error) return `Error: ${error}`;
        try {
          await fs.mkdir(path.dirname(resolved), { recursive: true, mode: 0o755 });
          await fs.writeFile(resolved, content, { mode: 0o644 });
          return 'File written successfully';
        } catch (e) {
          const err = e as NodeJS.ErrnoException;
          return `Error: failed to write file: ${err.message ?? String(e)}`;
        }
      },
    }),
    list_dir: tool({
      description: 'List files and directories in a path. Path is relative to workspace (default: .).',
      inputSchema: z.object({
        path: z.string().optional().describe('Path to list (relative to workspace). Defaults to workspace root.'),
      }),
      execute: async ({ path: dirPath }) => {
        const { resolved, error } = resolveInWorkspace(dirPath ?? '.');
        if (error) return `Error: ${error}`;
        try {
          const stat = await fs.stat(resolved);
          if (!stat.isDirectory()) return 'Error: Path is not a directory';
          const entries = await fs.readdir(resolved, { withFileTypes: true });
          const lines = entries.map((e) => (e.isDirectory() ? `DIR:  ${e.name}` : `FILE: ${e.name}`));
          return lines.join('\n') || '(empty)';
        } catch (e) {
          const err = e as NodeJS.ErrnoException;
          return `Error: failed to read directory: ${err.message ?? String(e)}`;
        }
      },
    }),
  };
}

/** Tools scoped to a user workspace (for /chat). Use createFilesystemTools(getBase) with getUserWorkspaceDir(userId). */
export function createFilesystemTools(getBase: () => string) {
  return createFileTools(makeResolveInWorkspace(getBase));
}

export const read_file = tool({
  description: 'Read the contents of a file. Path is relative to workspace (apps/workspace).',
  inputSchema: z.object({
    path: z.string().describe('Path to the file to read (relative to workspace)'),
  }),
  execute: async ({ path: filePath }) => {
    const { resolved, error } = defaultResolve(filePath);
    if (error) return `Error: ${error}`;
    try {
      const stat = await fs.stat(resolved);
      if (!stat.isFile()) {
        return 'Error: Path is not a file';
      }
      const content = await fs.readFile(resolved, 'utf-8');
      if (content.length > MAX_READ_LEN) {
        return (
          content.slice(0, MAX_READ_LEN) +
          `\n... (truncated, ${content.length - MAX_READ_LEN} more chars)`
        );
      }
      return content;
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      return `Error: failed to read file: ${err.message ?? String(e)}`;
    }
  },
});

export const write_file = tool({
  description:
    'Write content to a file. Creates parent directories if needed. Path is relative to workspace.',
  inputSchema: z.object({
    path: z.string().describe('Path to the file to write (relative to workspace)'),
    content: z.string().describe('Content to write to the file'),
  }),
  execute: async ({ path: filePath, content }) => {
    const { resolved, error } = defaultResolve(filePath);
    if (error) return `Error: ${error}`;
    try {
      await fs.mkdir(path.dirname(resolved), { recursive: true, mode: 0o755 });
      await fs.writeFile(resolved, content, { mode: 0o644 });
      return 'File written successfully';
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      return `Error: failed to write file: ${err.message ?? String(e)}`;
    }
  },
});

export const list_dir = tool({
  description: 'List files and directories in a path. Path is relative to workspace (default: .).',
  inputSchema: z.object({
    path: z
      .string()
      .optional()
      .describe('Path to list (relative to workspace). Defaults to workspace root.'),
  }),
  execute: async ({ path: dirPath }) => {
    const { resolved, error } = defaultResolve(dirPath ?? '.');
    if (error) return `Error: ${error}`;
    try {
      const stat = await fs.stat(resolved);
      if (!stat.isDirectory()) {
        return 'Error: Path is not a directory';
      }
      const entries = await fs.readdir(resolved, { withFileTypes: true });
      const lines = entries.map((e) => (e.isDirectory() ? `DIR:  ${e.name}` : `FILE: ${e.name}`));
      return lines.join('\n') || '(empty)';
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      return `Error: failed to read directory: ${err.message ?? String(e)}`;
    }
  },
});
