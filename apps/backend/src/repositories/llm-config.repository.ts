import type { LlmProviderKind } from '@ai-node/types';
import { prisma } from '../common/prisma.js';
import { generateUUID } from '../common/snowflake.js';
import { encryptApiKey } from '../common/crypto.js';

export type { LlmProviderKind };

export type LlmConfigCreateInput = {
  name: string;
  provider: LlmProviderKind;
  baseURL: string;
  modelId: string;
  apiKey: string;
};

export type LlmConfigUpdateInput = Partial<{
  name: string;
  provider: LlmProviderKind;
  baseURL: string;
  modelId: string;
  apiKey: string;
}>;

export function listLlmConfigsByUserId(userId: bigint) {
  return prisma.llmConfig.findMany({
    where: { user_id: userId },
    orderBy: [{ is_default: 'desc' }, { update_time: 'desc' }],
  });
}

export function findLlmConfigByIdAndUserId(id: bigint, userId: bigint) {
  return prisma.llmConfig.findFirst({
    where: { id, user_id: userId },
  });
}

export function findDefaultLlmConfigByUserId(userId: bigint) {
  return prisma.llmConfig.findFirst({
    where: { user_id: userId, is_default: true },
  });
}

export async function createLlmConfig(userId: bigint, input: LlmConfigCreateInput, isDefault?: boolean) {
  const id = generateUUID() as bigint;
  const api_key_enc = encryptApiKey(input.apiKey);
  return prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.llmConfig.updateMany({ where: { user_id: userId }, data: { is_default: false } });
    }
    return tx.llmConfig.create({
      data: {
        id,
        user_id: userId,
        name: input.name,
        provider: input.provider,
        base_url: input.baseURL,
        model_id: input.modelId,
        api_key_enc,
        is_default: Boolean(isDefault),
      },
    });
  });
}

export async function updateLlmConfig(userId: bigint, id: bigint, input: LlmConfigUpdateInput) {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.provider !== undefined) data.provider = input.provider;
  if (input.baseURL !== undefined) data.base_url = input.baseURL;
  if (input.modelId !== undefined) data.model_id = input.modelId;
  if (input.apiKey !== undefined) data.api_key_enc = encryptApiKey(input.apiKey);
  return prisma.llmConfig.updateMany({
    where: { id, user_id: userId },
    data,
  });
}

export async function setDefaultLlmConfig(userId: bigint, id: bigint) {
  return prisma.$transaction(async (tx) => {
    await tx.llmConfig.updateMany({ where: { user_id: userId }, data: { is_default: false } });
    return tx.llmConfig.updateMany({
      where: { id, user_id: userId },
      data: { is_default: true },
    });
  });
}

export async function deleteLlmConfig(userId: bigint, id: bigint) {
  return prisma.$transaction(async (tx) => {
    // Unbind sessions that reference this config for this user.
    await tx.session.updateMany({
      where: { user_id: userId, llm_config_id: id },
      data: { llm_config_id: null },
    });
    return tx.llmConfig.deleteMany({ where: { id, user_id: userId } });
  });
}

