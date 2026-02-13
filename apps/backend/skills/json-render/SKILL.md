---
name: json-render
description: Output UI as a json-render spec in a Markdown code block for inline rendering.
---

# json-render

When the user asks for **interactive UI**, **cards**, **forms**, **buttons**, or **structured content** that should render in chat, output a **json-render spec** inside a Markdown code block. Do **not** output raw HTML for these cases; use this format so the frontend can render it.

## Output format

You **must** wrap the spec in a fenced code block with language **json-render**:

```markdown
\`\`\`json-render
<single JSON object - see below>
\`\`\`
```

The code block content must be **one JSON object** with this structure:

- **root** (string): The key of the root element in `elements`.
- **elements** (object): Map from element key to `{ type, props, children? }`.
  - **type** (string): One of the available component names (see below).
  - **props** (object): Props for that component.
  - **children** (array of strings, optional): Keys of child elements. Each key must exist in `elements`.
- **state** (object, optional): Initial state for the UI (e.g. sample data).

## Available components

| type    | props                                                                 | description              |
|---------|-----------------------------------------------------------------------|---------------------------|
| Card    | `title` (string), `description` (string, optional)                    | Container with title     |
| Button  | `label` (string), `action` (string, optional)                         | Clickable button         |
| Text    | `content` (string)                                                    | Paragraph text           |

## Available actions

- **submit**: Submit a form (params: `formId` optional).
- **navigate**: Open a URL (params: `url`).

Use these in element `on` bindings when you need button actions (e.g. `"on": { "press": { "action": "navigate", "params": { "url": "https://..." } } }`).

## Example

```json-render
{
  "root": "root",
  "elements": {
    "root": {
      "type": "Card",
      "props": { "title": "示例", "description": "描述文字" },
      "children": ["text1", "btn1"]
    },
    "text1": {
      "type": "Text",
      "props": { "content": "Hello" }
    },
    "btn1": {
      "type": "Button",
      "props": { "label": "打开链接" },
      "on": { "press": { "action": "navigate", "params": { "url": "https://example.com" } } }
    }
  }
}
```

## Rules

1. Every key in every `children` array must exist as a key in `elements`.
2. Use only the component types and actions listed above.
3. Output **only** the JSON inside the \`\`\`json-render block; no extra text inside the block.
