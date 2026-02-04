import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useStore } from 'zustand';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Message } from '@/components/chat/message';
import { SessionList } from '@/components/chat/session-list';
import { getToken } from '@/lib/auth';
import { sessionStore } from '@/stores/session';
import { fetchSessions, fetchSessionMessages } from '@/api/sessions';

const CHAT_URL = '/api/ai/chat';

export default function Chat() {
  const [input, setInput] = useState('');
  const lastSendHadNoSession = useRef(false);

  const sessionList = useStore(sessionStore, (s) => s.sessionList);
  const currentSessionId = useStore(sessionStore, (s) => s.currentSessionId);
  const setCurrentSession = useStore(sessionStore, (s) => s.setCurrentSession);
  const setSessionList = useStore(sessionStore, (s) => s.setSessionList);
  const addSession = useStore(sessionStore, (s) => s.addSession);
  const clearCurrent = useStore(sessionStore, (s) => s.clearCurrent);

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

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport,
    messages: [],
    onFinish: async ({ isError }) => {
      if (lastSendHadNoSession.current && !isError) {
        const list = await fetchSessions();
        if (list.length > 0) {
          setSessionList(list);
          setCurrentSession(list[0].id);
        }
        lastSendHadNoSession.current = false;
      }
    },
  });

  useEffect(() => {
    fetchSessions().then(setSessionList);
  }, [setSessionList]);

  useEffect(() => {
    if (currentSessionId) {
      fetchSessionMessages(currentSessionId).then((msgs) => setMessages(msgs as Parameters<typeof setMessages>[0]));
    } else {
      setMessages([]);
    }
  }, [currentSessionId, setMessages]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || status !== 'ready') return;
    if (currentSessionId == null) lastSendHadNoSession.current = true;
    sendMessage({ text }, { body: { sessionId: currentSessionId ?? undefined } });
    setInput('');
  }, [input, status, sendMessage, currentSessionId]);

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

  return (
    <div className="flex h-[80vh] max-w-4xl mx-auto gap-4">
      <SessionList
        sessionList={sessionList}
        currentSessionId={currentSessionId}
        onNewSession={handleNewSession}
        onSelectSession={handleSelectSession}
      />
      <div className="flex flex-col flex-1 min-w-0">
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
            <Message key={m.id} message={m} />
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
    </div>
  );
}
