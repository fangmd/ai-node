import type { LanguageModelMiddleware } from "ai"
import { config } from "../common/env"

export const customLogMiddleware: LanguageModelMiddleware = {
  specificationVersion: "v3",
  transformParams: async ({ type, params }) => {
    if (config.server.isDev) {
      console.log(
        `[chat] model request type=${type} params=`,
        JSON.stringify(params, null, 2)
      )
    }
    return params
  },
}
