# 🛠️ Queensland Government Design System - Design tokens

## 📖 On this page:

- 🎨 [What are 'design tokens'](#what-are-design-tokens)
- 🚀 [Getting started](#getting-started)
  - 📦 [Install & build](#install--build)
  - ✅ [Running tests](#run-tests)
  - 🔄 [Fetching Figma variables](#fetching-figma-variables)
  - ⚙️ [Continuous integration](#continuous-integration)
- 🧩 [Extending design tokens](#extending-design-tokens)
  - ✏️ [Create your own theme](#create-your-own-theme)
  - 📁 [Files to update](#files-to-update)
  - 🛠️ [After creating a custom theme](#after-creating-a-custom-theme)
- 🔄 [Tokens Studio integration](#tokens-studio-integration)
- 📚 [Additional resources](#additional-resources)
- 📦 [Publishing](#publishing)

---

<a id="what-are-design-tokens"></a>

## 🎨 What are 'design tokens'?

> “A Style Dictionary uses design tokens to define styles once and use those styles on any platform or language. It provides a single place to create and edit your styles, and exports these tokens to all the places you need.”  
> — _Amazon_

Design tokens are the single source of truth for your product’s visual style, they capture design decisions such as:

- 🎨 **Colours** (primary, secondary, background, border)
- 🔠 **Typography** (font families, weights, sizes, line heights)
- 📐 **Spacing** (margins, paddings, gaps)
- 🧱 **Components** (border radius, shadows, z-index)

These tokens are used to ensure **consistency** across multiple platforms and UI libraries (web, iOS, Android, emails, PDFs, etc.) without duplicating style logic in each codebase.

This repository implements **design tokens** using [Amazon’s Style Dictionary](https://github.com/amzn/style-dictionary), which compiles token definitions (stored in platform-agnostic JSON files) into platform-specific formats such as:

- ✅ SCSS variables
- ✅ CSS custom properties (`--tokens`)
- ✅ JavaScript constants
- ✅ JSON files for use in Figma, Storybook, or frontend frameworks

### 🧠 Why use Design Tokens?

- 🔁 **Consistency**: One change updates all platforms
- 🧩 **Scalability**: Add themes without rewriting UI
- 🤝 **Collaboration**: Designers and developers share a common language
- 🛡️ **Governance**: Enforce brand guidelines automatically

This package serves as the **Queensland Government’s baseline design token system**, and is intended to be:

- ✅ Extended per department/project
- ✅ Versioned and built into pipelines
- ✅ Source-controlled for audit and collaboration

---

<a id="getting-started"></a>

## 🚀 Getting started

<a id="install--build"></a>

### 📦 Install & build

```bash
npm install
npm run build
```

<a id="run-tests"></a>

### ✅ Running tests

```bash
npm run test
```

<a id="fetching-figma-variables"></a>

### 🔄 Fetching Figma variables

The local variables endpoint requires a Figma file key and an access token with
`file_variables:read` permission. Copy `.env.example` to `.env` and replace its
placeholder values, then run the fetch command:

```bash
cp .env.example .env
# Edit .env and set FIGMA_FILE_KEY and FIGMA_ACCESS_TOKEN
npm run figma:fetch
```

The command saves the unmodified API response to
`figma-exports/figma-variables.local.json`. This local response file is ignored
by Git. The `.env` file is also ignored; do not commit credentials or add them
to source files. Environment variables already set in the process take
precedence over values in `.env`.

Normalize the saved response into one DTCG color document per collection mode:

```bash
npm run figma:normalize
```

Generated documents are written to `tokens/colors/`, for example
`base.tokens.json`, `theme-light.tokens.json`, and `palette-default.tokens.json`.
Direct color aliases remain references.
Composed colors retain their color reference and store Figma's opacity
percentage in a QGDS DTCG extension for the later Style Dictionary build to
apply after resolving the color reference. The command validates all mode
combinations before writing output.

A fetch starts a fresh structured JSON Lines log at
`logs/figma-pipeline.jsonl`; normalization appends to it, keeping both stages
together. The log records pipeline stages, counts, and warnings such as
deleted-but-referenced variables and unresolved aliases. Composed color values
are counted as informational data, not warnings. The log does not record access
tokens or token values, and the `logs/` directory is ignored by Git.

<a id="continuous-integration"></a>

### ⚙️ Continuous integration

```bash
npm run ci
```

---

<a id="extending-design-tokens"></a>

## 🧩 Extending Design Tokens

<a id="create-your-own-theme"></a>

### ✏️ Create your own theme

You can fork this repository and create your own theme by extending the design tokens.

1. **Fork this repo**
2. **Switch to the example branch** for guidance:

```bash
git checkout custom-tokens-and-themes-example
```

Your forked files will remain untouched when pulling updates from the upstream repo.

---

<a id="files-to-update"></a>

### 📁 Files to update

To register a custom theme, update the following:

- `./$metadata.json`
- `./$themes.json`

📌 See the `custom-tokens-and-themes-example` branch for examples.

---

<a id="after-creating-a-custom-theme"></a>

### 🛠️ After creating a custom theme

Run the following to validate:

```bash
npm run build
npm run test
npm run build:package
```

✅ You should see no errors.

---

<a id="additional-resources"></a>

## 📚 Additional resources

- 📘 [Style Dictionary Documentation](https://github.com/amzn/style-dictionary)
- 🔧 [Style Dictionary Transforms for Tokens Studio](https://github.com/tokens-studio/sd-transforms)
- ✅ [Sotec Solutions Online Design Token Validator](https://designtoken-validator.sotec-solutions.com/)

---

<a id="publishing"></a>

## 📦 Publishing

There are **two publish subsystems**:

1. To [npmjs.com](https://www.npmjs.com/)
2. To the GitHub repository package registry

Ensure you are authenticated correctly before publishing.

---
