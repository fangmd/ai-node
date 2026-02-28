import { createMCPClient, type MCPClient } from '@ai-sdk/mcp';
import { logger } from '../common/logger.js';

export type MCPServerConfig = {
  name: string;
  url: string;
  type?: 'http' | 'sse';
  headers?: Record<string, string>;
};

const DEFAULT_MCP_SERVERS: MCPServerConfig[] = [{ name: 'time-mcp', url: 'http://localhost:10010/mcp', type: 'http' }];

export function getDefaultMCPServers(): MCPServerConfig[] {
  return [...DEFAULT_MCP_SERVERS];
}

export type MCPClientsAndTools = {
  tools: Record<string, unknown>;
  clients: MCPClient[];
};

/**
 * Create MCP clients for each server and collect tools. Failed servers are skipped and logged.
 */
export async function createMCPClientsAndTools(servers: MCPServerConfig[]): Promise<MCPClientsAndTools> {
  const clients: MCPClient[] = [];
  const tools: Record<string, unknown> = {};

  for (const server of servers) {
    try {
      const client = await createMCPClient({
        transport: {
          type: server.type ?? 'http',
          url: server.url,
          ...(server.headers && { headers: server.headers }),
        },
        name: server.name,
      });
      clients.push(client);
      const serverTools = await client.tools();
      Object.assign(tools, serverTools);
    } catch (err) {
      logger.warn({ err, mcpServer: server.name, url: server.url }, 'MCP server connection failed, skipping');
    }
  }

  return { tools, clients };
}

export async function closeMCPClients(clients: MCPClient[]): Promise<void> {
  await Promise.all(clients.map((c) => c.close().catch(() => {})));
}
