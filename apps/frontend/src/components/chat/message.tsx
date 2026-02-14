import { useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Streamdown } from 'streamdown';
import type { ActiveArtifact } from './artifacts-view';
import { HtmlArtifactCard } from './html-artifact-card';
import { JsonRenderBlock, INVALID_SPEC_MESSAGE } from './json-render-block';
import { DATA_SPEC_PART_TYPE, isValidSpec, type Spec } from '@ai-node/json-render';
import { useJsonRenderMessage } from '@json-render/react';

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

function getCodeBlockLanguage(node: unknown): string | null {
  const el = node as { properties?: { className?: string | string[] } } | undefined;
  const cn = el?.properties?.className;
  if (cn == null) return null;
  const classes = Array.isArray(cn) ? cn : [cn];
  const lang = classes.find((c) => typeof c === 'string' && c.startsWith('language-'));
  return lang != null ? (lang as string).slice('language-'.length) : null;
}

function parseJsonRenderSpec(raw: string): { spec: Spec | null; parseError?: string } {
  try {
    const parsed = JSON.parse(raw.trim()) as unknown;
    if (isValidSpec(parsed)) return { spec: parsed };
    return { spec: null, parseError: '缺少 root 或 elements' };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { spec: null, parseError: message };
  }
}

function createCodeBlockComponent(
  messageId: string,
  registerHtmlArtifact: (messageId: string, index: number, html: string) => void,
  getNextHtmlIndex: () => number,
  onOpenArtifact: (artifact: ActiveArtifact) => void
) {
  return function CodeBlockComponent({ node, children, ...rest }: React.ComponentProps<'code'> & { node?: unknown }) {
    const lang = getCodeBlockLanguage(node);
    const content =
      typeof children === 'string'
        ? children
        : Array.isArray(children)
          ? (children as string[]).join('')
          : String(children ?? '');

    if (lang === 'json-render') {
      const { spec, parseError } = parseJsonRenderSpec(content);
      if (spec) return <JsonRenderBlock spec={spec} />;
      return (
        <pre className="rounded border border-dashed border-muted-foreground/30 bg-muted/30 px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
          {INVALID_SPEC_MESSAGE}
          {parseError != null && parseError !== '' ? `\n${parseError}` : ''}
        </pre>
      );
    }

    if (lang === 'html') {
      const index = getNextHtmlIndex();
      registerHtmlArtifact(messageId, index, content);
      return <HtmlArtifactCard messageId={messageId} index={index} onOpen={onOpenArtifact} />;
    }

    return <code {...rest}>{children}</code>;
  };
}

