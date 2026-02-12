import { read_file, write_file, list_dir } from './filesystem';
import { get_server_ip } from './get-server-ip';
import { load_skill } from './load-skill';
import { shell } from './shell';

export const localTools = {
  get_server_ip,
  load_skill,
  shell,
  read_file,
  write_file,
  list_dir,
};
