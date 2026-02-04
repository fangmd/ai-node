import { Button } from '@/components/ui/button';
import { MessageSquarePlus } from 'lucide-react';

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
  return (
    <aside className="w-48 shrink-0 border rounded p-2 bg-gray-50 flex flex-col">
      <Button variant="outline" size="sm" className="w-full justify-start gap-2 mb-2" onClick={onNewSession}>
        <MessageSquarePlus className="h-4 w-4" />
        新会话
      </Button>
      <nav className="flex-1 overflow-y-auto space-y-1">
        {sessionList.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelectSession(s.id)}
            className={`w-full text-left px-2 py-1.5 rounded text-sm truncate ${
              currentSessionId === s.id ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-200'
            }`}
            title={s.title ?? s.id}
          >
            {s.title ?? '新会话'}
          </button>
        ))}
      </nav>
    </aside>
  );
}
