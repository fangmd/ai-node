import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

export type SkillInfo = { name: string; description: string; location: string };

const SKILL_FILENAME = 'SKILL.md';

/** 技能根目录：相对当前模块所在目录解析，兼容 bundle（dist/）与开发（src/ai/skills/），不依赖 process.cwd */
export function getSkillsRoot(): string {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  // 生产 bundle 在 dist/index.js，skills 在 dist/../skills
  const fromDist = path.join(dir, '..', 'skills');
  // 开发时在 src/ai/skills/index.ts，skills 在 ../../../skills
  const fromSrc = path.join(dir, '..', '..', '..', 'skills');
  // 开发时 fromDist 会错误解析为 src/ai/skills（与 dir 同），需按是否在 dist 下区分
  const inDist = dir.includes(`${path.sep}dist${path.sep}`) || dir.endsWith(`${path.sep}dist`);
  return inDist ? fromDist : fromSrc;
}

function findSkillFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...findSkillFiles(full));
    } else if (e.isFile() && e.name === SKILL_FILENAME) {
      results.push(full);
    }
  }
  return results;
}

let cache: Record<string, SkillInfo> | null = null;

function ensureCache(): Record<string, SkillInfo> {
  if (cache) return cache;
  const root = getSkillsRoot();
  const files = findSkillFiles(root);
  const map: Record<string, SkillInfo> = {};
  for (const filePath of files) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = matter(raw);
      const name = parsed.data?.name;
      const description = parsed.data?.description;
      if (typeof name !== 'string' || typeof description !== 'string') continue;
      if (map[name]) {
        console.warn(`[skills] duplicate skill name "${name}", keeping first: ${map[name].location}, skipping: ${filePath}`);
        continue;
      }
      map[name] = { name, description, location: filePath };
    } catch {
      // skip invalid or unreadable file
    }
  }
  cache = map;
  const count = Object.keys(map).length;
  return map;
}

/** 返回所有已发现技能信息列表 */
export function getSkillInfoList(): SkillInfo[] {
  return Object.values(ensureCache());
}

/** 按名称获取技能信息（不含正文） */
export function getSkillByName(name: string): SkillInfo | undefined {
  return ensureCache()[name];
}

/** 加载技能完整内容（frontmatter + body），返回 { content: body, baseDir } */
export function loadSkillContent(name: string): { content: string; baseDir: string } {
  const info = getSkillByName(name);
  if (!info) {
    const available = Object.keys(ensureCache()).join(', ');
    throw new Error(`Skill "${name}" not found. Available skills: ${available || 'none'}`);
  }
  const raw = fs.readFileSync(info.location, 'utf-8');
  const parsed = matter(raw);
  const baseDir = path.dirname(info.location);
  return { content: (parsed.content ?? '').trim(), baseDir };
}
