# Add Agent Skills

## Why

Chat currently has only fixed tools (e.g. `get_server_ip`). To handle domain-specific tasks (e.g. writing good git commit messages), the model needs on-demand access to structured instructions—skills. Skills are backend-defined Markdown files with a name and description; a `load_skill` tool lets the agent load one by name and follow its guidance, improving result quality without hardcoding prompts.

## What Changes

- Define a **skills root directory** under the backend project (e.g. `apps/backend/skills/`). All skills are backend-owned; no use of `.cursor/skills`.
- Implement **skill discovery**: scan the skills root for `**/SKILL.md`, parse YAML frontmatter (`name`, `description`) and record file location. Use **gray-matter** for parsing.
- Add a **`load_skill` tool** (Vercel AI SDK): description lists available skills (name + description); `execute(name)` loads the SKILL.md content and returns it (with base directory) so the model can follow the skill.
- Register `load_skill` in backend AI tools and pass it through the existing provider so chat can call it.
- Ship one **built-in skill**: help users generate git commit messages (guidelines, format, and when to use).

## Capabilities

### New Capabilities

- **skill-loader**: Skill discovery from backend skills root, frontmatter parsing with gray-matter, `load_skill` tool definition and integration with chat (provider/tools). Covers scanning, get-by-name, and tool description/execute behavior.

- **skill-git-commit**: The git commit message generation skill. Spec defines the skill’s purpose, when it triggers, and the content/behavior of the SKILL.md (conventions, format, examples). Delivered as one SKILL.md under the backend skills tree.

### Modified Capabilities

- (none)

## Impact

- **Backend**: New directory `apps/backend/skills/` (or equivalent); new module(s) for discovery + parsing; new tool `load_skill` in `apps/backend/src/ai/tools/`; provider continues to spread `localTools` (including `load_skill`). No change to route or auth.
- **Dependencies**: Backend adds `gray-matter` for SKILL.md frontmatter.
- **APIs / Frontend**: No API or frontend changes; skills are used only inside the existing chat tool loop.
