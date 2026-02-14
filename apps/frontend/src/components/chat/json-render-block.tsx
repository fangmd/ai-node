import { useMemo, useRef, useCallback } from 'react';
import {
  Renderer,
  StateProvider,
  VisibilityProvider,
  ActionProvider,
  useStateStore,
} from '@json-render/react';
import { isValidSpec, type Spec } from '@ai-node/json-render';
import { registry, handlers as createHandlers, Fallback } from '@/lib/json-render/registry';

export interface JsonRenderBlockProps {
  /** Parsed spec (root + elements, optional state) */
  spec: Spec | null;
  /** Show loading state (e.g. when spec is streaming) */
  loading?: boolean;
}

/** Shared message when spec is invalid (code block parse or missing root/elements) */
export const INVALID_SPEC_MESSAGE = 'json-render: 无效的 spec（缺少 root 或 elements）';

const fallbackRenderer = ({ element }: { element: { type: string } }) => (
  <Fallback type={element.type} />
);

/**
 * Sits inside StateProvider; builds handlers from registry and passes to ActionProvider.
 * Uses refs so the handlers object is stable and always sees latest state/setState.
 */
function ActionProviderWithRegistryHandlers({
  spec,
  loading,
}: {
  spec: Spec;
  loading?: boolean;
}) {
  const { state, update } = useStateStore();
  const stateRef = useRef(state);
  stateRef.current = state;

  const setStateFromUpdater = useCallback(
    (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => {
      update(updater(stateRef.current));
    },
    [update]
  );
  const setStateRef = useRef(setStateFromUpdater);
  setStateRef.current = setStateFromUpdater;

  const handlers = useMemo(
    () =>
      createHandlers(
        () => setStateRef.current,
        () => stateRef.current
      ),
    []
  );

  return (
    <ActionProvider handlers={handlers}>
      <Renderer
        spec={spec}
        registry={registry}
        fallback={fallbackRenderer}
        loading={loading}
      />
    </ActionProvider>
  );
}

function JsonRenderBlockInner({ spec, loading }: JsonRenderBlockProps) {
  return (
    <StateProvider initialState={spec?.state ?? {}}>
      <VisibilityProvider>
        <ActionProviderWithRegistryHandlers spec={spec!} loading={loading} />
      </VisibilityProvider>
    </StateProvider>
  );
}

/**
 * Renders a json-render spec with providers. Use when the spec is already parsed.
 * On parse error, show fallback (caller should handle invalid spec before passing here).
 */
export function JsonRenderBlock({ spec, loading }: JsonRenderBlockProps) {
  if (!isValidSpec(spec)) {
    return (
      <div className="rounded border border-dashed border-muted-foreground/30 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        {INVALID_SPEC_MESSAGE}
      </div>
    );
  }
  return (
    <div className="my-2 rounded-lg border bg-card p-3 shadow-sm">
      <JsonRenderBlockInner spec={spec} loading={loading} />
    </div>
  );
}
