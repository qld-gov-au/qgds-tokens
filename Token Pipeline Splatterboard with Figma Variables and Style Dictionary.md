# Token Pipeline Splatterboard with Figma Variables and Style Dictionary

# Recommended architecture: Figma Variables → GitHub → Style Dictionary → Design System Packages

For your situation, I would recommend building a GitHub-based token pipeline with the Figma Variables REST API as the primary source of truth, a normalised intermediate token model, and Style Dictionary as the transformation and publishing layer.

I would avoid making manual JSON exports or a Figma plugin the central mechanism for your production pipeline.

The important architectural decision is to separate three concerns:

1. Extraction: Getting the complete variable data out of Figma, including collections, modes, aliases and metadata.
2. Transformation: Converting Figma's representation into a stable, platform-independent token structure.
3. Distribution: Using Style Dictionary to generate CSS, SCSS, JSON, iOS, Android and other formats.

This separation gives you flexibility. If Figma changes its API, you only need to adjust your extraction layer. If you introduce new output formats, you only need to adjust your transformation and distribution layers.

Here's how I would approach it.

Proposed architecture


**Figma Variables**

Collections · Variables · Modes · Aliases

**Figma REST API**

Recommended extraction method

Automated, repeatable retrieval

**Normalisation layer**

Resolve IDs · Preserve aliases · Map modes · Validate

**Design token intermediate representation**

DTCG-compatible token JSON

**Style Dictionary**

Transforms · Formats · Custom platforms

**GitHub Packages / npm / CDN**

Versioned, documented releases

The main reason I favour this approach is that Figma's internal variable model and the design token model consumed by applications are not quite the same thing. Trying to make them identical can create problems as your system grows.

## 1. Choosing the right Figma extraction method

There are four main routes worth considering. They aren't interchangeable: they have different access requirements, capabilities and automation potential.

| Method | Best use | My assessment |
| --- | --- | --- |
| Figma Variables REST API | Automated extraction and CI | Best production option |
| Figma Plugin API | Custom in-Figma tooling | Excellent fallback |
| Native JSON export | Manual snapshots and initial setup | Useful, but not scalable |
| Code Connect | Connecting design components to code | Complementary, not a token exporter |

### A. Figma Variables REST API

Figma Variables REST API is my first choice.

Figma provides three relevant endpoints:

- `GET /v1/files/:file_key/variables/local`
- `GET /v1/files/:file_key/variables/published`
- `POST /v1/files/:file_key/variables`

For your purposes, the local variables endpoint is particularly important.

It retrieves:

- Local variable collections.
- Variables and their types.
- Variable values across modes.
- Mode identifiers and names.
- Variable aliases.
- Remote variables referenced by the file.

The published endpoint is useful for understanding what a library exposes to consuming files, but there is a significant distinction: published variable collections don't include modes in their response. I would therefore use the local endpoint as the primary extraction source when you need the complete mode structure.  
<https://developers.figma.com/docs/rest-api/variables-endpoints/> 

<https://developers.figma.com/docs/rest-api/variables/> 

#### Why it's particularly good for GitHub

You can build a script that:

1. Authenticates with Figma.
2. Retrieves the variables from a specified file.
3. Converts the response into your own token structure.
4. Compares the result against the current repository.
5. Opens a pull request when changes are detected.

This means designers can continue working in Figma, while developers receive reviewable, version-controlled token changes.

#### One important catch: API access.

The Variables REST API currently requires:

- An Enterprise organisation.
- A Full seat for the relevant account.
- The `file_variables:read` scope for extraction.
- Appropriate file permissions.

The write endpoint additionally requires `file_variables:write` and edit access. This is not an API that every Figma subscription can automatically use.

If your organisation has Enterprise, this is the approach I'd build around.

### B. Figma Plugin API

The Plugin API is your next-best option, particularly if REST API access is unavailable.

Figma exposes methods such as:

```typescript
figma.variables.getLocalVariableCollectionsAsync()
figma.variables.getLocalVariablesAsync()
figma.variables.getVariableByIdAsync()
```

These allow a plugin to inspect the variable collections and their contents.

A custom plugin can:

- Enumerate collections.
- Read all modes.
- Read variable values.
- Inspect aliases.
- Convert variable IDs into meaningful token references.
- Export the result as JSON.

The key advantage is that it can operate inside the Figma file without requiring the Enterprise Variables REST API.

There are some disadvantages:

- It generally requires someone to run the plugin.
- You need to handle the export/download process.
- Automated execution from GitHub is less straightforward.
- You must account for permissions and access to remote variables.
- You need to maintain the plugin as Figma evolves.

