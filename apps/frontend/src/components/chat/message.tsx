import { Loader2 } from 'lucide-react';
import { Streamdown } from 'streamdown';

export interface MessagePart {
  type: string;
  text?: string;
  [k: string]: unknown;
}

export interface ChatMessage {
  id: string;
  role: string;
  parts: MessagePart[];
}

function MessageParts({ parts, isStreaming }: { parts: MessagePart[]; isStreaming?: boolean }) {
  return (
    <>
      {parts.map((part, i) => {
        if (part.type === 'text' && typeof part.text === 'string') {
          return (
            <Streamdown key={i} isAnimating={isStreaming ?? false}>
              {part.text}
            </Streamdown>
          );
        }
        if (part.type === 'tool-web_search') {
          const p = part as unknown as {
            state: string;
            toolCallId: string;
            output?: {
              action?: { query?: string };
              sources?: Array<{ type: string; url?: string; name?: string }>;
            };
          };
          const isSearching =
            p.state === 'input-streaming' ||
            p.state === 'input-available' ||
            (p.state !== 'output-available' && p.state !== 'result-available');
          if (isSearching) {
            return (
              <div key={p.toolCallId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-1">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>正在搜索…</span>
              </div>
            );
          }
          if (p.state === 'output-available' && p.output?.sources?.length) {
            return (
              <div key={p.toolCallId} className="mt-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">引用来源</p>
                <ul className="list-disc list-inside space-y-0.5 text-sm">
                  {p.output.sources.map((s, j) =>
                    s.type === 'url' && s.url ? (
                      <li key={j}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline break-all"
                        >
                          {s.url}
                        </a>
                      </li>
                    ) : (
                      <li key={j}>{s.type === 'api' ? s.name : null}</li>
                    )
                  )}
                </ul>
              </div>
            );
          }
          return null;
        }
        if (part.type === 'tool-get_server_ip') {
          const p = part as unknown as {
            state: string;
            toolCallId: string;
            output?: string;
          };
          const hasResult = p.state === 'output-available' || p.state === 'result-available';
          const ip =
            typeof p.output === 'string'
              ? p.output
              : p.output != null && typeof (p.output as { result?: string })?.result === 'string'
                ? (p.output as { result: string }).result
                : null;
          if (hasResult && ip != null) {
            return (
              <div key={p.toolCallId} className="mt-1 text-sm text-muted-foreground">
                服务端 IP: <span className="font-mono">{ip}</span>
              </div>
            );
          }
          return null;
        }
        if (part.type === 'tool-load_skill') {
          const p = part as unknown as {
            state: string;
            toolCallId: string;
            input?: { name?: string };
            output?: string;
          };
          const isLoading =
            p.state === 'input-streaming' ||
            p.state === 'input-available' ||
            (p.state !== 'output-available' && p.state !== 'result-available');
          const skillName = p.input?.name;
          if (isLoading) {
            return (
              <div key={p.toolCallId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-1">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>{skillName ? `正在加载技能「${skillName}」…` : '正在加载技能…'}</span>
              </div>
            );
          }
          if (p.state === 'output-available' || p.state === 'result-available') {
            return (
              <div key={p.toolCallId} className="mt-1 text-sm text-muted-foreground">
                已加载技能: <span className="font-medium">{skillName ?? '—'}</span>
              </div>
            );
          }
          return null;
        }
        if (part.type === 'tool-shell') {
          const p = part as unknown as {
            state: string;
            toolCallId: string;
            input?: { command?: string; working_dir?: string };
            output?: string;
          };
          const isLoading =
            p.state === 'input-streaming' ||
            p.state === 'input-available' ||
            (p.state !== 'output-available' && p.state !== 'result-available');
          const cmd = p.input?.command ?? '';
          if (isLoading) {
            return (
              <div key={p.toolCallId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-1">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>{cmd ? `正在执行: ${cmd}` : '正在执行命令…'}</span>
              </div>
            );
          }
          if (p.state === 'output-available' || p.state === 'result-available') {
            const out = typeof p.output === 'string' ? p.output : '';
            return (
              <div key={p.toolCallId} className="mt-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  执行: <code className="break-all">{cmd || '—'}</code>
                </p>
                {out ? (
                  <pre className="text-xs bg-muted/50 rounded p-2 max-h-48 overflow-auto whitespace-pre-wrap wrap-break-word">
                    {out}
                  </pre>
                ) : null}
              </div>
            );
          }
          return null;
        }
        return null;
      })}
    </>
  );
}

export function Message({ message, isStreaming }: { message: ChatMessage; isStreaming?: boolean }) {
  const isUser = message.role === 'user';
  return (
    <div className={isUser ? 'text-right' : 'text-left'}>
      <span className="font-medium">{isUser ? 'You' : 'Assistant'}: </span>
      <MessageParts parts={message.parts} isStreaming={isStreaming} />
    </div>
  );
}
