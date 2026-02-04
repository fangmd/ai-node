import { Hono } from 'hono';
import { z } from 'zod';
import { jwtAuth, type AuthUser } from '../auth/middleware.js';
import { AppError, Conflict, NotFound, ValidationError } from '../errors/index.js';
import { success } from '../response.js';
import {
  createLlmConfig,
  deleteLlmConfig,
  listLlmConfigsByUserId,
  setDefaultLlmConfig,
  updateLlmConfig,
} from '../repositories/llm-config.repository.js';

const settings = new Hono<{ Variables: { user: AuthUser } }>();

const providerSchema = z.enum(['openai', 'deepseek']);

const createBody = z.object({
  name: z.string().min(1).max(50),
  provider: providerSchema,
  baseURL: z.string().min(1),
  modelId: z.string().min(1),
  apiKey: z.string().min(1),
  isDefault: z.boolean().optional(),
});

const updateBody = z.object({
  name: z.string().min(1).max(50).optional(),
  provider: providerSchema.optional(),
  baseURL: z.string().min(1).optional(),
  modelId: z.string().min(1).optional(),
  apiKey: z.string().min(1).optional(),
});

type SafeParseResult<T> = { success: true; data: T } | { success: false; error: any };

function assertValid<T>(parsed: SafeParseResult<T>, message: string): asserts parsed is { success: true; data: T } {
  if (parsed.success) return;
  const issues = parsed.error?.issues?.map((i: any) => ({
    path: i.path as (string | number)[],
    message: i.message as string,
  }));
  throw new AppError(ValidationError, message, { type: 'validation', issues });
}

// LLM configs
settings.get('/llm/configs', jwtAuth, async (c) => {
  const user = c.get('user');
  const userId = BigInt(user.id);
  const list = await listLlmConfigsByUserId(userId);
  return success(
    c,
    list.map((x) => ({
      id: x.id,
      name: x.name,
      provider: x.provider,
      baseURL: x.base_url,
      modelId: x.model_id,
      isDefault: x.is_default,
      hasKey: Boolean(x.api_key_enc),
      updateTime: x.update_time.toISOString(),
    }))
  );
});

settings.post('/llm/configs', jwtAuth, async (c) => {
  const parsed = createBody.safeParse(await c.req.json()) as SafeParseResult<z.infer<typeof createBody>>;
  assertValid(parsed, 'invalid llm config create body');

  const user = c.get('user');
  const userId = BigInt(user.id);
  try {
    const created = await createLlmConfig(userId, parsed.data, parsed.data.isDefault);
    return success(c, {
      id: created.id,
      name: created.name,
      provider: created.provider,
      baseURL: created.base_url,
      modelId: created.model_id,
      isDefault: created.is_default,
      hasKey: true,
      updateTime: created.update_time.toISOString(),
    });
  } catch (e) {
    // Prisma unique constraint -> Conflict
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('Unique constraint') || msg.includes('unique') || msg.includes('llm_config_user_id_name_key')) {
      throw new AppError(Conflict, 'llm config name already exists');
    }
    throw e;
  }
});

settings.put('/llm/configs/:id', jwtAuth, async (c) => {
  const parsed = updateBody.safeParse(await c.req.json()) as SafeParseResult<z.infer<typeof updateBody>>;
  assertValid(parsed, 'invalid llm config update body');

  const idStr = c.req.param('id');
  const id = BigInt(idStr);
  const user = c.get('user');
  const userId = BigInt(user.id);
  const result = await updateLlmConfig(userId, id, parsed.data);
  if (result.count === 0) throw new AppError(NotFound, 'llm config not found');
  return success(c, { updated: true });
});

settings.post('/llm/configs/:id/default', jwtAuth, async (c) => {
  const idStr = c.req.param('id');
  const id = BigInt(idStr);
  const user = c.get('user');
  const userId = BigInt(user.id);
  const result = await setDefaultLlmConfig(userId, id);
  if (result.count === 0) throw new AppError(NotFound, 'llm config not found');
  return success(c, { updated: true });
});

settings.delete('/llm/configs/:id', jwtAuth, async (c) => {
  const idStr = c.req.param('id');
  const id = BigInt(idStr);
  const user = c.get('user');
  const userId = BigInt(user.id);
  const result = await deleteLlmConfig(userId, id);
  if (result.count === 0) throw new AppError(NotFound, 'llm config not found');
  return success(c, { deleted: true });
});

export default settings;
