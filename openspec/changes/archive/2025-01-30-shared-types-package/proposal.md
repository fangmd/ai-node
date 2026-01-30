# Proposal: Shared Types Package

## Why

Frontend and backend both need the same API response type (`ApiResponse`) for type safety and consistent contracts. Today the type lives only in `apps/backend/src/response.ts`, so the frontend cannot import it from a single source of truth. A shared types package solves this: one definition, used by both apps, reducing drift and duplication.

## What Changes

- Add a new workspace package (e.g. `packages/types`) that exports shared TypeScript types.
- Migrate `ApiResponse<T>` from `apps/backend/src/response.ts` into the shared package.
- Backend: keep `success` / `fail` helper implementations in backend; have them use the shared `ApiResponse` type (re-export or import from `packages/types`).
- Frontend: add dependency on the shared types package and use `ApiResponse` for API response typing.
- No change to the actual API response JSON shape or behavior.

## Capabilities

### New Capabilities

- `shared-types`: Defines the shared types package under `packages/types`, its exports (e.g. `ApiResponse`), and that both backend and frontend consume it for API-related types.

### Modified Capabilities

- _(None)_ — Backend API response format and helper behavior remain as specified; only the location of the type definition and consumption by frontend change.

## Impact

- **Code**: `apps/backend/src/response.ts` (remove local `ApiResponse` definition, import from shared package); new `packages/types` with `ApiResponse` and index export; frontend may add types package and use `ApiResponse` where it calls the API.
- **Dependencies**: Root `pnpm-workspace.yaml` already allows `packages/*`; add `packages/types` to workspace. Backend and frontend `package.json` gain dependency on the new types package.
- **Build**: Turborepo pipeline may need to include the types package so `build`/`dev` order respects it; typically types package is buildless (TS source consumed directly) or has a minimal build.
