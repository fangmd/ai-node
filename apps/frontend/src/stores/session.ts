import { createStore } from 'zustand/vanilla';

export type SessionItem = {
  id: string;
  title?: string;
  updateTime: string;
  llmConfigId?: string;
};

type SessionState = {
  sessionList: SessionItem[];
  currentSessionId: string | null;
  setSessionList: (list: SessionItem[]) => void;
  setCurrentSession: (id: string | null) => void;
  addSession: (session: SessionItem) => void;
  clearCurrent: () => void;
  removeSessions: (sessionIds: string[]) => void;
};

export const sessionStore = createStore<SessionState>((set) => ({
  sessionList: [],
  currentSessionId: null,
  setSessionList: (list) => set({ sessionList: list }),
  setCurrentSession: (id) => set({ currentSessionId: id }),
  addSession: (session) =>
    set((s) => ({
      sessionList: [session, ...s.sessionList],
      currentSessionId: session.id,
    })),
  clearCurrent: () => set({ currentSessionId: null }),
  removeSessions: (sessionIds) =>
    set((s) => {
      const deletedSet = new Set(sessionIds);
      const newSessionList = s.sessionList.filter((session) => !deletedSet.has(session.id));
      const shouldClearCurrent = s.currentSessionId && deletedSet.has(s.currentSessionId);
      return {
        sessionList: newSessionList,
        currentSessionId: shouldClearCurrent ? null : s.currentSessionId,
      };
    }),
}));
