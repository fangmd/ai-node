import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react';
import { z } from 'zod';

const JSON_RENDER_SKILL_SYSTEM =
  'When the user asks for interactive UI, cards, forms, or structured content in chat, follow the instructions below. Use only the components and actions listed in AVAILABLE COMPONENTS and AVAILABLE ACTIONS.';

const JSON_RENDER_SKILL_CUSTOM_RULES = [
  'Do not use setState, pushState, removeState, repeat, or visibility — this project only supports the AVAILABLE ACTIONS listed below (submit, navigate).',
  'Output only JSONL lines inside the ```spec block; no markdown or extra text inside the block.',
  'Every key in every children array must exist as a key in elements.',
];

/**
 * Catalog for chat-embedded json-render UI.
 * Component/action list is the single source of truth; SKILL.md provides brief intro only.
 */
export const catalog = defineCatalog(schema, {
  components: {
    Stack: {
      props: z.object({
        direction: z.enum(['horizontal', 'vertical']).nullable().optional(),
        gap: z.enum(['sm', 'md', 'lg']).nullable().optional(),
        wrap: z.boolean().nullable().optional(),
      }),
      slots: ['default'],
      description: 'Flex layout container for stacking children',
      example: { direction: 'vertical', gap: 'md', wrap: null },
    },
    Grid: {
      props: z.object({
        columns: z.enum(['1', '2', '3', '4']).nullable().optional(),
        gap: z.enum(['sm', 'md', 'lg']).nullable().optional(),
      }),
      slots: ['default'],
      description: 'Grid layout container',
      example: { columns: '2', gap: 'md' },
    },
    Card: {
      props: z.object({
        title: z.string(),
        description: z.string().nullable().optional(),
      }),
      slots: ['default'],
      description: 'Container card with optional title and description',
      example: { title: '标题', description: '可选描述' },
    },
    Heading: {
      props: z.object({
        text: z.string(),
        level: z.enum(['h1', 'h2', 'h3', 'h4']).nullable().optional(),
      }),
      description: 'Section heading',
      example: { text: '标题', level: 'h2' },
    },
    Text: {
      props: z.object({
        content: z.string(),
        muted: z.boolean().nullable().optional(),
      }),
      description: 'Text paragraph',
      example: { content: '一段文字内容', muted: null },
    },
    Alert: {
      props: z.object({
        variant: z.enum(['default', 'destructive']).nullable().optional(),
        title: z.string(),
        description: z.string().nullable().optional(),
      }),
      description: 'Alert or info message box',
      example: { variant: 'default', title: '提示', description: '说明文字' },
    },
    Separator: {
      props: z.object({}),
      description: 'Visual divider line',
    },
    Link: {
      props: z.object({
        text: z.string(),
        href: z.string(),
      }),
      description: 'External link that opens in new tab',
      example: { text: '查看详情', href: 'https://example.com' },
    },
    Button: {
      props: z.object({
        label: z.string(),
        action: z.string().nullable().optional(),
      }),
      description: 'Clickable button that can trigger an action',
      example: { label: '确定', action: null },
    },
    Checkbox: {
      props: z.object({
        label: z.string(),
        checked: z.boolean().nullable().optional(),
        disabled: z.boolean().nullable().optional(),
      }),
      description: 'Checkbox with label, display-only state',
      example: { label: '同意条款', checked: false, disabled: null },
    },
    Switch: {
      props: z.object({
        label: z.string(),
        checked: z.boolean().nullable().optional(),
        disabled: z.boolean().nullable().optional(),
      }),
      description: 'Toggle switch with label, display-only state',
      example: { label: '启用', checked: true, disabled: null },
    },
    Progress: {
      props: z.object({
        value: z.number().min(0).max(100),
        label: z.string().nullable().optional(),
      }),
      description: 'Progress bar (0-100), optional label',
      example: { value: 60, label: '完成 60%' },
    },
    RadioGroup: {
      props: z.object({
        options: z.array(z.object({ value: z.string(), label: z.string() })),
        value: z.string().nullable().optional(),
      }),
      description: 'Single-choice radio group, value is selected option',
      example: { options: [{ value: 'a', label: '选项 A' }, { value: 'b', label: '选项 B' }], value: 'a' },
    },
    Badge: {
      props: z.object({
        text: z.string(),
        variant: z.enum(['default', 'secondary', 'destructive', 'outline']).nullable().optional(),
      }),
      description: 'Small badge or tag',
      example: { text: '标签', variant: 'default' },
    },
    Image: {
      props: z.object({
        src: z.string(),
        alt: z.string().nullable().optional(),
      }),
      description: 'Image by URL',
      example: { src: 'https://example.com/img.png', alt: '描述' },
    },
    List: {
      props: z.object({
        items: z.array(z.string()),
        ordered: z.boolean().nullable().optional(),
      }),
      description: 'Bullet or numbered list',
      example: { items: ['第一项', '第二项'], ordered: false },
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

/**
 * Returns the full json-render skill prompt using catalog.prompt({ mode: "chat" }).
 * Used when load_skill("json-render") is called; format and component/action list
 * come from @json-render/core for single source of truth.
 */
export function getJsonRenderSkillPrompt(): string {
  const options = {
    mode: 'chat' as const,
    system: JSON_RENDER_SKILL_SYSTEM,
    customRules: JSON_RENDER_SKILL_CUSTOM_RULES,
  };
  return catalog.prompt(options as Parameters<typeof catalog.prompt>[0]);
}