My recommendation: If REST API access is unavailable, build a small internal Figma plugin that exports a predictable, versioned JSON format. Have designers export it into the repository through a documented process.

You could also make the plugin push its output to a controlled endpoint, although that introduces authentication and security considerations.

### C. Native Figma JSON export

Figma has a native variable export feature that is more useful than it might initially appear.

You can export:

- Individual modes.
- All modes in a collection.

Figma's newer token import/export functionality also makes DTCG a particularly relevant format.

The important limitation is that exports are organised around collections and modes, rather than being a complete automated design-system synchronisation mechanism.

I'd use native export for:

- Initial token migration.
- Creating a baseline snapshot.
- Comparing your custom exporter against Figma's output.
- Occasional manual recovery.

I wouldn't use it as the ongoing production pipeline.

### D. Code Connect

Figma Code Connect is worth understanding, but it solves a different problem.

Code Connect links components in Figma to their actual implementations in your codebase.

For example:

- Figma button component → React Button component.
- Figma input component → React Input component.
- Figma card component → React Card component.

It helps developers and AI coding assistants understand how to implement designs using your real components.

It is not intended to extract and transform your variable collections.

I'd absolutely consider introducing it later, particularly if your design system is consumed by multiple product teams, but I wouldn't make it part of the core token extraction pipeline.

<https://developers.figma.com/docs/code-connect> 

## 2. The most important architectural decision: use DTCG as your intermediate format

This is probably the biggest recommendation I'd make.

Rather than converting Figma variables directly into CSS, SCSS, Android resources or iOS assets, convert them into the Design Tokens Community Group (DTCG) format first.

Design Tokens Community Group is working towards a common specification for sharing design tokens between tools and platforms.

The advantage is that you aren't building a Figma-specific token format that every downstream consumer needs to understand.

You establish a standardised token representation, and Style Dictionary handles the platform-specific transformations.

For example, instead of keeping a Figma-specific structure like:

```json
{
  "values": {
    "collectionId": {
      "variableId": {
        "modeId": "#2563EB"
      }
    }
  }
}
```

You could normalise it into something like:

```json
{
  "color": {
    "brand": {
      "primary": {
        "$type": "color",
        "$value": "#2563EB"
      }
    }
  }
}
```

For an alias:

```json
{
  "color": {
    "button": {
      "background": {
        "$type": "color",
        "$value": "{color.brand.primary}"
      }
    }
  }
}
```

The second example is much more useful to downstream consumers because the semantic relationship is preserved.

### What about collections and modes?

This is where you need to make an architectural decision before writing your exporter.

Imagine you have:

- Primitives
- Semantic colours
- Semantic spacing
- Typography
- Component tokens

And your semantic colour collection has:

- Light
- Dark
- High contrast

You have a few ways to represent that.

Option 1: Separate files per mode

```text
tokens/
  primitives/
    primitives.tokens.json
  semantic/
    light.tokens.json
    dark.tokens.json
    high-contrast.tokens.json
  typography/
    typography.tokens.json
```

This is my preferred approach for many design systems.

Each mode produces its own resolved token set, while references to primitives can remain intact.

For example, the light and dark files might both reference the same primitive colour definitions.

Option 2: Preserve collections and modes in your source model

```json
{
  "collection": "Semantic colours",
  "modes": {
    "Light": {
      "background": "#FFFFFF",
      "text": "#171717"
    },
    "Dark": {
      "background": "#171717",
      "text": "#FFFFFF"
    }
  }
}
```

This can be useful internally, but isn't itself a standard DTCG token representation.

You would need a build step that generates separate DTCG token files.

My preference: Preserve the complete Figma collection/mode structure in your extraction layer, then generate DTCG files for individual modes.

This gives you the best of both worlds.

## 3. Style Dictionary: the conversion and publishing layer

Style Dictionary is a very good choice for this job.

I'd use Style Dictionary v4 as the established baseline, while evaluating v5 as it matures.

It supports DTCG-formatted tokens natively from v4, although there is an important compatibility consideration: the newer DTCG 2025.10 specification is not yet fully supported in the v4 documentation. Support is being developed in v5.

<https://styledictionary.com/info/dtcg> 

### How I'd structure the repository

I'd keep the extracted tokens separate from the generated output.

