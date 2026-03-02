import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getToken } from '@/lib/auth';
import { getSSEUrl, type SSEConnectionStatus, type SSEMessage } from '@/lib/sse';

type Listener = (data: unknown) => void;
type ListenersByEvent = Map<string, Set<Listener>>;

type SSEContextValue = {
  status: SSEConnectionStatus;
  lastMessage: SSEMessage | null;
  subscribe: (event: string, listener: Listener) => () => void;
};

const SSEContext = createContext<SSEContextValue | null>(null);

export function useSSE(): SSEContextValue {
  const ctx = useContext(SSEContext);
  if (!ctx) throw new Error('useSSE must be used within SSEProvider');
  return ctx;
}

/** Subscribe to a specific event type. Returns unsubscribe. */
export function useSSEEvent(eventType: string, onEvent: (data: unknown) => void): void {
  const { subscribe } = useSSE();
  useEffect(() => {
    return subscribe(eventType, onEvent);
  }, [subscribe, eventType, onEvent]);
}

function parseData(data: string | null): unknown {
  if (data == null || data === '') return undefined;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

export function SSEProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SSEConnectionStatus>('connecting');
  const [lastMessage, setLastMessage] = useState<SSEMessage | null>(null);
  const listenersRef = useRef<ListenersByEvent>(new Map());
  const esRef = useRef<EventSource | null>(null);
  const addedEventsRef = useRef<Set<string>>(new Set());

  const dispatch = useCallback((event: string, data: unknown) => {
    const msg: SSEMessage = { event, data };
    setLastMessage(msg);
    listenersRef.current.get(event)?.forEach((fn) => fn(data));
    listenersRef.current.get('*')?.forEach((fn) => fn(msg));
  }, []);

  const subscribe = useCallback(
    (event: string, listener: Listener) => {
      const map = listenersRef.current;
      if (!map.has(event)) map.set(event, new Set());
      map.get(event)!.add(listener);

      const es = esRef.current;
      if (es && !addedEventsRef.current.has(event)) {
        addedEventsRef.current.add(event);
        es.addEventListener(event, (e: MessageEvent) => {
          dispatch(event, parseData(e.data));
        });
      }

      return () => {
        map.get(event)?.delete(listener);
      };
    },
    [dispatch]
  );

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStatus('closed');
      return;
    }

    const url = getSSEUrl(token);
    const es = new EventSource(url);
    esRef.current = es;
    addedEventsRef.current = new Set(['message', 'connected']);

    es.onopen = () => setStatus('open');
    es.onerror = () => setStatus('error');

    es.onmessage = (e) => dispatch('message', parseData(e.data));

    es.addEventListener('connected', (e) => dispatch('connected', parseData(e.data)));

    return () => {
      es.close();
      esRef.current = null;
      addedEventsRef.current = new Set();
      setStatus('closed');
    };
  }, [dispatch]);

  const value = useMemo<SSEContextValue>(
    () => ({ status, lastMessage, subscribe }),
    [status, lastMessage, subscribe]
  );

  return <SSEContext.Provider value={value}>{children}</SSEContext.Provider>;
}
