/**
 * 当设置 HTTP_PROXY / HTTPS_PROXY 时，返回走代理的 fetch，供 AI SDK 使用。
 * 未设置时返回 undefined，使用默认 fetch。
 */
import { EnvHttpProxyAgent, fetch as undiciFetch } from "undici"

let cached: typeof globalThis.fetch | undefined
let cachedEnv: string | undefined

export function getProxyFetch(): typeof globalThis.fetch | undefined {
  const proxyEnv = process.env.HTTP_PROXY ?? process.env.HTTPS_PROXY
  console.log("proxyEnv", proxyEnv)

  if (!proxyEnv?.trim()) return undefined
  if (cached && cachedEnv === proxyEnv) return cached
  cachedEnv = proxyEnv
  const dispatcher = new EnvHttpProxyAgent()
  cached = (async (input: RequestInfo | URL, init?: RequestInit) =>
    undiciFetch(
      input as never,
      { ...init, dispatcher } as never
    )) as typeof globalThis.fetch
  return cached
}
