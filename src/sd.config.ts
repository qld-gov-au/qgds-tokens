import type { Config } from "style-dictionary";
import { formats } from "style-dictionary/enums";
import { BUILD_PATH } from "./constants";

// getConfig to enable custom brand folder paths
export function getStyleDictionaryConfig(brand: string): Config {
  return {
    source: [`tokens/${brand}/**/*.tokens.json`],
    log: {
      warnings: "error", // 'warn' | 'error' | 'disabled'
      verbosity: "verbose", // 'default' | 'silent' | 'verbose'
      errors: {
        brokenReferences: "throw", // 'throw' | 'console'
      },
    },
    platforms: {
      scss: {
        transformGroup: "custom/scss",
        buildPath: `${BUILD_PATH}/scss/${brand}/`,
        files: [
          {
            destination: `color.scss`,
            format: formats.scssVariables,
          },
        ],
      },
      css: {
        transformGroup: "custom/scss",
        buildPath: `${BUILD_PATH}/css/${brand}/`,
        files: [
          {
            destination: `color.css`,
            format: formats.cssVariables,
          },
        ],
      }
    },
  };
}
