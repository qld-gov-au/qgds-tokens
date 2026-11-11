import AdmZip from "adm-zip";
import fs, { existsSync } from "fs";
import path from "path";
import {
  FIGMA_EXPORT_TOKEN_PATHS,
  TOKENS_BUILD_DIR,
  FIGMA_EXPORTS_DIR,
} from "./constants";
import {
  parseDesignTokens,
  DesignTokenTree,
  ConcreteDesignTokenTree,
} from "@trufflehq/design-tokens-format-module";
import { getNestedValue } from "./utils";

// TODO: move these to constants.ts
const figmaExportsDir = path.join(process.cwd(), FIGMA_EXPORTS_DIR);
const tokensBuildDir = path.join(process.cwd(), TOKENS_BUILD_DIR);

const paletteFolderNames = {
  default: "Colour (Core)",
  shade: "shade (dark)",
  "shade-alt": "shade alt (dark alt)",
  tint: "tint (light)",
  "tint-alt": "tint alt (light alt)",
};
const modeFileNames = {
  light: "Light.tokens.json",
  dark: "_Deprecated.tokens.json",
};

/**
 * Recursively walk `folderPath` and extract any .zip files found.
 * @param {string} dir The path to the directory to process.
 */
function unzipFiles(dir: string, deleteAfterUnzip = false) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      unzipFiles(fullPath, deleteAfterUnzip);
    } else if (
      entry.isFile() &&
      path.extname(entry.name).toLowerCase() === ".zip"
    ) {
      const zipPath = fullPath;
      const extractDir = zipPath.replace(/\.zip$/i, "");

      fs.rmSync(extractDir, { force: true, recursive: true });

      const zip = new AdmZip(zipPath);
      zip.extractAllTo(extractDir, true);

      if (deleteAfterUnzip) fs.rmSync(zipPath);
    }
  }
}

/**
 * Processes the default Figma export into a more generic colors.tokens.json
 * structure, organizing by mode and palette, and updating references accordingly.
 * @param {string} themeFolder The name of the theme folder to process.
 */
function processColorFiles(themeFolder: string) {
  const figmaExports = path.join(figmaExportsDir, themeFolder);

  if (!fs.existsSync(figmaExports)) {
    throw new Error(`Theme folder does not exist: ${figmaExports}`);
  }

  const primitives = require(
    path.join(figmaExports, "Primitives", "Mode 1.tokens.json"),
  )["Base Colour"];

  let colorTokens: {
    [key: string]: any;
  } = {};

  // recursively prefix references in $value fields, returns updated copy
  const updateTokenReferences = (
    obj: any,
    groupNames: string[] | string,
  ): any => {
    const updated = JSON.parse(JSON.stringify(obj));

    const traverse = (item: any) => {
      if (Array.isArray(item)) {
        item.forEach(traverse);
        return;
      }
      if (item && typeof item === "object") {
        for (const k of Object.keys(item)) {
          const v = item[k];
          if (k === "$value" && typeof v === "string") {
            const m = v.match(/^\{\s*([^}]+?)\s*\}$/);
            if (m) {
              // the value is a token reference, update it with prefix.
              item[k] =
                `{${typeof groupNames === "string" ? groupNames : groupNames.join(".")}.${m[1]}}`;
            }
          } else {
            traverse(v);
          }
        }
      }
    };

    traverse(updated);
    return updated;
  };

  // attach primitives (with prefixed references)
  colorTokens["primitives"] = updateTokenReferences(primitives, "primitives");

  // load each mode file (Light and Dark) and place under appropriate mode/palette
  Object.entries(paletteFolderNames).forEach(([paletteName, folderName]) => {
    for (const mode in modeFileNames) {
      try {
        const modePath = path.join(
          figmaExports,
          folderName,
          modeFileNames[mode as keyof typeof modeFileNames],
        );
        if (fs.existsSync(modePath)) {
          const tokensObject = require(modePath);
          colorTokens[mode] = colorTokens[mode] || {};
          colorTokens[mode][paletteName] = updateTokenReferences(tokensObject, [
            mode,
            paletteName,
          ]);
        } else {
          console.warn(`Missing expected file: ${modePath}`);
        }
      } catch (e) {
        console.error("Something went wrong: ", e);
        // ignore missing or parse errors for individual files
      }
    }
  });

  // ensure output dir exists and write file
  try {
    const themeBuildPath = path.join(TOKENS_BUILD_DIR, themeFolder);
    fs.rmSync(themeBuildPath, { force: true, recursive: true });
    fs.mkdirSync(themeBuildPath, { recursive: true });

    const outPath = path.join(themeBuildPath, "color.tokens.json");
    fs.writeFileSync(outPath, JSON.stringify(colorTokens, null, 2), "utf-8");
    console.log(`Wrote ${outPath}`);
  } catch (e) {
    // swallow write errors for now
  }
}

function processTokenFiles() {
  // For each entry in FIGMA_EXPORT_TOKEN_PATH, copy the objects into a file named ${key}.tokens.json
  let tokenFiles: { fileName: string; tokens: ConcreteDesignTokenTree }[] = [];

  for (const [key, value] of Object.entries(FIGMA_EXPORT_TOKEN_PATHS)) {
    const { sets, applyModesAs } = value;

    sets.forEach((set) => {
      const { collection } = set;
      const paths = Array.isArray(set.paths) ? set.paths : [set.paths];

      // Modes are organised into separated files
      const modeFiles = fs.readdirSync(path.join(figmaExportsDir, collection));

      // If only one mode, job is easy
      const hasModes = modeFiles.length > 1;

      modeFiles.forEach((file) => {
        let tokens: ConcreteDesignTokenTree = {};

        const tree = parseDesignTokens(
          require(path.join(figmaExportsDir, collection, file)),
        );

        // Might need to change based on applyModesAs
        const outFile = hasModes
          ? `${key}.${file.replace(/\.tokens\.json$/, "")}.tokens.json`
          : `${key}.tokens.json`;

        paths.forEach((path) => {
          try {
            tokens = {
              ...tokens,
              ...getNestedValue(tree, path),
            };
          } catch (e) {
            console.error(
              `There was a problem writing path ${path} from ${collection}/${file} to file ${key}.tokens.json`,
            );
          }
        });

        // Add the collected tokens to tokenFiles, ready to be written.
        tokenFiles = [
          ...tokenFiles,
          {
            fileName: outFile,
            tokens,
          },
        ];
      });
    });
  }

  console.log(tokenFiles);
  // Loop through tokenFiles and write to disk
  tokenFiles.forEach((obj) => {
    const outPath = path.join(tokensBuildDir, obj.fileName);
    try {
      fs.writeFileSync(outPath, JSON.stringify(obj.tokens, null, 2), "utf-8");
      console.log(`Wrote ${outPath}`);
    } catch (e) {
      console.error(`There was a problem writing ${outPath}`);
      // swallow write errors for now
    }
  });
}

unzipFiles(figmaExportsDir, false);
fs.rmSync(tokensBuildDir, { force: true, recursive: true });
fs.mkdirSync(tokensBuildDir, { recursive: true });
// processColorFiles("QGDS");
processTokenFiles();
