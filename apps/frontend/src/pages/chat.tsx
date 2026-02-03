import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { getToken } from '@/lib/auth';

const CHAT_URL = '/api/ai/chat';

function MessageParts({ parts }: { parts: Array<{ type: string; text?: string; [k: string]: unknown }> }) {
  return (
    <>
      {parts.map((part, i) => {
        if (part.type === 'text' && typeof part.text === 'string') {
          return (
            <span key={i} className="whitespace-pre-wrap">
              {part.text}
            </span>
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
        return null;
      })}
    </>
  );
}

export default function Chat() {
  const [input, setInput] = useState('');
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: CHAT_URL,
        headers: (): Record<string, string> => {
          const token = getToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    []
  );
  const { messages, sendMessage, status, error } = useChat({ transport });

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || status !== 'ready') return;
    sendMessage({ text });
    setInput('');
  }, [input, status, sendMessage]);

  console.log('messages', messages);

  return (
    <div className="flex flex-col h-[80vh] max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Chat</h1>
        <Link to="/" className="text-blue-600 underline">
          Home
        </Link>
        <Link to="/me" className="text-blue-600 underline">
          个人信息
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto border rounded p-4 space-y-3 bg-gray-50">
        {messages?.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span className="font-medium">{m.role === 'user' ? 'You' : 'Assistant'}: </span>
            <MessageParts parts={m.parts} />
          </div>
        ))}
        {(status === 'submitted' || status === 'streaming') && (
          <div className="text-left text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span>{status === 'submitted' ? '等待回复…' : '正在输入…'}</span>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error.message}
        </p>
      )}
      <div className="flex gap-2 mt-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2"
          disabled={status !== 'ready'}
        />
        <Button onClick={send} disabled={status !== 'ready' || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
