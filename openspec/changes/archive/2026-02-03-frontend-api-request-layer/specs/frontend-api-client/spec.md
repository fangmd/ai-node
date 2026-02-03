# Frontend API Client (Delta Spec)

## ADDED Requirements

### Requirement: Centralized axios instance in lib

The frontend SHALL provide a single, configured axios instance in `lib` (e.g. `lib/request.ts` or `lib/axios.ts`). The instance MUST use a configurable baseURL, MUST attach `Authorization: Bearer <token>` to outbound requests when a token is available (from existing auth storage), and MUST NOT send the header when no token exists. The instance SHALL be the only HTTP client used by the `api/` layer for backend calls.

#### Scenario: Request includes token when logged in

- **WHEN** a request is made via the lib axios instance and the user has a stored token
- **THEN** the request SHALL include the header `Authorization: Bearer <token>`

#### Scenario: Request omits token when not logged in

- **WHEN** a request is made via the lib axios instance and no token is stored
- **THEN** the request SHALL NOT include an `Authorization` header

### Requirement: 401 response handling and onUnauthorized callback

The lib axios instance SHALL use a response interceptor so that on any response with status 401, the client clears the stored token and, when configured, invokes an onUnauthorized callback. The callback SHALL NOT be invoked for requests to the login endpoint (to avoid redirect loops).

#### Scenario: 401 clears token and invokes callback for non-login requests

- **WHEN** a response has status 401 and the request URL does not target the login endpoint
- **THEN** the client SHALL clear the stored token and SHALL call the configured onUnauthorized callback if set

#### Scenario: 401 on login endpoint does not invoke callback

- **WHEN** a response has status 401 and the request URL targets the login endpoint
- **THEN** the client SHALL clear the stored token and SHALL NOT call the onUnauthorized callback

### Requirement: Business API modules under api/

The frontend SHALL expose backend calls through an `api/` directory. Each file under `api/` SHALL represent a business area (e.g. auth, me) and SHALL use only the lib axios instance for HTTP. Pages and components SHALL call backend APIs only through these api modules, not by using the axios instance or fetch directly.

#### Scenario: Me data is requested via api module

- **WHEN** the application needs the current user (e.g. GET /api/me)
- **THEN** it SHALL call a function exported from an api module (e.g. `getMe()` from `api/me.ts`) which SHALL use the lib axios instance to perform the request and return the response data (or null on error) consistent with existing behavior

#### Scenario: Auth login is requested via api module

- **WHEN** the application performs login (e.g. POST to the auth login endpoint)
- **THEN** it SHALL call a function exported from an api auth module that uses the lib axios instance, so that all auth-related requests go through the same client and interceptors
