import { applySpecPatch, nestedToFlat } from '@json-render/core';
import type { Spec } from '@json-render/core';
import { DATA_SPEC_PART_TYPE } from './spec';

/** Part shape from AI SDK message.parts (type + optional data/text). */
export interface DataPart {
  type: string;
  text?: string;
  data?: unknown;
  [k: string]: unknown;
}

function isSpecDataPayload(data: unknown): data is { type: 'patch'; patch: object } | { type: 'flat'; spec: Spec } | { type: 'nested'; spec: Record<string, unknown> } {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  switch (obj.type) {
    case 'patch':
      return typeof obj.patch === 'object' && obj.patch !== null;
    case 'flat':
      return typeof obj.spec === 'object' && obj.spec !== null;
    case 'nested':
      return typeof obj.spec === 'object' && obj.spec !== null;
    default:
      return false;
  }
}

/**
 * Build a spec by replaying all data-spec parts (patch / flat / nested).
 * Used when consuming stream from pipeJsonRender (patch format) or legacy flat parts.
 */
export function buildSpecFromParts(parts: DataPart[]): Spec | null {
  const spec: Spec = { root: '', elements: {} };
  let hasSpec = false;
  for (const part of parts) {
    if (part.type !== DATA_SPEC_PART_TYPE || !isSpecDataPayload(part.data)) continue;
    const payload = part.data;
    if (payload.type === 'patch') {
      hasSpec = true;
      applySpecPatch(spec, payload.patch as Parameters<typeof applySpecPatch>[1]);
    } else if (payload.type === 'flat') {
      hasSpec = true;
      Object.assign(spec, payload.spec);
    } else if (payload.type === 'nested') {
      hasSpec = true;
      Object.assign(spec, nestedToFlat(payload.spec));
    }
  }
  return hasSpec ? spec : null;
}

/**
 * Join all text from message parts (type === "text") with double newlines.
 */
export function getTextFromParts(parts: DataPart[]): string {
  return parts
    .filter((p): p is DataPart & { text: string } => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text.trim())
    .filter(Boolean)
    .join('\n\n');
}
