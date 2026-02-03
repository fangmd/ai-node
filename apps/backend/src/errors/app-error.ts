export type ErrorType = { readonly code: number; readonly msg: string }

export class AppError extends Error {
  public readonly code: number
  public readonly data?: object
  public readonly cause?: unknown

  constructor(type: ErrorType, message?: string, data?: object, cause?: unknown)
  constructor(code: number, message: string, data?: object, cause?: unknown)
  constructor(
    codeOrType: number | ErrorType,
    message?: string,
    data?: object,
    cause?: unknown
  ) {
    const code = typeof codeOrType === "object" ? codeOrType.code : codeOrType
    const msg =
      typeof codeOrType === "object"
        ? (message !== undefined ? message : codeOrType.msg)
        : (message as string)
    super(msg)
    this.name = "AppError"
    this.code = code
    this.data = data
    this.cause = cause
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError
}
