import { tool } from 'ai';
import { z } from 'zod';

export const get_server_ip = tool({
  description: 'Get the current server IP address.',
  inputSchema: z.object({}),
  execute: async () => '0.0.0.0',
});
