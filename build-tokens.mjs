import StyleDictionary from "style-dictionary";
import { getReferences, usesReferences } from "style-dictionary/utils";
import {
  register,
  permutateThemes,
} from "@tokens-studio/sd-transforms";
import { promises } from "node:fs";
import { primitiveFilter } from "./sd-filters.mjs";
import {
  generateSemanticFiles,
  generateComponentFiles,
} from "./sd-file-generators.mjs";

register(StyleDictionary);

// list of components that we have tokens for, assume the tokenset path for it is tokens/${comp}.tokens.json
const components = ["button", "card"];

async function run() {
  const $themes = JSON.parse(await promises.readFile("tokens/$themes.tokens.json"));
  const themes = permutateThemes($themes);
  // collect all tokensets for all themes and dedupe
  const tokensets = [
    ...new Set(
      Object.values(themes).reduce((acc, sets) => [...acc, ...sets], [])
    ),
  ];
  // figure out which tokensets are theme-specific
  // this is determined by checking if a certain tokenset is used for EVERY theme dimension variant
  // if it is, then it is not theme-specific
  const themeableSets = tokensets.filter((set) => {
    return !Object.values(themes).every((sets) => sets.includes(set));
  });

  const configs = Object.entries(themes).map(([theme, sets]) => ({
    source: sets.map((tokenset) => `tokens/${tokenset}.tokens.json`),
    // these are the defaults
    log: {
      warnings: 'error', // 'warn' | 'error' | 'disabled'
      verbosity: 'default', // 'default' | 'silent' | 'verbose'
      errors: {
        brokenReferences: 'throw', // 'throw' | 'console'
      },
    },
    platforms: {
      android: {
        transformGroup: 'tokens-studio',
        transforms: [
          'ts/descriptionToComment',
          'ts/size/px',
          'ts/opacity',
          'ts/size/lineheight',
          'ts/resolveMath',
          'ts/color/modifiers',
          'ts/typography/compose/shorthand',
          'ts/typography/fontWeight',
          'ts/size/css/letterspacing',
          'ts/color/css/hexrgba',
          'ts/color/modifiers',
          'attribute/themeable'
        ],
        expand: true,
        files: [
          // primitive tokens, e.g. for application developer
          {
            destination: "src/android/styles/primitive.tokens.xml",
            format: "android/resources",
            filter: primitiveFilter,
          },
          // semantic tokens, e.g. for application developer
          ...generateSemanticFiles(components, theme, 'android', 'xml'),
          // component tokens, e.g. for design system developer
          ...generateComponentFiles(components, theme, 'android', 'xml'),
        ],
      },
      js: {
        transformGroup: 'tokens-studio',
        transforms: [
          'ts/descriptionToComment',
          'ts/size/px',
          'ts/opacity',
          'ts/size/lineheight',
          'ts/typography/fontWeight',
          'ts/resolveMath',
          'ts/size/css/letterspacing',
          'ts/color/css/hexrgba',
          'ts/color/modifiers',
          'attribute/themeable'
        ],
        expand: true,
        files: [
          // primitive tokens, e.g. for application developer
          {
            destination: "src/js/styles/primitive.tokens.js",
            format: "javascript/es6",
            filter: primitiveFilter,
          },
          // semantic tokens, e.g. for application developer
          ...generateSemanticFiles(components, theme, 'js', 'js'),
          // component tokens, e.g. for design system developer
          ...generateComponentFiles(components, theme, 'js', 'js'),
        ],
      },
      scss: {
        transformGroup: 'tokens-studio',
        transforms: [
          'ts/descriptionToComment',
          'ts/size/px',
          'ts/opacity',
          'ts/size/lineheight',
          'ts/typography/fontWeight',
          'ts/resolveMath',
          'ts/size/css/letterspacing',
          'ts/color/css/hexrgba',
          'ts/color/modifiers',
          'attribute/themeable'
        ],
        expand: true,
        files: [
          // primitive tokens, e.g. for application developer
          {
            destination: "src/scss/styles/primitive.tokens.scss",
            format: "scss/variables",
            filter: primitiveFilter,
          },
          // semantic tokens, e.g. for application developer
          ...generateSemanticFiles(components, theme, 'scss', 'scss'),
          // component tokens, e.g. for design system developer
          ...generateComponentFiles(components, theme, 'scss', 'scss'),
        ],
      },
      css: {
        transformGroup: "tokens-studio",
        // transforms: ["attribute/themeable", "name/kebab"],
        transforms: [
          'ts/descriptionToComment',
          'ts/size/px',
          'ts/opacity',
          'ts/size/lineheight',
          'ts/typography/fontWeight',
          'ts/resolveMath',
          'ts/size/css/letterspacing',
          'ts/color/css/hexrgba',
          'ts/color/modifiers',
          'attribute/themeable',
          'name/kebab',
        ],
        expand: true,
        files: [
          // primitive tokens, e.g. for application developer
          {
            destination: "src/css/styles/primitive.tokens.css",
            format: "css/variables",
            filter: primitiveFilter,
          },
          // semantic tokens, e.g. for application developer
          ...generateSemanticFiles(components, theme, 'css', 'css'),
          // component tokens, e.g. for design system developer
          ...generateComponentFiles(components, theme, 'css', 'css'),
        ],
      },
    },
  }));

  for (const cfg of configs) {
    const sd = new StyleDictionary(cfg);

    /**
     * This transform checks for each token whether that token's value could change
     * due to Tokens Studio theming.
     * Any tokenset from Tokens Studio marked as "enabled" in the $themes.json is considered
     * a set in which any token could change if the theme changes.
     * Any token that is inside such a set or is a reference with a token in that reference chain
     * that is inside such a set, is considered "themeable",
     * which means it could change by theme switching.
     *
     * This metadata is applied to the token so we can use it as a way of filtering outputs
     * later in the "format" stage.
     */
    sd.registerTransform({
      name: "attribute/themeable",
      type: "attribute",
      transform: (token) => {
        function isPartOfEnabledSet(token) {
          const set = token.filePath
            .replace(/^tokens\//g, "")
            .replace(/.tokens.json$/g, "");
          return themeableSets.includes(set);
        }

        // Set token to themeable if it's part of an enabled set
        if (isPartOfEnabledSet(token)) {
          return {
            themeable: true,
          };
        }

        // Set token to themeable if it's using a reference and inside the reference chain
        // any one of them is from a themeable set
        if (usesReferences(token.original.value)) {
          const refs = getReferences(token.original.value, sd.tokens);
          if (refs.some((ref) => isPartOfEnabledSet(ref))) {
            return {
              themeable: true,
            };
          }
        }
      },
    });

    await sd.cleanAllPlatforms();
    await sd.buildAllPlatforms();
  }
}
run();