```text
design-system-tokens/
│
├── src/
│   ├── figma/
│   │   ├── fetch-variables.ts
│   │   ├── normalise-variables.ts
│   │   └── resolve-aliases.ts
│   │
│   └── tokens/
│       ├── primitives/
│       │   └── primitives.tokens.json
│       │
│       ├── semantic/
│       │   ├── light.tokens.json
│       │   ├── dark.tokens.json
│       │   └── high-contrast.tokens.json
│       │
│       └── components/
│           └── components.tokens.json
│
├── build/
│   ├── css/
│   ├── scss/
│   ├── json/
│   ├── ios/
│   └── android/
│
├── scripts/
│   ├── sync-figma.ts
│   └── validate-tokens.ts
│
├── .github/
│   └── workflows/
│       ├── sync-figma.yml
│       └── publish-tokens.yml
│
├── style-dictionary.config.ts
├── package.json
└── README.md
```

You don't necessarily need to use this exact structure, but the separation is important.

### Example: Style Dictionary configuration

A simplified configuration might look like this:

```js
import StyleDictionary from 'style-dictionary';

const sd = new StyleDictionary({
  source: ['src/tokens/**/*.tokens.json'],

  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'build/css/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables'
        }
      ]
    },

    scss: {
      transformGroup: 'scss',
      buildPath: 'build/scss/',
      files: [
        {
          destination: '_tokens.scss',
          format: 'scss/variables'
        }
      ]
    },

    json: {
      transformGroup: 'js',
      buildPath: 'build/json/',
      files: [
        {
          destination: 'tokens.json',
          format: 'json'
        }
      ]
    }
  }
});

await sd.buildAllPlatforms();
```

This is illustrative rather than a complete production configuration. In particular, you'd need to configure how you load different themes and preserve or resolve references between token files.

### An important consideration: aliases

I would strongly recommend preserving aliases as long as possible.

Consider this hierarchy:

```text
Primitive
  blue-600 = #2563EB

Semantic
  color-action-primary = blue-600

Component
  button-background = color-action-primary
```

You don't want to lose this relationship by flattening every variable into its final hex value during extraction.

Preserving aliases means:

- Changing a primitive automatically updates dependent tokens.
- Developers can understand the semantic intent of a token.
- Your token structure reflects the architecture of the design system.
- You can validate references and identify broken dependencies.

You will need to resolve Figma's variable IDs into meaningful token paths. Figma aliases are ID-based, whereas DTCG references are path-based.

This is one of the most important pieces of custom logic in your extraction layer.

### Another important consideration: Figma types

Figma's variable types don't map perfectly to DTCG types.

For example:

| Figma variable | Possible DTCG mapping |
| --- | --- |
| COLOR | color |
| FLOAT | dimension, number, fontWeight, etc. |
| STRING | string, fontFamily, etc. |
| BOOLEAN | boolean |
| TIMING | duration |
| EASING | cubicBezier or an appropriate string representation |

The mapping of FLOAT is particularly important. A value of `16` could represent spacing, font size, line height, opacity or something else.

You should use Figma scopes, naming conventions and explicit mapping rules rather than blindly mapping every FLOAT to dimension.

This is another reason I favour an intermediate normalisation layer.

<https://github.com/tokens-bruecke/figma-plugin?> 

## 4. Some newer tools and developments worth investigating

There are a few things that I think materially improve the options available to you.

### A. Figma's official GitHub Actions example

Start here

figma/variables-github-action-example

