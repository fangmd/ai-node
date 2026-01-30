import { Hono } from "hono"
import { success } from "../response"

const ai = new Hono()

ai.get("/hello", (c) => success(c, { message: "AI API ready" }))

export default ai
