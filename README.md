<p align="center">
  <img src="public/logo.svg" alt="Lite-SQLearner" width="80" height="80" />
</p>

<h1 align="center">Lite-SQLearner</h1>

<p align="center">
  An interactive, gamified SQL learning desktop application — practice SQL right in your browser with zero setup.
</p>

<p align="center">
  <a href="https://github.com/AperturePlus/lite-sqlearner/releases/latest">
    <img src="https://img.shields.io/github/v/release/AperturePlus/lite-sqlearner?style=flat-square" alt="Latest Release" />
  </a>
  <a href="https://github.com/AperturePlus/lite-sqlearner/actions/workflows/release.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/AperturePlus/lite-sqlearner/release.yml?style=flat-square&label=build" alt="Build Status" />
  </a>
  <a href="https://github.com/AperturePlus/lite-sqlearner/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/AperturePlus/lite-sqlearner?style=flat-square" alt="License" />
  </a>
</p>

<p align="center">
  <strong>English</strong> | <a href="doc/README_zh.md">中文</a>
</p>

---

## ✨ Features

- 🎯 **Level-based Challenges** — Progress through structured SQL levels from beginner to advanced
- 📖 **Built-in Tutorials** — Each level comes with a tutorial explaining the SQL concepts
- 🏗️ **In-browser SQL Engine** — Powered by [sql.js](https://github.com/sql-js/sql.js) (SQLite compiled to WebAssembly), no server required
- ✅ **Instant Result Validation** — Write queries, run them, and get immediate feedback
- 🛠️ **SQL Playground** — Free-form SQL practice area to experiment with any query
- 🤖 **AI Assistant** — Integrated AI chat sidebar supporting OpenAI, Anthropic, and Google Gemini APIs
- 🎨 **Dark / Light Theme** — Toggle between dark and light modes
- 📦 **Desktop App** — Built with Electron for a native experience on Windows, macOS, and Linux

## 📸 Screenshots

<details>
<summary>Click to view screenshots</summary>

| Home Page | Light Theme |
|:---------:|:-----------:|
| ![Home](doc/home.png) | ![Light](doc/light.png) |

| Dark Theme | SQL Playground |
|:----------:|:--------------:|
| ![Dark](doc/dark.png) | ![Playground](doc/playground.png) |

</details>

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Vue 3 + TypeScript |
| **Desktop** | Electron |
| **UI Components** | Ant Design Vue |
| **Code Editor** | Monaco Editor |
| **SQL Engine** | sql.js (SQLite via WebAssembly) |
| **Markdown** | ByteMD |
| **State Management** | Pinia (with persisted state) |
| **Build Tool** | Vite |
| **AI Integration** | OpenAI / Anthropic / Google Generative AI SDKs |

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 16
- [Yarn](https://yarnpkg.com/) (recommended) or npm

### Development

```bash
# Install dependencies
yarn install

# Start the web dev server
yarn dev

# Start in Electron dev mode
yarn dev:electron
```

### Build

```bash
# Build the Electron app (generates installers in the release/ directory)
yarn electron:pack
```

The packaged application will be output to the `release/` directory.

## 📁 Project Structure

```
lite-sqlearner/
├── electron/          # Electron main & preload scripts
├── public/            # Static assets (logo, WASM binary)
├── src/
│   ├── components/    # Vue components (editor, AI sidebar, etc.)
│   ├── configs/       # App configuration
│   ├── core/          # Core logic (SQL engine, AI providers, etc.)
│   ├── levels/        # SQL level definitions and tutorials
│   ├── pages/         # Page views (Index, Levels, Playground)
│   └── main.ts        # Vue app entry point
├── doc/               # Screenshot assets
├── scripts/           # Build helper scripts
└── package.json
```

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source. See the [LICENSE](LICENSE) file for details.
