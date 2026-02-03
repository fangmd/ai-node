# frontend-login

## Purpose

前端登录能力：登录页（shadcn 表单）、token 持久化与读取、未登录重定向到登录页、后端 401 时清除 token 并跳转登录页。

## ADDED Requirements

### Requirement: Login page

The frontend SHALL provide a login page at route `/login` with a form containing username and password fields. The page SHALL use shadcn/ui components (e.g. Card, CardHeader, CardTitle, CardContent, Label, Input, Button) for layout and styling. On submit, the frontend SHALL send the credentials to `POST /api/auth/login` (or the configured auth base URL). On success (e.g. response `code === 200` and `data.token` present), the frontend SHALL persist the token (e.g. via a token storage utility) and SHALL redirect the user to the application main area (e.g. `/` or `/chat`). On failure (e.g. 401 or non-2xx), the frontend SHALL display an error message to the user and SHALL NOT redirect.

#### Scenario: Successful login redirects

- **WHEN** the user submits the login form with valid username and password and the backend returns 200 with `data.token`
- **THEN** the token is stored (e.g. in localStorage) and the user is redirected to the main area (e.g. `/` or `/chat`)

#### Scenario: Failed login shows error

- **WHEN** the user submits the login form and the backend returns 401 or another error
- **THEN** an error message is shown on the page and the user remains on the login page

#### Scenario: Login page uses shadcn components

- **WHEN** the user visits `/login`
- **THEN** the page is rendered with shadcn Card, Label, Input, and Button (or equivalent) so that styling is consistent with the rest of the app

### Requirement: Token storage

The frontend SHALL provide a token storage abstraction (e.g. getToken, setToken, clearToken) that reads and writes a single token value to a persistent store (e.g. localStorage under a fixed key such as `auth_token`). "Logged in" SHALL be defined as the presence of a stored token (i.e. getToken() returns a non-empty value). The frontend SHALL use this abstraction for storing the token after login and for reading the token when deciding access and when attaching it to API requests.

#### Scenario: Token persisted after login

- **WHEN** login succeeds and setToken is called with the received token
- **THEN** a subsequent getToken() returns that token (e.g. after refresh or in another component)

#### Scenario: Clear token removes stored value

- **WHEN** clearToken() is called (e.g. on 401 handling)
- **THEN** getToken() subsequently returns null or empty and the user is considered logged out

### Requirement: Protected routes redirect when no token

The frontend SHALL protect routes that require authentication (e.g. `/chat`) by a guard (e.g. ProtectedRoute or layout). When the user navigates to a protected route and no token is stored (getToken() is empty), the frontend SHALL redirect to `/login` (e.g. with replace so the back button does not return to the protected page). When a token is present, the protected route SHALL render normally.

#### Scenario: No token redirects to login

- **WHEN** the user navigates to a protected route (e.g. `/chat`) and there is no stored token
- **THEN** the user is redirected to `/login` and the protected content is not rendered

#### Scenario: With token protected route renders

- **WHEN** the user navigates to a protected route and a token is stored
- **THEN** the protected route content is rendered and no redirect to login occurs

### Requirement: 401 response clears token and redirects to login

When any API request receives a 401 response (e.g. token expired or invalid), the frontend SHALL clear the stored token (e.g. via clearToken) and SHALL redirect the user to `/login` (e.g. with replace). This behavior SHALL be implemented in a central place (e.g. request wrapper or fetch interceptor) so that all API calls that return 401 trigger the same behavior.

#### Scenario: 401 on any request clears token and redirects

- **WHEN** an API request (e.g. to a protected endpoint or to refresh data) returns HTTP 401 or a response body with code 401
- **THEN** the stored token is cleared and the user is redirected to `/login`

### Requirement: Authenticated user visiting login redirects to main

When the user already has a stored token and navigates to `/login`, the frontend SHALL redirect them to the main area (e.g. `/` or `/chat`) so they do not remain on the login page.

#### Scenario: Already logged in redirects from login

- **WHEN** the user has a stored token and visits `/login`
- **THEN** they are redirected to the main area (e.g. `/` or `/chat`) and do not see the login form

### Requirement: API requests send Bearer token when present

When making API requests to endpoints that require authentication, the frontend SHALL include the stored token in the `Authorization` header as `Bearer <token>` when a token is present. When no token is present, the header SHALL NOT be set (or SHALL be omitted).

#### Scenario: Request with token includes Authorization

- **WHEN** an API request is made and getToken() returns a non-empty token
- **THEN** the request includes `Authorization: Bearer <token>`

#### Scenario: Request without token omits Authorization

- **WHEN** an API request is made and no token is stored
- **THEN** the request does not include an Authorization header (or sends without it)
