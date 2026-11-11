import type { Config } from "style-dictionary";
import { formats } from "style-dictionary/enums";
import { DIST_BUILD_DIR } from "./constants";
import StyleDictionary from "style-dictionary";

// getConfig to enable custom brand folder paths
export function getStyleDictionaryColorsConfig(brand: string): Config {
  return {
    source: [`tokens/${brand}/**/*.tokens.json`],
    log: {
      warnings: "warn", // 'warn' | 'error' | 'disabled'
      verbosity: "verbose", // 'default' | 'silent' | 'verbose'
      errors: {
        brokenReferences: "throw", // 'throw' | 'console'
      },
    },
    platforms: {
      scss: {
        transformGroup: "custom/scss",
        buildPath: `${DIST_BUILD_DIR}/scss/${brand}/`,
        files: [
          {
            destination: `color.scss`,
            format: formats.scssVariables,
          },
        ],
      },
      css: {
        transformGroup: "custom/scss",
        buildPath: `${DIST_BUILD_DIR}/css/${brand}/`,
        files: [
          {
            destination: `color.css`,
            format: formats.cssVariables,
          },
        ],
      },
    },
  };
}

export function getConfig(device: string): Config {
  return {
    source: [
      `figma-exports/Base/**/*.tokens.json`,
      `figma-exports/Responsive/**/*${device}.tokens.json`,
    ],
    log: {
      warnings: "error", // 'warn' | 'error' | 'disabled'
      verbosity: "verbose", // 'default' | 'silent' | 'verbose'
      errors: {
        brokenReferences: "throw", // 'throw' | 'console'
      },
    },
    platforms: {
      scss: {
        transformGroup: "scss",
        buildPath: `${DIST_BUILD_DIR}/scss/`,
        files: [
          {
            destination: `tokens.${device}.scss`,
            format: formats.scssVariables,
          },
        ],
      },
      css: {
        transformGroup: "scss",
        buildPath: `${DIST_BUILD_DIR}/css/`,
        files: [
          {
            destination: `tokens.${device}.css`,
            format: formats.cssVariables,
          },
        ],
      },
    },
  };
}
