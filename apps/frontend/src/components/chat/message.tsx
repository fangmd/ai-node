import { useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Streamdown } from 'streamdown';
import type { ActiveArtifact } from './artifacts-view';
import { HtmlArtifactCard } from './html-artifact-card';

export interface MessagePart {
  type: string;
  text?: string;
  [k: string]: unknown;
}

export interface MessageMetadata {
  totalTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface ChatMessage {
  id: string;
  role: string;
  parts: MessagePart[];
  metadata?: MessageMetadata;
}

export interface MessageArtifactCallbacks {
  registerHtmlArtifact: (messageId: string, index: number, html: string) => void;
  onOpenArtifact: (artifact: ActiveArtifact) => void;
}

function isHtmlCodeNode(node: unknown): boolean {
  const el = node as { properties?: { className?: string | string[] } } | undefined;
  const cn = el?.properties?.className;
  if (cn == null) return false;
  return Array.isArray(cn) ? cn.includes('language-html') : cn === 'language-html';
}

function createHtmlCodeBlockCard(
  messageId: string,
  registerHtmlArtifact: (messageId: string, index: number, html: string) => void,
  getNextHtmlIndex: () => number,
  onOpenArtifact: (artifact: ActiveArtifact) => void
) {
  return function HtmlCodeBlockCard({ node, children, ...rest }: React.ComponentProps<'code'> & { node?: unknown }) {
    if (!isHtmlCodeNode(node)) {
      return <code {...rest}>{children}</code>;
    }
    const htmlContent =
      typeof children === 'string'
        ? children
        : Array.isArray(children)
          ? (children as string[]).join('')
          : String(children ?? '');
    const index = getNextHtmlIndex();
    registerHtmlArtifact(messageId, index, htmlContent);

    return <HtmlArtifactCard messageId={messageId} index={index} onOpen={onOpenArtifact} />;
  };
}

function MessageParts({
  parts,
  isStreaming,
  messageId,
  artifactCallbacks,
}: {
  parts: MessagePart[];
  isStreaming?: boolean;
  messageId: string;
  artifactCallbacks: MessageArtifactCallbacks;
}) {
  const getNextHtmlIndexRef = useRef(0);
  getNextHtmlIndexRef.current = 0;
  const getNextHtmlIndex = () => getNextHtmlIndexRef.current++;

  const streamdownComponents = {
    code: createHtmlCodeBlockCard(
      messageId,
      artifactCallbacks.registerHtmlArtifact,
      getNextHtmlIndex,
      artifactCallbacks.onOpenArtifact
    ),
  };

  return (
    <>
      {parts.map((part, i) => {
        if (part.type === 'text' && typeof part.text === 'string') {
          return (
            <Streamdown key={i} isAnimating={isStreaming ?? false} components={streamdownComponents}>
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
        if (part.type === 'tool-read_file' || part.type === 'tool-write_file' || part.type === 'tool-list_dir') {
          const p = part as unknown as {
            state: string;
            toolCallId: string;
            input?: { path?: string; content?: string };
            output?: string;
          };
          const isLoading =
            p.state === 'input-streaming' ||
            p.state === 'input-available' ||
            (p.state !== 'output-available' && p.state !== 'result-available');
          const label =
            part.type === 'tool-read_file' ? '读取文件' : part.type === 'tool-write_file' ? '写入文件' : '列出目录';
          const pathStr = p.input?.path ?? '';
          if (isLoading) {
            return (
              <div key={p.toolCallId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-1">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>{pathStr ? `${label}: ${pathStr}` : `${label}…`}</span>
              </div>
            );
          }
          if (p.state === 'output-available' || p.state === 'result-available') {
            const out = typeof p.output === 'string' ? p.output : '';
            return (
              <div key={p.toolCallId} className="mt-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {label}
                  {pathStr ? (
                    <>
                      : <code className="break-all">{pathStr}</code>
                    </>
                  ) : null}
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

export function Message({
  message,
  isStreaming,
  artifactCallbacks,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
  artifactCallbacks: MessageArtifactCallbacks;
}) {
  const isUser = message.role === 'user';
  const hasTokenUsage = !isUser && message.metadata?.totalTokens != null;

  return (
    <div className={isUser ? 'text-right' : 'text-left'}>
      <span className="font-medium">{isUser ? 'You' : 'Assistant'}: </span>
      <MessageParts
        parts={message.parts}
        isStreaming={isStreaming}
        messageId={message.id}
        artifactCallbacks={artifactCallbacks}
      />
      {hasTokenUsage && (
        <div className="mt-1 text-xs text-muted-foreground">
          Token 消耗: {message.metadata!.totalTokens} (输入: {message.metadata!.inputTokens ?? 0}, 输出:{' '}
          {message.metadata!.outputTokens ?? 0})
        </div>
      )}
    </div>
  );
}
