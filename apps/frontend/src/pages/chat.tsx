import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useStore } from 'zustand';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import {
  Message,
  type MessageMetadata,
  type ChatMessage,
  type MessageArtifactCallbacks,
} from '@/components/chat/message';
import { ArtifactsView, type ActiveArtifact } from '@/components/chat/artifacts-view';
import { SessionList } from '@/components/chat/session-list';
import { getToken } from '@/lib/auth';
import { sessionStore } from '@/stores/session';
import { llmConfigStore } from '@/stores/llm-config';
import { fetchSessions, fetchSessionMessages } from '@/api/sessions';

type MyUIMessage = UIMessage<MessageMetadata>;

const CHAT_URL = '/api/ai/chat';

export default function Chat() {
  const [input, setInput] = useState('');
  const lastSendHadNoSession = useRef(false);
  const [selectedLlmConfigId, setSelectedLlmConfigId] = useState<string>('');
  const artifactsMapRef = useRef<Record<string, string[]>>({});
  const [activeArtifact, setActiveArtifact] = useState<ActiveArtifact | null>(null);

  const sessionList = useStore(sessionStore, (s) => s.sessionList);
  const currentSessionId = useStore(sessionStore, (s) => s.currentSessionId);
  const setCurrentSession = useStore(sessionStore, (s) => s.setCurrentSession);
  const setSessionList = useStore(sessionStore, (s) => s.setSessionList);
  const addSession = useStore(sessionStore, (s) => s.addSession);
  const clearCurrent = useStore(sessionStore, (s) => s.clearCurrent);

  const llmConfigs = useStore(llmConfigStore, (s) => s.llmConfigs);
  const refreshLlmConfigs = useStore(llmConfigStore, (s) => s.refresh);

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

  const { messages, sendMessage, status, error, setMessages } = useChat<MyUIMessage>({
    transport,
    messages: [],
    onFinish: async ({ isError }) => {
      if (lastSendHadNoSession.current && !isError) {
        const res = await fetchSessions();
        const list = res.data?.code === 200 && Array.isArray(res.data.data) ? res.data.data : [];
        if (list.length > 0) {
          setSessionList(list);
          setCurrentSession(list[0].id);
        }
        lastSendHadNoSession.current = false;
      }
    },
    // experimental_throttle: 100,
  });

  useEffect(() => {
    fetchSessions().then((res) => {
      const list = res.data?.code === 200 && Array.isArray(res.data.data) ? res.data.data : [];
      setSessionList(list);
    });
  }, [setSessionList]);

  useEffect(() => {
    refreshLlmConfigs().catch(() => {
      // Error handling is done in store
    });
  }, [refreshLlmConfigs]);

  const defaultLlmConfigId = useMemo(() => {
    const d = llmConfigs.find((x) => x.isDefault);
    return d?.id ?? '';
  }, [llmConfigs]);

  const currentSessionLlmConfigId = useMemo(() => {
    if (!currentSessionId) return '';
    const s = sessionList.find((x) => x.id === currentSessionId);
    return s?.llmConfigId ?? '';
  }, [sessionList, currentSessionId]);

  useEffect(() => {
    if (currentSessionId) {
      fetchSessionMessages(currentSessionId).then((res) => {
        const msgs = res.data?.code === 200 && Array.isArray(res.data.data) ? res.data.data : [];
        setMessages(msgs as Parameters<typeof setMessages>[0]);
      });
    } else {
      setMessages([]);
    }
  }, [currentSessionId, setMessages]);

  // restore model selection when switching sessions
  useEffect(() => {
    if (currentSessionId) {
      setSelectedLlmConfigId(currentSessionLlmConfigId || defaultLlmConfigId);
    } else {
      setSelectedLlmConfigId(defaultLlmConfigId);
    }
  }, [currentSessionId, currentSessionLlmConfigId, defaultLlmConfigId]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || status !== 'ready') return;
    if (currentSessionId == null) lastSendHadNoSession.current = true;
    const body: Record<string, unknown> = { sessionId: currentSessionId ?? undefined };
    // new session must bind; existing session can switch binding by sending llmConfigId
    if (!currentSessionId) {
      body.llmConfigId = selectedLlmConfigId || undefined;
    } else if (selectedLlmConfigId && selectedLlmConfigId !== currentSessionLlmConfigId) {
      body.llmConfigId = selectedLlmConfigId;
    }
    sendMessage({ text }, { body });
    setInput('');
  }, [input, status, sendMessage, currentSessionId, selectedLlmConfigId, currentSessionLlmConfigId]);

  const handleNewSession = useCallback(() => {
    clearCurrent();
    setMessages([]);
  }, [clearCurrent, setMessages]);

  const handleSelectSession = useCallback(
    (id: string) => {
      setCurrentSession(id);
    },
    [setCurrentSession]
  );

  const artifactCallbacks = useMemo<MessageArtifactCallbacks>(
    () => ({
      registerHtmlArtifact: (messageId, index, html) => {
        if (!artifactsMapRef.current[messageId]) artifactsMapRef.current[messageId] = [];
        artifactsMapRef.current[messageId][index] = html;
      },
      onOpenArtifact: setActiveArtifact,
    }),
    []
  );

  const getHtmlForArtifact = useCallback((messageId: string, index: number) => {
    return artifactsMapRef.current[messageId]?.[index];
  }, []);

  // Calculate total token usage for the session
  const totalUsage = useMemo(() => {
    let total = 0;
    let input = 0;
    let output = 0;

    messages?.forEach((msg) => {
      if (msg.role === 'assistant') {
        const metadata = msg.metadata as MessageMetadata | undefined;
        if (metadata?.totalTokens) {
          total += metadata.totalTokens;
          input += metadata.inputTokens ?? 0;
          output += metadata.outputTokens ?? 0;
        }
      }
    });

    return { total, input, output };
  }, [messages]);

  return (
    <div className="flex h-[80vh] max-w-4xl mx-auto gap-4">
      <SessionList
        sessionList={sessionList}
        currentSessionId={currentSessionId}
        onNewSession={handleNewSession}
        onSelectSession={handleSelectSession}
      />
      <div className="flex flex-1 min-w-0 min-h-0">
        <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-2xl font-bold">Chat</h1>
            <Link to="/" className="text-blue-600 underline">
              Home
            </Link>
            <Link to="/me" className="text-blue-600 underline">
              个人信息
            </Link>
            <Link to="/settings" className="text-blue-600 underline">
              设置
            </Link>
          </div>
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground shrink-0">模型</label>
              <Select
                value={llmConfigs.length === 0 || !selectedLlmConfigId ? undefined : selectedLlmConfigId}
                onValueChange={setSelectedLlmConfigId}
                disabled={llmConfigs.length === 0}
              >
                <SelectTrigger className="min-w-[180px]">
                  <SelectValue placeholder="暂无配置" />
                </SelectTrigger>
                <SelectContent>
                  {llmConfigs.map((x) => (
                    <SelectItem key={x.id} value={x.id}>
                      {x.name}
                      {x.modelId ? ` (${x.modelId})` : ''}
                      {x.isDefault ? '（默认）' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {llmConfigs.length === 0 && (
                <Link to="/settings/llm" className="text-sm text-primary underline">
                  去设置
                </Link>
              )}
            </div>
            {totalUsage.total > 0 && (
              <div className="text-sm text-muted-foreground">
                会话总消耗: <span className="font-medium">{totalUsage.total}</span> tokens (输入: {totalUsage.input},
                输出: {totalUsage.output})
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto border rounded p-4 space-y-3 bg-gray-50">
            {messages?.map((m, index) => {
              const isLastMessage = index === (messages?.length ?? 0) - 1;
              const isLastAssistantMessage = isLastMessage && m.role === 'assistant';
              const isStreaming = isLastAssistantMessage && status === 'streaming';
              return (
                <Message
                  key={m.id}
                  message={m as ChatMessage}
                  isStreaming={isStreaming}
                  artifactCallbacks={artifactCallbacks}
                />
              );
            })}
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
              onKeyDown={(e) => {
                if (e.key !== 'Enter' || e.shiftKey) return;
                // IME composing (e.g. Chinese pinyin selection) should not trigger send
                if (e.nativeEvent.isComposing || (e as unknown as { keyCode?: number }).keyCode === 229) return;
                e.preventDefault();
                send();
              }}
              placeholder="Type a message..."
              className="flex-1 border rounded px-3 py-2"
              disabled={status !== 'ready' || llmConfigs.length === 0}
            />
            <Button onClick={send} disabled={status !== 'ready' || !input.trim() || llmConfigs.length === 0}>
              Send
            </Button>
          </div>
        </div>
        {activeArtifact && (
          <ArtifactsView
            activeArtifact={activeArtifact}
            getHtml={getHtmlForArtifact}
            onClose={() => setActiveArtifact(null)}
          />
        )}
      </div>
    </div>
  );
}
