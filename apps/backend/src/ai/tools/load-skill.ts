import { tool } from 'ai';
import { z } from 'zod';
import { getSkillInfoList, loadSkillContent } from '../skills';

const skills = getSkillInfoList();
const description =
  skills.length === 0
    ? 'Load a skill to get detailed instructions for a specific task. No skills are currently available.'
    : [
        'Load a skill by name to get detailed instructions for a task. Use when the user request matches an available skill.',
        'Available skills:',
        ...skills.map((s) => `- **${s.name}**: ${s.description}`),
      ].join('\n');

export const load_skill = tool({
  description,
  inputSchema: z.object({
    name: z.string().describe('Skill name from the available skills list'),
  }),
  execute: async ({ name }) => {
    const { content, baseDir } = loadSkillContent(name);
    return [`## Skill: ${name}`, '', `**Base directory**: ${baseDir}`, '', content].join('\n');
  },
});
