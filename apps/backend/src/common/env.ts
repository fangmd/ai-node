export const isDev = process.env.NODE_ENV !== "production"

export const JWT_SECRET = process.env.JWT_SECRET ?? ""
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d"
