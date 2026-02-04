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
}));
