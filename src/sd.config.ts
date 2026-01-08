import type { Config, Tokens, File } from "style-dictionary";

const buildPath = "dist";

function generateFilesByMode(modes: string[], extension: string): File[] {
  console.log(modes);
  return modes?.map((mode) => ({
    // output the component tokens in the right folder and file e.g. components/button/button-vars.css
    destination: `${mode}.${extension}`,
    format: "scss/variables",
    filter: (token) => token["$extensions"]["com.figma.modename"] === mode,
  }));
}

export default <Config>{
  source: ["figma-exports/Color/*.json"],
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
      transforms: ["name/kebab"],
      buildPath: `${buildPath}/scss/`,
      files: [...generateFilesByMode(["Core"], "scss")],
    },
    // css: {
    //   transformGroup: "css",
    //   buildPath: `${buildPath}/css/`,
    //   files: [{ destination: "variables.css", format: "css/variables" }],
    // },
    // js: {
    //   transformGroup: "js",
    //   buildPath: `${buildPath}/js/`,
    //   files: [{ destination: "variables.js", format: "javascript/es6" }],
    // },
    // json: {
    //   transformGroup: "js",
    //   buildPath: `${buildPath}/json/`,
    //   files: [{ destination: "variables.json", format: "json/flat" }],
    // },
  },
};
