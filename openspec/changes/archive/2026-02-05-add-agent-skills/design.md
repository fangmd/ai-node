# Design: Add Agent Skills

## Context

- Backend chat uses Vercel AI SDK: `streamText` with `tools` from `provider.tools` (currently `localTools`: e.g. `get_server_ip`). No skill-loading today.
- Proposal: skills root under backend (e.g. `apps/backend/skills/`), discovery of `**/SKILL.md`, frontmatter via gray-matter, and a `load_skill` tool so the model can load a skill by name and follow its Markdown body.
- Constraints: skills are backend-owned only (no `.cursor/skills`); keep changes minimal and scoped to backend.

## Goals / Non-Goals

**Goals:**

- One canonical skills root under the backend app (e.g. `apps/backend/skills/`).
- Discover all `**/SKILL.md` under that root; parse YAML frontmatter (`name`, `description`) with gray-matter; support get-by-name and list-all for the tool.
- Expose a single AI tool `load_skill`: description includes available skills (name + description); execute(name) returns the full skill content (heading, base directory, body) for the model to follow.
- Ship one built-in skill (git commit message generation) as a SKILL.md under the skills tree.

**Non-Goals:**

- Integrating or scanning `.cursor/skills`.
- Per-user or per-agent skill permissions.
- Multiple skills roots or configurable paths in this iteration.
- Editing or managing skills via API/UI.

## Decisions

1. **Skills root path**  
   - Use a directory relative to the backend package: `apps/backend/skills/`.  
   - Resolve at runtime from a known base (e.g. `import.meta.url` or `path.join(process.cwd(), 'skills')` when running from backend root).  
   - **Alternative:** env var `SKILLS_ROOT`; rejected for now to keep config simple.

2. **Discovery and parsing**  
   - Scan with Node `fs` + glob for `**/SKILL.md` under the skills root (e.g. `fast-glob` or simple recursive readdir).  
   - Parse each file with gray-matter; require frontmatter `name` and `description`; skip or warn on invalid/duplicate names.  
   - **Alternative:** Bun.Glob (opencode style); use Node-compatible approach so backend stays Node/Vite.

3. **When to scan**  
   - Scan at process startup or on first use and cache the list (name → path + meta). No hot-reload requirement for v1.  
   - **Alternative:** Scan on every tool call; rejected to avoid repeated I/O.

4. **Tool description and execute**  
   - `load_skill` uses Vercel AI SDK `tool()`: `description` is a string that includes the list of available skills (e.g. “Load a skill by name. Available: …” with each skill’s name and description).  
   - Parameter: `name` (string). Execute: resolve skill by name, read file, parse with gray-matter, return a single text: `## Skill: <name>\n\n**Base directory**: <dir>\n\n<body>`.  
   - **Alternative:** Return structured JSON; keeping a single text blob matches existing “tool result as message” usage and is simpler.

5. **Module layout**  
   - Introduce a small skill module (e.g. `apps/backend/src/ai/skills/` or `apps/backend/src/skills/`) that exports: `getSkillInfoList()`, `getSkillByName(name)`, and optionally `getSkillsRoot()`.  
   - The `load_skill` tool in `apps/backend/src/ai/tools/` calls this module and builds the tool description from the list.  
   - **Alternative:** Put all logic inside the tool file; a separate module keeps discovery/parsing testable and reusable.

6. **Built-in skill (git-commit)**  
   - One SKILL.md at e.g. `apps/backend/skills/git-commit/SKILL.md`.  
   - Content and behavior are specified in the `skill-git-commit` spec; design only fixes its location under the same skills root.

## Risks / Trade-offs

- **Duplicate skill names**  
  If two SKILL.md files share the same `name`, only one will be exposed. Mitigation: document that names must be unique; optionally log a warning when duplicates are found during discovery.

- **Invalid or missing frontmatter**  
  Files without valid `name`/`description` are skipped (or logged). Mitigation: clear convention in spec; no crash on bad files.

- **Cache staleness**  
  Adding/editing SKILL.md files requires restart (or future “first use” re-scan). Acceptable for v1; no hot-reload.

- **Path resolution in dev vs prod**  
  Backend may run from monorepo root or from `apps/backend`. Mitigation: resolve skills root from a reliable base (e.g. `path.dirname` of a known file or explicit `apps/backend`-relative path) so behavior is consistent.

## Migration Plan

- New feature only: add directory, dependency (gray-matter), and code. No data migration or API contract change.
- Deploy: ship backend with `skills/` and new tool; existing chat behavior unchanged. Rollback: remove the tool and skill module, revert provider tools to previous set.

## Open Questions

- None for initial implementation. Optional later: env override for skills root, or hot-reload for development.
