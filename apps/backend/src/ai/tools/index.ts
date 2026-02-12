import { getUserWorkspaceDir } from '../../utils/workspace.js';
import { createFilesystemTools, read_file, write_file, list_dir } from './filesystem.js';
import { get_server_ip } from './get-server-ip.js';
import { load_skill } from './load-skill.js';
import { createShellTool, shell } from './shell.js';

export const localTools = {
  get_server_ip,
  load_skill,
  shell,
  read_file,
  write_file,
  list_dir,
};

/** Tools bound to workspace/<userId> so file/shell ops use user dir (e.g. memory/MEMORY.md). */
export function createBoundTools(userId: string | bigint) {
  const getBase = () => getUserWorkspaceDir(userId);
  return {
    ...localTools,
    ...createFilesystemTools(getBase),
    shell: createShellTool(getBase),
  };
}
