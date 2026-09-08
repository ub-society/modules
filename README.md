# UB Society Modules

UB Society provides open educational content covering distributed systems, cryptographic primitives, smart contract development, and Web3 engineering. This repository contains the source code, modular curriculum tracks, and configuration for the documentation portal.

## Prerequisites

- Node.js 18.x or higher (22.x recommended)
- pnpm 10.x or higher

## Getting Started

### 1. Install Dependencies

Install repository dependencies using pnpm:

```bash
pnpm install
```

### 2. Run Local Development Server

Start VitePress in development mode with hot-module replacement:

```bash
pnpm run docs:dev
```

The local development server runs at `http://localhost:5173`.

### 3. Production Build

Compile static HTML files, client JavaScript bundles, and local search indices:

```bash
pnpm run docs:build
```

Build outputs are generated in `docs/.vitepress/dist`.

### 4. Preview Production Build

Serve the built static assets locally to test production output:

```bash
pnpm run docs:preview
```

## Repository Structure

```text
├── .gitignore               # Ignored build caches, dist, and node_modules
├── .node-version             # Pinned Node.js runtime for build runners
├── package.json             # Scripts and dependencies
├── pnpm-workspace.yaml      # Package manager and build approvals
├── README.md                # Repository documentation
└── docs/
    ├── .vitepress/
    │   ├── config.mts       # Site navigation, metadata, and sidebars
    │   └── theme/
    │       ├── index.ts     # Theme extension entry point
    │       └── custom.css   # Custom brand palette and responsive styles
    ├── public/
    │   ├── favicon.svg      # Site favicon
    │   ├── logo-dark.svg    # Dark mode navbar logo
    │   ├── logo-light.svg   # Light mode navbar logo
    │   └── og.jpg           # Open Graph and Twitter preview image
    ├── index.md             # Landing page
    ├── about.md             # Society mission, vision, and core pillars
    └── learn/
        ├── index.md         # Curriculum tracks catalog
        ├── fundamentals/    # Blockchain Fundamentals track
        │   └── index.md
        └── builder/         # Builder engineering track
            └── index.md
```

## Adding Curriculum Content

To add a new module or lesson:

1. Create a Markdown file in the appropriate track directory under `docs/learn/<track>/`.
2. Write module content placing each sentence on its own line.
3. Register the new file link in `docs/.vitepress/config.mts` under the matching track sidebar.
4. Verify the build compiles without broken links using `pnpm run docs:build`.

## Cloudflare Pages Deployment

Configure your Cloudflare Pages project with the following settings:

| Setting                | Value                  |
| ---------------------- | ---------------------- |
| Framework preset       | None / VitePress       |
| Build command          | `pnpm run docs:build`  |
| Build output directory | `docs/.vitepress/dist` |
| Root directory         | `/`                    |
