import { defineRegistry } from '@json-render/react';
import { catalog } from '@ai-node/json-render';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';

const gapClass = { sm: 'gap-2', md: 'gap-4', lg: 'gap-6' } as const;
const gridColsClass = { '1': 'grid-cols-1', '2': 'grid-cols-1 sm:grid-cols-2', '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' } as const;

export const { registry, handlers } = defineRegistry(catalog, {
  components: {
    Stack: ({ props, children }) => {
      const direction = props.direction === 'horizontal' ? 'flex-row' : 'flex-col';
      const gap = gapClass[props.gap ?? 'md'] ?? 'gap-4';
      const wrap = props.wrap ? 'flex-wrap' : '';
      return <div className={`flex ${direction} ${gap} ${wrap}`}>{children}</div>;
    },
    Grid: ({ props, children }) => {
      const cols = gridColsClass[props.columns ?? '2'] ?? 'grid-cols-1 sm:grid-cols-2';
      const gap = gapClass[props.gap ?? 'md'] ?? 'gap-4';
      return <div className={`grid ${cols} ${gap}`}>{children}</div>;
    },
    Card: ({ props, children }) => (
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <h3 className="font-semibold leading-none">{props.title}</h3>
        {props.description != null && (
          <p className="mt-1 text-sm text-muted-foreground">{props.description}</p>
        )}
        {children}
      </div>
    ),
    Heading: ({ props }) => {
      const Tag = (props.level ?? 'h2') as 'h1' | 'h2' | 'h3' | 'h4';
      const classMap = { h1: 'text-2xl font-bold', h2: 'text-xl font-semibold', h3: 'text-lg font-medium', h4: 'text-base font-medium' };
      return <Tag className={classMap[Tag]}>{props.text}</Tag>;
    },
    Text: ({ props }) => (
      <p className={`text-sm ${props.muted ? 'text-muted-foreground' : ''}`}>{props.content}</p>
    ),
    Alert: ({ props }) => {
      const isDestructive = props.variant === 'destructive';
      const bg = isDestructive ? 'bg-destructive/10 border-destructive/30' : 'bg-muted/50 border-border';
      const titleCls = isDestructive ? 'text-destructive' : 'text-foreground';
      return (
        <div className={`rounded-lg border p-3 ${bg}`}>
          <p className={`font-medium text-sm ${titleCls}`}>{props.title}</p>
          {props.description != null && <p className="mt-1 text-sm text-muted-foreground">{props.description}</p>}
        </div>
      );
    },
    Separator: () => <hr className="my-2 border-border" />,
    Link: ({ props }) => (
      <a href={props.href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80 text-sm">
        {props.text}
      </a>
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
    Checkbox: ({ props }) => (
      <div className="flex items-center gap-2">
        <Checkbox checked={props.checked ?? false} disabled={props.disabled ?? false} />
        <Label className="text-sm font-normal">{props.label}</Label>
      </div>
    ),
    Switch: ({ props }) => (
      <div className="flex items-center gap-2">
        <Switch checked={props.checked ?? false} disabled={props.disabled ?? false} />
        <Label className="text-sm font-normal">{props.label}</Label>
      </div>
    ),
    Progress: ({ props }) => (
      <div className="space-y-1">
        {props.label != null && <p className="text-sm text-muted-foreground">{props.label}</p>}
        <Progress value={props.value} />
      </div>
    ),
    RadioGroup: ({ props }) => (
      <RadioGroup value={props.value ?? undefined} onValueChange={() => {}} className="grid gap-2">
        {props.options.map((opt) => (
          <div key={opt.value} className="flex items-center gap-2">
            <RadioGroupItem value={opt.value} id={opt.value} />
            <Label htmlFor={opt.value} className="text-sm font-normal">{opt.label}</Label>
          </div>
        ))}
      </RadioGroup>
    ),
    Badge: ({ props }) => {
      const variant = props.variant ?? 'default';
      const classMap = {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive/10 text-destructive',
        outline: 'border border-input bg-background',
      };
      return (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${classMap[variant]}`}>
          {props.text}
        </span>
      );
    },
    Image: ({ props }) => (
      <img src={props.src} alt={props.alt ?? ''} className="max-w-full h-auto rounded-md border border-border" />
    ),
    List: ({ props }) => {
      const ListTag = props.ordered ? 'ol' : 'ul';
      const listClass = props.ordered ? 'list-decimal' : 'list-disc';
      return (
        <ListTag className={`list-inside text-sm space-y-1 ${listClass}`}>
          {props.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ListTag>
      );
    },
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

/** Fallback when spec references an unknown component type */
export function Fallback({ type }: { type: string }) {
  return (
    <div className="rounded border border-dashed border-muted-foreground/30 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
      Unknown component: {type}
    </div>
  );
}
