import { getToken, clearToken } from "./auth"

let onUnauthorized: (() => void) | null = null

export function setOnUnauthorized(fn: (() => void) | null): void {
  onUnauthorized = fn
}

export async function request(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const token = getToken()
  const headers = new Headers(init?.headers)
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  const res = await fetch(path, { ...init, headers })

  if (res.status === 401) {
    clearToken()
    if (!path.includes("/api/auth/login")) {
      onUnauthorized?.()
    }
  }

  return res
}
