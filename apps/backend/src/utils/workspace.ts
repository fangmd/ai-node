import * as path from 'path';

/**
 * Workspace root: apps/workspace (sibling of backend).
 * Used as default cwd for shell and base for filesystem tools.
 */
export function getWorkspaceDir(): string {
  return path.resolve(process.cwd(), '..', 'workspace');
}
