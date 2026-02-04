import { createStore } from 'zustand/vanilla';
import { fetchLlmConfigs, type LlmConfigItem } from '@/api/llm-config';

type LlmConfigState = {
  llmConfigs: LlmConfigItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  setLlmConfigs: (configs: LlmConfigItem[]) => void;
  updateLlmConfig: (id: string, config: LlmConfigItem) => void;
  removeLlmConfig: (id: string) => void;
};

export const llmConfigStore = createStore<LlmConfigState>((set, get) => ({
  llmConfigs: [],
  loading: false,
  refresh: async () => {
    set({ loading: true });
    try {
      const res = await fetchLlmConfigs();
      const list = res.data?.code === 200 && Array.isArray(res.data.data) ? res.data.data : [];
      set({ llmConfigs: list, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  setLlmConfigs: (configs) => set({ llmConfigs: configs }),
  updateLlmConfig: (id, config) =>
    set((s) => ({
      llmConfigs: s.llmConfigs.map((c) => (c.id === id ? config : c)),
    })),
  removeLlmConfig: (id) =>
    set((s) => ({
      llmConfigs: s.llmConfigs.filter((c) => c.id !== id),
    })),
}));
