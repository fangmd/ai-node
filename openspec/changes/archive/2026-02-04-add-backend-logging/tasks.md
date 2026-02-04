## 1. Setup

- [x] 1.1 Add `pino` to backend dependencies; optionally add `pino-pretty` as devDependency for local readable output
- [x] 1.2 Create `apps/backend/src/common/logger.ts`: instantiate Pino with JSON output, read `LOG_LEVEL` from env (default `info`), export default `logger`

## 2. Replace console in application code

- [x] 2.1 In `apps/backend/src/index.ts`: import logger, replace `console.error(err)` and `console.log(Server running...)` with logger calls, remove all console usage
- [x] 2.2 In `apps/backend/src/ai/middleware.ts`: import logger, replace `console.log` model request debug with logger.debug (and optional structured fields), remove console usage
- [x] 2.3 Search `apps/backend/src` for any remaining `console.log`, `console.warn`, `console.error` and replace with logger or remove; ensure no application code uses console for logging

## 3. Verify

- [x] 3.1 Run backend dev and hit a route; confirm logs are JSON lines and level filtering works when setting LOG_LEVEL
- [x] 3.2 Run backend build and smoke-test; confirm no regression
