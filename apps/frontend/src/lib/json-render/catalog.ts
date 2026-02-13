import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react';
import { z } from 'zod';

/**
 * Catalog for chat-embedded json-render UI.
 * Must stay in sync with skills/json-render/SKILL.md (available components/actions).
 */
export const catalog = defineCatalog(schema, {
  components: {
    Card: {
      props: z.object({
        title: z.string(),
        description: z.string().nullable().optional(),
      }),
      slots: ['default'],
      description: 'Container card with optional title and description',
    },
    Button: {
      props: z.object({
        label: z.string(),
        action: z.string().nullable().optional(),
      }),
      description: 'Clickable button that can trigger an action',
    },
    Text: {
      props: z.object({
        content: z.string(),
      }),
      description: 'Text paragraph',
    },
  },
  actions: {
    submit: {
      params: z.object({ formId: z.string().optional() }),
      description: 'Submit a form',
    },
    navigate: {
      params: z.object({ url: z.string() }),
      description: 'Navigate to a URL',
    },
  },
});