/** Renders a single tool part (web_search, load_skill, shell, etc.). Used by segment and per-part rendering. */
function renderToolPart(part: MessagePart, key: string): React.ReactNode {
  const p = part as unknown as { state: string; toolCallId: string; input?: Record<string, unknown>; output?: unknown };
  const isLoading =
    p.state === 'input-streaming' ||
    p.state === 'input-available' ||
    (p.state !== 'output-available' && p.state !== 'result-available');
  const hasResult = p.state === 'output-available' || p.state === 'result-available';

  if (part.type === 'tool-web_search') {
    const out = p.output as { action?: { query?: string }; sources?: Array<{ type: string; url?: string; name?: string }> } | undefined;
    if (isLoading)
      return (
        <div key={key} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-1">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>正在搜索…</span>
        </div>
      );
    if (hasResult && out?.sources?.length)
      return (
        <div key={key} className="mt-2 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">引用来源</p>
          <ul className="list-disc list-inside space-y-0.5 text-sm">
            {out.sources.map((s, j) =>
              s.type === 'url' && s.url ? (
                <li key={j}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
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
    return null;
  }
  if (part.type === 'tool-get_server_ip') {
    const ip =
      typeof p.output === 'string'
        ? p.output
        : (p.output as { result?: string })?.result != null
          ? (p.output as { result: string }).result
          : null;
    if (hasResult && ip != null)
      return (
        <div key={key} className="mt-1 text-sm text-muted-foreground">
          服务端 IP: <span className="font-mono">{ip}</span>
        </div>
      );
    return null;
  }
  if (part.type === 'tool-load_skill') {
    const skillName = p.input?.name;
    if (isLoading)
      return (
        <div key={key} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-1">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>{skillName ? `正在加载技能「${skillName}」…` : '正在加载技能…'}</span>
        </div>
      );
    if (hasResult)
      return (
        <div key={key} className="mt-1 text-sm text-muted-foreground">
          已加载技能: <span className="font-medium">{String(skillName ?? '—')}</span>
        </div>
      );
    return null;
  }
  if (part.type === 'tool-shell' || part.type === 'tool-read_file' || part.type === 'tool-write_file' || part.type === 'tool-list_dir') {
    const cmd = (p.input?.command ?? p.input?.path ?? '') as string;
    const label =
      part.type === 'tool-shell'
        ? '执行'
        : part.type === 'tool-read_file'
          ? '读取文件'
          : part.type === 'tool-write_file'
            ? '写入文件'
            : '列出目录';
    if (isLoading)
      return (
        <div key={key} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-1">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>{cmd ? `${label}: ${cmd}` : `${label}…`}</span>
        </div>
      );
    if (hasResult) {
      const out = typeof p.output === 'string' ? p.output : '';
      return (
        <div key={key} className="mt-2 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            {label}
            {cmd ? <>: <code className="break-all">{cmd}</code></> : null}
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
    code: createCodeBlockComponent(
      messageId,
      artifactCallbacks.registerHtmlArtifact,
      getNextHtmlIndex,
      artifactCallbacks.onOpenArtifact
    ),
  };

  const { spec, hasSpec } = useJsonRenderMessage(parts);

  /** Segment-based rendering when we have spec from pipeJsonRender (patch parts) */
  if (hasSpec && spec && isValidSpec(spec)) {
    type Seg = { kind: 'text'; text: string } | { kind: 'spec' } | { kind: 'tools'; tools: Array<{ toolCallId: string; type: string; state: string; output?: unknown }> };
    const segments: Seg[] = [];
    let specInserted = false;
    for (const part of parts) {
      if (part.type === 'text' && typeof part.text === 'string') {
        const t = part.text.trim();
        if (!t) continue;
        const last = segments[segments.length - 1];
        if (last?.kind === 'text') last.text += '\n\n' + t;
        else segments.push({ kind: 'text', text: t });
      } else if (part.type === DATA_SPEC_PART_TYPE && !specInserted) {
        segments.push({ kind: 'spec' });
        specInserted = true;
      } else if (part.type.startsWith('tool-')) {
        const tp = part as { type: string; toolCallId: string; state: string; output?: unknown };
        const last = segments[segments.length - 1];
        if (last?.kind === 'tools') {
          last.tools.push({ toolCallId: tp.toolCallId, type: tp.type, state: tp.state, output: tp.output });
        } else {
          segments.push({
            kind: 'tools',
            tools: [{ toolCallId: tp.toolCallId, type: tp.type, state: tp.state, output: tp.output }],
          });
        }
      }
    }
    return (
      <>
        {segments.map((seg, i) => {
          if (seg.kind === 'text') {
            return (
              <Streamdown key={i} isAnimating={isStreaming ?? false} components={streamdownComponents}>
                {seg.text}
              </Streamdown>
            );
          }
          if (seg.kind === 'spec') {
            return <JsonRenderBlock key={i} spec={spec} />;
          }
          return (
            <span key={i}>
              {seg.tools.map((t) =>
                renderToolPart({ type: t.type, toolCallId: t.toolCallId, state: t.state, output: t.output } as MessagePart, t.toolCallId)
              )}
            </span>
          );
        })}
      </>
    );
  }

  /** Per-part rendering (no segment order, or legacy code-block / flat part) */
  let specRendered = false;
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
        if (part.type === DATA_SPEC_PART_TYPE && spec && isValidSpec(spec) && !specRendered) {
          specRendered = true;
          return <JsonRenderBlock key={i} spec={spec} />;
        }
        if (part.type.startsWith('tool-')) {
          return (
            <span key={i}>
              {renderToolPart(part, (part as { toolCallId?: string }).toolCallId ?? String(i))}
            </span>
          );
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
