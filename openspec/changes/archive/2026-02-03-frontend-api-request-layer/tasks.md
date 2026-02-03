## 1. Dependencies and lib axios instance

- [x] 1.1 Add `axios` to frontend app dependencies (apps/frontend/package.json)
- [x] 1.2 Create lib axios instance file (e.g. lib/request.ts): baseURL, request interceptor (Authorization from getToken), response interceptor (401 → clearToken + onUnauthorized, skip callback for login URL)
- [x] 1.3 Expose setOnUnauthorized for the axios instance (aligned with existing auth behavior)

## 2. API modules

- [x] 2.1 Create api/me.ts using the lib axios instance, export getMe() returning current user data or null (same contract as today)
- [x] 2.2 Create api/auth.ts using the lib axios instance for login (POST to auth login endpoint)

## 3. Migration and cleanup

- [x] 3.1 Replace all usages of request/getMe/setOnUnauthorized from lib/api with api/\* and lib axios (pages: me, login; components: ProtectedRoute; App or bootstrap: setOnUnauthorized)
- [x] 3.2 Remove or refactor lib/api.ts to re-export from api/\* and lib so no direct fetch/request remains

## 4. Verification

- [x] 4.1 Verify login flow and 401 redirect/logout behavior unchanged
- [x] 4.2 Verify /api/me and protected routes work with the new request layer
