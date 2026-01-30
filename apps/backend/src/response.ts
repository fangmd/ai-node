import type { Context } from "hono"

export type ApiResponse<T = object> = {
  code: number
  msg: string
  data: T
}

export function success<T = object>(c: Context, data?: T) {
  return c.json(
    { code: 200, msg: "success", data: (data ?? {}) as object },
    200
  )
}

export function fail(c: Context, code: number, msg: string, data?: object) {
  return c.json({ code, msg, data: data ?? {} })
}
