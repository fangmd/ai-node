import { request } from "@/lib/request"

export function login(username: string, password: string) {
  return request.post("/api/auth/login", { username, password })
}

export function register(username: string, password: string) {
  return request.post("/api/auth/register", { username, password })
}
