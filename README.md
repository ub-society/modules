# UB Society Modules

UB Society provides open Web3 and blockchain education through structured learning modules covering blockchain fundamentals, smart contract development, and decentralized systems.
This repository contains the source code, modular curriculum tracks, and configuration for the documentation portal.

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
├── .github/                 # Issue templates and pull request template
├── .gitignore               # Ignored build caches, dist, and node_modules
├── .node-version            # Pinned Node.js runtime for build runners
├── CONTRIBUTING.md          # Contributing guidelines and writing standards
├── LICENSE                  # MIT License
├── package.json             # Scripts and dependencies
├── pnpm-workspace.yaml      # Package manager configuration
├── README.md                # Repository documentation
├── SECURITY.md              # Security and vulnerability reporting policy
├── wrangler.jsonc           # Cloudflare Workers configuration
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
    │   ├── og.jpg           # Open Graph and Twitter preview image
    │   └── robots.txt       # Crawler indexing directives
    ├── archive/             # Research notes and component sandbox
    │   └── index.md
    ├── index.md             # Landing page
    ├── about.md             # Society mission, vision, and core pillars
    └── learn/
        ├── index.md         # Curriculum tracks catalog
        ├── fundamentals/    # Blockchain Fundamentals track
        │   └── index.md
        └── builder/         # Builder engineering track
            └── index.md
```

## Adding and Modifying Content

Content pages and their sidebar navigation are managed through Markdown files and explicit VitePress configuration.

### 1. Create the Content File

Add your Markdown file to the appropriate track directory, such as `docs/learn/fundamentals/01-introduction.md`.
Ensure that each complete sentence is placed on its own line and no emojis are used.

### 2. Configure Sidebar Navigation and Order

Open `docs/.vitepress/config.mts` and locate `themeConfig.sidebar`.
Add your page link to the corresponding track items array.
The display order in the portal matches the array order:

```ts
"/learn/fundamentals/": [
  {
    text: "Blockchain Fundamentals",
    items: [
      { text: "Track Overview", link: "/learn/fundamentals/" },
      { text: "01. Introduction", link: "/learn/fundamentals/01-introduction" },
    ],
  },
],
```

### 3. Verify Local Build

Run the local build runner to ensure all internal links and formatting compile without errors:

```bash
pnpm run docs:build
```

For complete editorial, mathematical formatting, and code style standards, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Deployment

This portal is deployed to Cloudflare Workers using Static Assets mapped to `docs/.vitepress/dist`.
Deployments are performed manually from your terminal to manage build quotas.

### Manual Deployment via Wrangler

Build the static output and deploy using `pnpm dlx wrangler`:

```bash
pnpm run docs:build
pnpm dlx wrangler deploy
```

Alternatively, use the predefined package script:

```bash
pnpm run deploy
```

### Local Worker Preview

To preview the worker and static assets locally using Wrangler:

```bash
pnpm run docs:build
pnpm dlx wrangler dev
```
