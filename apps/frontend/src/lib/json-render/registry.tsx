import { defineRegistry } from '@json-render/react';
import { catalog } from './catalog';

export const { registry } = defineRegistry(catalog, {
  components: {
    Card: ({ props, children }) => (
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <h3 className="font-semibold leading-none">{props.title}</h3>
        {props.description != null && (
          <p className="mt-1 text-sm text-muted-foreground">{props.description}</p>
        )}
        {children}
      </div>
    ),
    Button: ({ props, emit }) => (
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        onClick={() => emit?.('press')}
      >
        {props.label}
      </button>
    ),
    Text: ({ props }) => <p className="text-sm">{props.content}</p>,
  },
  actions: {
    submit: async (params) => {
      console.log('[json-render] submit', params);
    },
    navigate: async (params) => {
      if (typeof window !== 'undefined' && params?.url) window.open(params.url, '_blank');
    },
  },
});
