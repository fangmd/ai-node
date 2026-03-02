import { defineRegistry } from '@json-render/react';
import { catalog } from '@ai-node/json-render';
import { shadcnComponents } from '@json-render/shadcn';

export const { registry, handlers } = defineRegistry(catalog, {
  components: {
    Card: shadcnComponents.Card,
    Stack: shadcnComponents.Stack,
    Grid: shadcnComponents.Grid,
    Separator: shadcnComponents.Separator,
    Tabs: shadcnComponents.Tabs,
    Accordion: shadcnComponents.Accordion,
    Collapsible: shadcnComponents.Collapsible,
    Dialog: shadcnComponents.Dialog,
    Drawer: shadcnComponents.Drawer,
    Carousel: shadcnComponents.Carousel,
    Table: shadcnComponents.Table,
    Heading: shadcnComponents.Heading,
    Text: shadcnComponents.Text,
    Image: shadcnComponents.Image,
    Avatar: shadcnComponents.Avatar,
    Badge: shadcnComponents.Badge,
    Alert: shadcnComponents.Alert,
    Progress: shadcnComponents.Progress,
    Skeleton: shadcnComponents.Skeleton,
    Spinner: shadcnComponents.Spinner,
    Tooltip: shadcnComponents.Tooltip,
    Popover: shadcnComponents.Popover,
    Input: shadcnComponents.Input,
    Textarea: shadcnComponents.Textarea,
    Select: shadcnComponents.Select,
    Checkbox: shadcnComponents.Checkbox,
    Radio: shadcnComponents.Radio,
    Switch: shadcnComponents.Switch,
    Slider: shadcnComponents.Slider,
    Button: shadcnComponents.Button,
    Link: shadcnComponents.Link,
    DropdownMenu: shadcnComponents.DropdownMenu,
    Toggle: shadcnComponents.Toggle,
    ToggleGroup: shadcnComponents.ToggleGroup,
    ButtonGroup: shadcnComponents.ButtonGroup,
    Pagination: shadcnComponents.Pagination,
  },
  actions: {
    submit: async (params, _setState, state) => {
      // params 来自 spec 的 on.press.params，若 AI 未写则为空；用 state 兜底作为表单数据
      const payload = {
        ...(params && Object.keys(params).length > 0 ? params : {}),
        ...(state && typeof state === 'object' ? { formData: state } : {}),
      };
      console.log('[json-render] submit', { params, state });
    },
    navigate: async (params) => {
      if (typeof window !== 'undefined' && params?.url) window.open(params.url, '_blank');
    },
  },
});

/** Fallback when spec references an unknown component type */
export function Fallback({ type }: { type: string }) {
  return (
    <div className="rounded border border-dashed border-muted-foreground/30 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
      Unknown component: {type}
    </div>
  );
}
