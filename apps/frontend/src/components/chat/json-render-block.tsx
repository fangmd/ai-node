import { Renderer, JSONUIProvider } from '@json-render/react';
import type { Spec } from '@json-render/core';
import { registry } from '@/lib/json-render/registry';

export interface JsonRenderBlockProps {
  /** Parsed spec (root + elements, optional state) */
  spec: Spec | null;
}

const actionHandlers: Record<string, (params: Record<string, unknown>) => Promise<unknown> | unknown> = {
  submit: async (params) => {
    console.log('[json-render] submit', params);
  },
  navigate: async (params) => {
    if (typeof window !== 'undefined' && params?.url) window.open(String(params.url), '_blank');
  },
};

function JsonRenderBlockInner({ spec }: JsonRenderBlockProps) {
  return (
    <JSONUIProvider
      registry={registry}
      initialState={spec?.state ?? {}}
      actionHandlers={actionHandlers}
    >
      <Renderer spec={spec} registry={registry} />
    </JSONUIProvider>
  );
}

/**
 * Renders a json-render spec with providers. Use when the spec is already parsed.
 * On parse error, show fallback (caller should handle invalid spec before passing here).
 */
export function JsonRenderBlock({ spec }: JsonRenderBlockProps) {
  if (!spec?.root || !spec?.elements) {
    return (
      <div className="rounded border border-dashed border-muted-foreground/30 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        json-render: 无效的 spec（缺少 root 或 elements）
      </div>
    );
  }
  return (
    <div className="my-2 rounded-lg border bg-card p-3 shadow-sm">
      <JsonRenderBlockInner spec={spec} />
    </div>
  );
}
