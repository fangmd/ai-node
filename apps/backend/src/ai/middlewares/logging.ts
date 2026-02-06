import type { LanguageModelMiddleware } from 'ai';
import { logger } from '../../common/logger';

type LoggingMiddlewareOptions = {
  enabled: boolean;
  sampleRate: number; // 0..1
  maxFieldLength: number;
};

/**
 * AI SDK middleware-based request/response logging.
 *
 * Verified against:
 * - ai: 6.0.67
 * - Middleware spec: v3 (`specificationVersion: 'v3'`)
 *
 * Note: This logs AI SDK-level params/results and stream parts (semantic events),
 * not raw HTTP/SSE bytes (fetch-layer concern).
 */
export function createAiSdkLoggingMiddleware(options: LoggingMiddlewareOptions): LanguageModelMiddleware {
  return {
    specificationVersion: 'v3',

    wrapGenerate: async ({ doGenerate, params }) => {
      const ctx = getRequestContext(params);
      const should = shouldLog(options);
      if (!options.enabled || !should) return doGenerate();

      logger.debug(
        { event: 'ai.doGenerate.params', ...ctx, payload: sanitizeForLog(params, options.maxFieldLength) },
        '[ai] doGenerate params'
      );

      const result = await doGenerate();

      logger.debug(
        {
          event: 'ai.doGenerate.result',
          ...ctx,
          payload: sanitizeForLog(result, options.maxFieldLength),
          // Align with @ai-sdk/devtools: store raw request/response bodies if present.
          raw_request: (result as any)?.request?.body ? JSON.stringify((result as any).request.body) : null,
          raw_response: (result as any)?.response?.body ? JSON.stringify((result as any).response.body) : null,
        },
        '[ai] doGenerate result'
      );

      return result;
    },

    wrapStream: async ({ doStream, params }) => {
      const ctx = getRequestContext(params);
      const should = shouldLog(options);
      if (!options.enabled || !should) return doStream();

      // Align with @ai-sdk/devtools: force includeRawChunks so provider raw chunks are available.
      const userRequestedRawChunks = (params as any).includeRawChunks === true;
      (params as any).includeRawChunks = true;

      logger.debug(
        { event: 'ai.doStream.params', ...ctx, payload: sanitizeForLog(params, options.maxFieldLength) },
        '[ai] doStream params'
      );

      const { stream, request, response, ...rest } = await doStream();

      let generatedText = '';
      const textBlocks = new Map<string, string>();
      const fullStreamChunks: unknown[] = [];
      const rawChunks: unknown[] = [];

      const transformStream = new TransformStream<any, any>({
        transform(part, controller) {
          // Align with @ai-sdk/devtools:
          // - exclude `type: "raw"` from raw_response (store in raw_chunks)
          // - only pass raw chunks through if user originally requested them
          if (part?.type === 'raw') {
            rawChunks.push(part.rawValue);

            logger.debug(
              {
                event: 'ai.doStream.raw_chunk',
                ...ctx,
                payload: sanitizeForLog(part.rawValue, options.maxFieldLength),
              },
              '[ai] stream raw chunk'
            );

            if (userRequestedRawChunks) controller.enqueue(part);
            return;
          }

          fullStreamChunks.push(part);
          controller.enqueue(part);

          // Print all non-raw parts.
          logger.debug(
            { event: 'ai.doStream.part', ...ctx, payload: sanitizeForLog(part, options.maxFieldLength) },
            '[ai] stream part'
          );

          // Keep a minimal summary for the final "finish" log.
          if (part?.type === 'text-start' && part.id) {
            textBlocks.set(String(part.id), '');
          }
          if (part?.type === 'text-delta') {
            const id = part.id ? String(part.id) : 'default';
            const delta = typeof part.delta === 'string' ? part.delta : '';
            if (delta) {
              generatedText += delta;
              textBlocks.set(id, (textBlocks.get(id) ?? '') + delta);
            }
          }
        },
        flush() {
          logger.debug(
            {
              event: 'ai.doStream.finish',
              ...ctx,
              generatedText: truncateString(generatedText, options.maxFieldLength),
              rest: sanitizeForLog(rest, options.maxFieldLength),
              // Align with @ai-sdk/devtools fields/types:
              raw_request: request?.body ? JSON.stringify(request.body) : null,
              raw_response: JSON.stringify(fullStreamChunks),
              raw_chunks: JSON.stringify(rawChunks),
            },
            '[ai] doStream finished'
          );
        },
      });

      return {
        stream: stream.pipeThrough(transformStream),
        request,
        response,
        ...rest,
      };
    },
  };
}

function shouldLog(options: LoggingMiddlewareOptions): boolean {
  if (!options.enabled) return false;
  if (options.sampleRate >= 1) return true;
  if (options.sampleRate <= 0) return false;
  return Math.random() < options.sampleRate;
}

function getRequestContext(params: any): Record<string, unknown> {
  // In AI SDK middleware, custom metadata passed via providerOptions is accessible via providerMetadata.
  const llmMeta = (params?.providerMetadata?.__llm ?? params?.providerOptions?.__llm) as
    | Record<string, unknown>
    | undefined;
  return llmMeta && typeof llmMeta === 'object' ? { ...llmMeta } : {};
}

function sanitizeForLog(value: unknown, maxFieldLength: number): unknown {
  return redactAndTruncate(value, maxFieldLength, new WeakSet<object>());
}

function redactAndTruncate(value: unknown, maxFieldLength: number, seen: WeakSet<object>): unknown {
  if (value == null) return value;
  if (typeof value === 'string') return truncateString(value, maxFieldLength);
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return value;

  if (Array.isArray(value)) {
    return value.map((v) => redactAndTruncate(v, maxFieldLength, seen));
  }

  if (typeof value === 'object') {
    if (seen.has(value as object)) return '[Circular]';
    seen.add(value as object);

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveKey(k)) {
        out[k] = '***';
        continue;
      }
      out[k] = redactAndTruncate(v, maxFieldLength, seen);
    }
    return out;
  }

  // functions/symbols/etc.
  return String(value);
}

function isSensitiveKey(key: string): boolean {
  const k = key.toLowerCase();
  return (
    k === 'authorization' ||
    k.includes('apikey') ||
    k.includes('api_key') ||
    k.includes('token') ||
    k.includes('secret')
  );
}

function truncateString(value: string, maxLen: number): string {
  if (maxLen <= 0) return '';
  if (value.length <= maxLen) return value;
  return `${value.slice(0, maxLen)}…(truncated)`;
}
