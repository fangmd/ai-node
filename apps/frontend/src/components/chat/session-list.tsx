import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, Trash2 } from 'lucide-react';
import { deleteSessions } from '@/api/sessions';
import { sessionStore } from '@/stores/session';

export interface SessionItem {
  id: string;
  title?: string;
  updateTime: string;
}

interface SessionListProps {
  sessionList: SessionItem[];
  currentSessionId: string | null;
  onNewSession: () => void;
  onSelectSession: (id: string) => void;
}

export function SessionList({ sessionList, currentSessionId, onNewSession, onSelectSession }: SessionListProps) {
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);

    try {
      const response = await deleteSessions([sessionId]);
      if (response.data?.code !== 200) {
        throw new Error(response.data?.msg ?? '删除失败');
      }
      sessionStore.getState().removeSessions([sessionId]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '删除失败';
      setError(errorMessage);
    }
  };


  return (
    <aside className="w-48 shrink-0 border rounded p-2 bg-gray-50 flex flex-col">
      <Button variant="outline" size="sm" className="w-full justify-start gap-2 mb-2" onClick={onNewSession}>
        <MessageSquarePlus className="h-4 w-4" />
        新会话
      </Button>
      {error && <div className="text-xs text-destructive mb-2 px-2">{error}</div>}
      <nav className="flex-1 overflow-y-auto space-y-1">
        {sessionList.map((s) => (
          <div
            key={s.id}
            className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm group ${
              currentSessionId === s.id ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-200'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectSession(s.id)}
              className="flex-1 text-left truncate"
              title={s.title ?? s.id}
            >
              {s.title ?? '新会话'}
            </button>
            <button
              type="button"
              onClick={(e) => handleDelete(s.id, e)}
              className={`shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-300 ${
                currentSessionId === s.id ? 'hover:bg-primary/80' : ''
              }`}
              aria-label={`删除会话 ${s.title ?? s.id}`}
              title="删除会话"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </nav>
    </aside>
  );
}
