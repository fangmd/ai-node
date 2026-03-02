import { tool } from 'ai';
import { z } from 'zod';
import { pushToUser } from '../../sse/registry.js';

const sendMessageSchema = z.object({
  message: z.string().describe('Content to send to the user'),
  title: z.string().optional().describe('Optional title (e.g. notification title)'),
});

/**
 * Create send_message tool bound to a user. Agent can use it to push messages to the user via SSE.
 */
export function createSendMessageTool(userId: string | bigint) {
  const uid = String(userId);
  return tool({
    description:
      'Send a message or notification to the user in real time. Use when you need to notify the user, show progress, or push important information.',
    inputSchema: sendMessageSchema,
    execute: async ({ message, title }) => {
      await pushToUser(uid, 'user-message', { message, title: title ?? 'AI' });
      return { ok: true };
    },
  });
}
