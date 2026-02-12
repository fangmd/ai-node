import { tool } from 'ai';
import { exec } from 'child_process';
import * as path from 'path';
import { z } from 'zod';
import { getWorkspaceDir } from '../../utils/workspace';

function execShell(
  command: string,
  opts: { cwd: string; timeout: number; maxBuffer: number }
): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut?: boolean;
}> {
  return new Promise((resolve) => {
    exec(
      command,
      {
        cwd: opts.cwd,
        timeout: opts.timeout,
        maxBuffer: opts.maxBuffer,
        shell: '/bin/sh',
      },
      (err, stdout, stderr) => {
        const execErr = err as { killed?: boolean; code?: number } | null;
        if (execErr?.killed) {
          resolve({
            stdout: '',
            stderr: '',
            exitCode: null,
            timedOut: true,
          });
          return;
        }
        const code = execErr && 'code' in execErr ? execErr.code ?? null : null;
        resolve({
          stdout: stdout ?? '',
          stderr: stderr ?? '',
          exitCode: typeof code === 'number' ? code : null,
        });
      }
    );
  });
}

const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_LEN = 10_000;

const DENY_PATTERNS = [
  /\brm\s+-[rf]{1,2}\b/,
  /\bdel\s+\/[fq]\b/,
  /\brmdir\s+\/s\b/,
  /\b(format|mkfs|diskpart)\b\s/,
  /\bdd\s+if=/,
  />\s*\/dev\/sd[a-z]\b/,
  /\b(shutdown|reboot|poweroff)\b/,
  /:\(\)\s*\{.*\};\s*:/,
];

function guardCommand(command: string): string | null {
  const cmd = command.trim();
  const lower = cmd.toLowerCase();
  for (const pattern of DENY_PATTERNS) {
    if (pattern.test(lower)) {
      return 'Command blocked by safety guard (dangerous pattern detected)';
    }
  }
  return null;
}

/** Shell tool scoped to a user workspace (for /chat). */
export function createShellTool(getDefaultCwd: () => string) {
  return tool({
    description:
      'Execute a shell command and return its output. Use with caution. Avoid destructive or system-wide commands.',
    inputSchema: z.object({
      command: z.string().describe('The shell command to execute'),
      working_dir: z
        .string()
        .optional()
        .describe('Optional working directory. Defaults to your workspace (see system prompt).'),
    }),
    execute: async ({ command, working_dir }) => {
      const guardError = guardCommand(command);
      if (guardError) return `Error: ${guardError}`;
      const cwd = working_dir?.trim() || getDefaultCwd();
      const resolvedCwd = path.isAbsolute(cwd) ? cwd : path.resolve(process.cwd(), cwd);
      const result = await execShell(command, {
        cwd: resolvedCwd,
        maxBuffer: 1024 * 1024,
        timeout: DEFAULT_TIMEOUT_MS,
      });
      if (result.timedOut) return `Error: Command timed out after ${DEFAULT_TIMEOUT_MS / 1000}s`;
      let output = result.stdout || '';
      if (result.stderr?.trim()) output += (output ? '\n' : '') + 'STDERR:\n' + result.stderr.trim();
      if (!output) output = '(no output)';
      if (result.exitCode != null && result.exitCode !== 0) output += `\nExit code: ${result.exitCode}`;
      if (output.length > MAX_OUTPUT_LEN) {
        output = output.slice(0, MAX_OUTPUT_LEN) + `\n... (truncated, ${output.length - MAX_OUTPUT_LEN} more chars)`;
      }
      return output;
    },
  });
}

export const shell = tool({
  description:
    'Execute a shell command and return its output. Use with caution. Avoid destructive or system-wide commands.',
  inputSchema: z.object({
    command: z.string().describe('The shell command to execute'),
    working_dir: z
      .string()
      .optional()
      .describe(
        'Optional working directory. Defaults to apps/workspace (project workspace dir)'
      ),
  }),
  execute: async ({ command, working_dir }) => {
    const guardError = guardCommand(command);
    if (guardError) {
      return `Error: ${guardError}`;
    }

    const cwd = working_dir?.trim() || getWorkspaceDir();

    const resolvedCwd = path.isAbsolute(cwd) ? cwd : path.resolve(process.cwd(), cwd);
    const result = await execShell(command, {
      cwd: resolvedCwd,
      maxBuffer: 1024 * 1024,
      timeout: DEFAULT_TIMEOUT_MS,
    });

    if (result.timedOut) {
      return `Error: Command timed out after ${DEFAULT_TIMEOUT_MS / 1000}s`;
    }

    let output = result.stdout || '';
    if (result.stderr?.trim()) {
      output += (output ? '\n' : '') + 'STDERR:\n' + result.stderr.trim();
    }
    if (!output) {
      output = '(no output)';
    }
    if (result.exitCode != null && result.exitCode !== 0) {
      output += `\nExit code: ${result.exitCode}`;
    }
    if (output.length > MAX_OUTPUT_LEN) {
      output =
        output.slice(0, MAX_OUTPUT_LEN) +
        `\n... (truncated, ${output.length - MAX_OUTPUT_LEN} more chars)`;
    }
    return output;
  },
});
