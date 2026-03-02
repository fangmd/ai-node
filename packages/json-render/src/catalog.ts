import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react/schema';
import { shadcnComponentDefinitions } from '@json-render/shadcn/catalog';
import { z } from 'zod';

const JSON_RENDER_SKILL_SYSTEM =
  'When the user asks for interactive UI, cards, forms, or structured content in chat, follow the instructions below. Use only the components and actions listed in AVAILABLE COMPONENTS and AVAILABLE ACTIONS.';

const JSON_RENDER_SKILL_CUSTOM_RULES = [
  'Do not use setState, pushState, removeState, repeat, or visibility — this project only supports the AVAILABLE ACTIONS listed below (submit, navigate).',
  'Output only JSONL lines inside the ```spec block; no markdown or extra text inside the block.',
  'Every key in every children array must exist as a key in elements.',
  'For buttons that submit a form: set on.press to { "action": "submit", "params": { "formId": "<element-key-or-id>" } } so the handler receives params.',
];

const def = shadcnComponentDefinitions;

/**
 * Catalog for chat-embedded json-render UI.
 * All components from @json-render/shadcn; custom actions submit/navigate.
 */
export const catalog = defineCatalog(schema, {
  components: {
    Card: def.Card,
    Stack: def.Stack,
    Grid: def.Grid,
    Separator: def.Separator,
    Tabs: def.Tabs,
    Accordion: def.Accordion,
    Collapsible: def.Collapsible,
    Dialog: def.Dialog,
    Drawer: def.Drawer,
    Carousel: def.Carousel,
    Table: def.Table,
    Heading: def.Heading,
    Text: def.Text,
    Image: def.Image,
    Avatar: def.Avatar,
    Badge: def.Badge,
    Alert: def.Alert,
    Progress: def.Progress,
    Skeleton: def.Skeleton,
    Spinner: def.Spinner,
    Tooltip: def.Tooltip,
    Popover: def.Popover,
    Input: def.Input,
    Textarea: def.Textarea,
    Select: def.Select,
    Checkbox: def.Checkbox,
    Radio: def.Radio,
    Switch: def.Switch,
    Slider: def.Slider,
    Button: def.Button,
    Link: def.Link,
    DropdownMenu: def.DropdownMenu,
    Toggle: def.Toggle,
    ToggleGroup: def.ToggleGroup,
    ButtonGroup: def.ButtonGroup,
    Pagination: def.Pagination,
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