View[ the official GitHub repository ](https://github.com/figma/variables-github-action-example)

This is probably the first repository I'd investigate.

Figma has published an example implementation of bidirectional synchronisation between:

- Figma Variables.
- Design token JSON files.
- GitHub Actions.

It demonstrates both:

- Pulling Figma variables into a code repository.
- Pushing code-based tokens back into Figma.

The example is particularly useful because it demonstrates the API integration rather than leaving you to work out the authentication and variable mapping yourself.

There are some limitations to be aware of:

- It doesn't automatically delete tokens removed from the opposite system.
- Its alias mapping makes assumptions about variable names.
- It uses an older draft DTCG representation.

I'd treat it as a reference implementation, not something to adopt unchanged.

<https://github.com/figma/variables-github-action-example> 

### B. TokensBrücke

Worth testing

TokensBrücke

View[ TokensBrücke on GitHub ](https://github.com/tokens-bruecke/figma-plugin)

This is one of the more interesting projects I've come across for your use case.

It offers a Figma plugin and CLI for exporting variables into DTCG JSON.

Notable features include:

- DTCG 2025.10 support.
- Exporting individual collections.
- Splitting collections into individual mode files.
- Preserving aliases.
- Mapping Figma variable types to DTCG types.
- GitHub and GitLab integrations.
- Importing tokens back into Figma.

The CLI aspect is particularly interesting because it potentially gives you a starting point for a more automated workflow without having to write every part of the Figma extraction logic yourself.

I'd test it against your actual variable architecture, especially:

- Cross-collection aliases.
- Remote variables.
- Extended collections.
- Multiple modes.
- Typography and complex token values.

One caveat: don't assume that an exporter claiming DTCG 2025.10 compatibility guarantees that every token type and extension is handled correctly by your downstream Style Dictionary version.

<https://github.com/tokens-bruecke/figma-plugin> 

### C. DTCG 2025.10

Major development

Read[ the DTCG 2025.10 specification ](https://www.designtokens.org/tr/2025.10/)

This is arguably the most significant development in the token ecosystem.

The Design Tokens Community Group published its stable 2025.10 specification on 28 October 2025.

It provides a more mature standard for:

- Token types.
- Token values.
- References.
- Groups.
- Descriptions.
- Extensions.
- Composite token structures.

It is especially relevant if you're building a design system intended to serve multiple platforms and frameworks.

I would make DTCG compatibility a requirement for your intermediate token representation, while explicitly documenting any Figma-specific extensions you need.

<https://www.designtokens.org/tr/2025.10/> 

### D. Figma Dev Mode MCP

Figma MCP Server is another development worth understanding.

Figma[ MCP Server documentation ](https://developers.figma.com/docs/figma-mcp-server/?utm_source=chatgpt.com)

MCP (Model Context Protocol) allows AI development tools to retrieve design context from Figma.

This is useful for:

- Reading design specifications.
- Understanding component structures.
- Inspecting design properties.
- Giving AI coding agents access to design context.
- Connecting design decisions to implementation.

Combined with Code Connect, this is potentially very powerful for design-to-code workflows.

However, I wouldn't use MCP as your token extraction mechanism. It is designed primarily for design context and AI-assisted implementation, not deterministic, complete variable synchronisation.

Think of it as a complementary tool for the wider design system ecosystem, rather than a replacement for the Variables REST API.

## 5. How I'd implement the GitHub automation

Once the extraction and transformation logic works locally, I'd automate it with GitHub Actions.

I would deliberately use a pull-request-based workflow rather than automatically committing changes to your main branch.

The workflow would be:

1. Designer updates Figma variables

   Designers work normally, updating variables and publishing their library changes where appropriate.
2. GitHub Action retrieves variables

   Run on a schedule, manually, or through a suitable Figma change notification integration.
3. Normalisation and validation

   Convert Figma IDs, collections, modes and aliases into your canonical token structure.
4. Compare against the repository

   Identify additions, modifications and deletions.
5. Generate a pull request

   Include the changed token files and a useful summary of what changed.
6. Review and merge

   Developers review the changes, and automated tests validate the token structure.
7. Build and publish

   Style Dictionary generates the required formats and publishes versioned packages.

### Example GitHub Action

Something along these lines:

```yaml
name: Sync Figma Variables

on:
  workflow_dispatch:

  schedule:
    - cron: '0 2 * * *'

jobs:
  sync:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install dependencies
        run: npm ci

      - name: Fetch Figma variables
        run: npm run figma:sync
        env:
          FIGMA_TOKEN: ${{ secrets.FIGMA_TOKEN }}
          FIGMA_FILE_KEY: ${{ secrets.FIGMA_FILE_KEY }}

      - name: Validate tokens
        run: npm run tokens:validate

      - name: Build tokens
        run: npm run tokens:build
```

You'd then add a PR creation step using a GitHub Action such as `peter-evans/create-pull-request`.

For a production implementation, I'd also include:

- Retry handling for Figma API rate limits.
- A cached copy of the last successful extraction.
- A check that the API returned a complete dataset before replacing existing files.
- Deletion detection.
- Validation of alias references and cycles.
- A change summary in the pull request.
- Tests for every supported Figma variable type.

One operational consideration: Figma updated its REST API rate limits in November 2025. The Variables GET endpoints are Tier 2, so avoid repeatedly requesting the same file unnecessarily.

<https://developers.figma.com/docs/rest-api/rate-limits> 

<https://github.com/figma/variables-github-action-example> 

## 6. Things I'd be particularly careful about with a complex token system

There are several areas where a seemingly straightforward exporter can become problematic.

| Area | What I'd implement |
| --- | --- |
| Multiple collections | Maintain explicit collection-to-token-group mappings |
| Multiple modes | Generate independent theme files |
| Aliases | Preserve references rather than flattening values |
| Cross-collection aliases | Resolve IDs across the complete variable dataset |
| Remote variables | Track source library and subscribed IDs |
| Extended collections | Account for inherited values and overrides |
| Variable renaming | Use stable Figma IDs and keys, not just names |
| Deleted variables | Explicitly detect and report deletions |
| Variable scopes | Preserve as metadata where useful |
| Code syntax | Consider preserving platform-specific naming overrides |
| Typography | Define explicit rules for composite typography tokens |
| Colour | Preserve colour space and alpha information |

Two deserve particular attention.

Stable IDs versus token names

Never make variable names your only identifier.

A designer might rename:

```text
color/brand/primary
```

to:

```text
color/action/primary
```

You should be able to recognise that as a rename of an existing variable, rather than a deletion followed by an unrelated addition.

Use Figma's stable variable IDs and keys as your internal identity, and use names to construct the exported token paths.

Modes across different collections

Don't assume every collection has the same modes.

For example:

| Collection | Modes |
| --- | --- |
| Semantic colours | Light, Dark |
| Spacing | Compact, Comfortable |
| Typography | Desktop, Mobile |
| Primitives | Default |

These are independent dimensions of your design system.

It is tempting to combine every possible mode into a single global theme configuration, but that can create a combinatorial explosion.

Instead, decide which collections should be independently configurable and which combinations your consuming products actually need.

## 7. My recommended technology stack

If I were starting this project today, this is what I'd choose:

| Layer | Technology |
| --- | --- |
| Source | Figma Variables |
| Extraction | Figma Variables REST API |
| Language | TypeScript |
| Normalisation | Custom TypeScript module |
| Intermediate format | DTCG 2025.10-compatible JSON |
| Transformation | Style Dictionary |
| Automation | GitHub Actions |
| Review | GitHub Pull Requests |
| Distribution | GitHub Packages / npm |
| Documentation | Storybook or Zeroheight |
| Design-to-code enhancement | Code Connect + Figma MCP |

I'd keep the extraction and transformation code relatively small and focused. Don't build a massive custom token management framework when existing standards and tools already handle much of the work.

## 8. Suggested implementation roadmap

I'd tackle this in stages rather than trying to solve the entire architecture upfront.

Phase 1 — Extraction

Start here

- Connect to the Figma Variables REST API.
- Extract one representative file.
- Capture all collections, modes, types and aliases.
- Save the raw response as a reference fixture.

Phase 2 — Normalisation

- Map Figma variable types to DTCG.
- Resolve Figma IDs into token paths.
- Preserve aliases and descriptions.
- Generate separate mode files.

Phase 3 — Transformation

- Configure Style Dictionary.
- Generate CSS custom properties.
- Generate SCSS variables.
- Generate JSON and native platform outputs.

Phase 4 — Automation

- Create GitHub Actions workflows.
- Automatically detect changes.
- Open pull requests.
- Add validation and regression tests.

Phase 5 — Distribution

- Version your token packages.
- Publish to GitHub Packages or npm.
- Document how consuming applications use themes.

## 9. A few resources I'd bookmark

These are the resources I'd start with before writing much code.

| Resource | Why it's useful |
| --- | --- |
| [Figma Variables REST API ](https://developers.figma.com/docs/rest-api/variables-endpoints) | Primary extraction API |
| [Figma Plugin API ](https://developers.figma.com/docs/plugins/working-with-variables) | Alternative extraction method |
| [Figma GitHub Actions example ](https://github.com/figma/variables-github-action-example) | Reference automation implementation |
| [TokensBrücke ](https://github.com/tokens-bruecke/figma-plugin) | Ready-made exporter and CLI |
| [DTCG specification ](https://www.designtokens.org/tr/2025.10) | Token interchange standard |
| [Style Dictionary ](https://styledictionary.com) | Token transformation |
| [Figma MCP ](https://developers.figma.com/docs/figma-mcp-server) | AI-assisted design-to-code |

## My final recommendation

I would build a custom TypeScript extraction and normalisation layer around Figma's Variables REST API, use DTCG as the intermediate format, and let Style Dictionary handle all platform outputs.

I'd also investigate TokensBrücke before implementing your own exporter. It may save you a significant amount of development time, or at least provide a useful reference for handling the more complicated variable types and modes.

The most important thing is not to make your repository a simple collection of converted JSON files. Make it a properly versioned design-token distribution system.

That distinction will become increasingly valuable as your design system grows.

## One question that would materially influence the architecture

Does your organisation have a Figma Enterprise plan with Full seats, or are you working with Professional/Organization?

This is important because it determines whether you can build directly around the Variables REST API or whether I'd recommend a different extraction architecture using the Plugin API or a hybrid approach.
