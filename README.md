# website — BubuStack Documentation & Website

The public website and documentation source for [BubuStack](https://bubustack.io).
This repository owns the Docusaurus site, docs, homepage content, and root
trust/governance files. It does not ship the operator, SDK, or transport
runtimes.

## 🔗 Quick Links

- Live site: https://bubustack.io
- Docs: https://bubustack.io/docs
- Roadmap: https://bubustack.io/docs/community/roadmap
- Examples: https://github.com/bubustack/examples
- Website issues: https://github.com/bubustack/website/issues

## 🏗️ Built With

- [Docusaurus 3](https://docusaurus.io/) — static site generator
- [React 19](https://react.dev/) — UI components
- [Mermaid](https://mermaid.js.org/) — diagrams in Markdown

## 🚀 Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm

### Run locally

```bash
npm install
npm start
```

This starts a local development server at `http://localhost:3000`. Most changes are reflected live without restarting.

### Build

```bash
npm run typecheck
npm run build
```

Generates static files into the `build` directory.

### Serve the build

```bash
npm run serve
```

## 📁 Project Structure

```
docs/               Markdown documentation (Docusaurus content)
src/
  components/       React components (homepage sections, features)
  css/              Global styles
  pages/            Custom pages (homepage)
static/             Static assets (images, favicon)
docusaurus.config.ts  Site configuration
sidebars.ts         Documentation sidebar structure
```

## ✏️ Contributing to Docs

Every documentation page has an **"Edit this page"** link at the bottom that takes you directly to the source file on GitHub. This is the easiest way to suggest improvements.

For larger changes:

1. Fork this repository
2. Create a branch
3. Edit or add Markdown files in `docs/`
4. Run `npm start` to preview locally
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

## Issue Routing

- Website/docs issues, broken links, homepage copy, and navigation updates:
  `bubustack/website`
- Operator/runtime behavior, CRDs, controllers, and webhooks:
  `bubustack/bobrapet`
- Transport hub, connector injection, and streaming topology runtime:
  `bubustack/bobravoz-grpc`
- SDK and component-runtime issues:
  the owning repository (`bubu-sdk-go`, component repo, or transport repo)
- Shared runtime contracts, templating, and operator/SDK helpers:
  `bubustack/core`
- Transport protobuf contracts and generated bindings:
  `bubustack/tractatus`

## 🧱 BubuStack Ecosystem

| Repository | Role |
|------------|------|
| [tractatus](https://github.com/bubustack/tractatus) | Protobuf contracts and generated Go bindings for transport runtimes |
| [core](https://github.com/bubustack/core) | Shared contracts, templating, transport envelopes, and runtime helpers |
| [bobrapet](https://github.com/bubustack/bobrapet) | Kubernetes operator — CRDs, controllers, webhooks |
| [bubu-sdk-go](https://github.com/bubustack/bubu-sdk-go) | Go SDK for building Engrams and Impulses |
| [bobravoz-grpc](https://github.com/bubustack/bobravoz-grpc) | gRPC streaming transport hub |
| [examples](https://github.com/bubustack/examples) | Example workflows and templates |
| **website** | **This repository** — documentation and website |

## 📄 License

Copyright 2026 BubuStack.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
