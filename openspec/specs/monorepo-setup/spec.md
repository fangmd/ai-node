# monorepo-setup

## Purpose

Repository root workspace configuration, pnpm workspaces, Turborepo pipeline, shared TypeScript base, and root scripts/documentation.

## Requirements

### Requirement: pnpm workspace
The repository SHALL use pnpm workspaces. Root MUST have `pnpm-workspace.yaml` declaring `apps/*` (and optionally `packages/*`). Running `pnpm install` at root SHALL install dependencies for all workspace packages.

#### Scenario: install at root
- **WHEN** user runs `pnpm install` in repository root
- **THEN** all workspace packages have their dependencies installed

### Requirement: Turborepo pipeline
The repository SHALL use Turborepo for task orchestration. Root MUST have `turbo.json` defining pipeline for `build`, `dev`, and optionally `lint`. Root scripts SHALL invoke `turbo run build` and `turbo run dev` so that apps are built or run with correct dependency order and caching.

#### Scenario: build all
- **WHEN** user runs root script that triggers `turbo run build`
- **THEN** backend and frontend apps are built in dependency order and outputs are cached

#### Scenario: dev all
- **WHEN** user runs root script that triggers `turbo run dev`
- **THEN** backend and frontend dev servers can run (turbo runs their `dev` scripts)

### Requirement: shared TypeScript base
The repository SHALL provide a shared TypeScript base config. Root MUST have `tsconfig.base.json` (or equivalent) that apps extend via `extends`. Apps SHALL NOT duplicate base compiler options that are common (e.g. target, module).

#### Scenario: apps extend base
- **WHEN** an app's `tsconfig.json` uses `extends` pointing at root base
- **THEN** the app inherits base compiler options and can override as needed

### Requirement: root scripts and README
Root `package.json` SHALL include scripts for `build`, `dev`, and `lint` that use Turborepo. README SHALL document tech stack (pnpm, Turborepo, Hono, React, Vite), how to install, and how to run backend and frontend (ports and env vars).

#### Scenario: documented run commands
- **WHEN** a developer reads the README
- **THEN** they see install command, backend/frontend ports, and how to run dev/build
