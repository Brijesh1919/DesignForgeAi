# DesignForge AI

DesignForge AI is a professional, local-first Figma plugin and local bridge backend that reconstructs any UI screenshot into a fully editable, clean Figma design following modern best practices (Frames, Auto Layout, Components, and Design Tokens). 

The system leverages the official **OpenRouter API** for layout analysis, OCR, color extraction, and element detection.

---

## 🏗️ Architecture

```
Figma Plugin
     │
     ▼
Local Express Backend (localhost:3001)
     │
     ▼
OpenRouter API
     │
     ▼
Structured JSON
     │
     ▼
Figma Builder (Frames, Auto Layout, Components)
```

---

## 🚀 Setup & Installation

### 1. Prerequisites
Ensure you have the following installed locally:
*   [Node.js](https://nodejs.org/) (v18+)
*   [pnpm](https://pnpm.io/) (v8+)
*   [Figma Desktop App](https://www.figma.com/downloads/) (required for testing local plugins)

### 2. Install Dependencies
Clone/navigate to the workspace and run the following command in the root folder to download and install all workspace package dependencies:
```bash
pnpm install
```

### 3. Environment Configuration
Create a `.env` file in the root workspace directory from the template:
```bash
cp .env.example .env
```
Open `.env` and fill in your OpenRouter API Key:
```env
PORT=3001
NODE_ENV=development

AI_PROVIDER=openrouter
OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY
OPENROUTER_MODEL=google/gemini-2.5-flash

BACKEND_URL=http://localhost:3001
MAX_IMAGE_SIZE_MB=10
```

---

## 🛠️ Running the Application

### 1. Compile & Start the Local Express Backend
To build the workspace and start the backend development server (hot-reloading at `http://localhost:3001`):
```bash
pnpm build
pnpm dev:backend
```

### 2. Start the Figma Plugin Watcher
In a separate terminal window, launch the watch compiler for the Figma plugin (bundling changes to `packages/plugin/dist` in real-time):
```bash
pnpm dev:plugin
```

---

## 🔌 Loading the Plugin into Figma

1. Open the **Figma Desktop App** and log in.
2. Open any design file.
3. Click the Figma menu dropdown, then navigate to **Plugins > Development > Import plugin from manifest...**.
4. Select the `manifest.json` file located in `packages/plugin/manifest.json`.
5. The plugin is now imported! You can open it by right-clicking on the canvas and choosing **Plugins > Development > DesignForge AI**.

---

## ⚙️ Configuration & Custom API Keys

### Global Mode (Default)
The plugin will send requests to the local Express backend, which calls OpenRouter using the `OPENROUTER_API_KEY` defined in the backend's root `.env` file.

### Local Settings (Override)
If you prefer not to store your API key on the backend server, you can configure it directly inside the plugin:
1. Open the plugin inside Figma.
2. Click the gear icon (`🔧`) in the top navigation bar.
3. Enter your **OpenRouter API Key** and preferred **OpenRouter Model** (e.g. `google/gemini-2.5-flash`).
4. These credentials are saved securely in your Figma local client storage (`figma.clientStorage`) and are passed in headers to your localhost backend for execution.

---

## 🔍 Troubleshooting

*   **pnpm build fails with ignored scripts**: If you receive build script warnings, run `pnpm install` after checking that `pnpm-workspace.yaml` contains `allowBuilds` configuration rules for native builds (`sharp` and `esbuild`).
*   **Failed to Fetch**: Ensure the Express backend is running on `http://localhost:3001` and the URL is correctly set under the plugin Settings.
*   **OpenRouter API Key Error**: Make sure your `OPENROUTER_API_KEY` is active and has permission to make requests to the selected model.
