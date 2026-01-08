import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

const figmaExportsPath = path.join(process.cwd(), "figma-exports");
const buildPath = "./tokens";
const paletteFolderNames = {
  default: "Color (Core)",
  shade: "shade (dark)",
  "shade-alt": "shade alt (dark alt)",
  tint: "tint (light)",
  "tint-alt": "tint alt (light alt)",
};
const modeFileNames = {
  light: "Light.tokens.json",
  dark: "Dark.tokens.json",
};

/**
 * Recursively walk `folderPath` and extract any .zip files found.
 * @param {string} dir The path to the directory to process.
 */
function unzipFiles(dir: string) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      unzipFiles(fullPath);
    } else if (
      entry.isFile() &&
      path.extname(entry.name).toLowerCase() === ".zip"
    ) {
      const zipPath = fullPath;
      const extractDir = zipPath.replace(/\.zip$/i, "");

      fs.rmSync(extractDir, { force: true, recursive: true });

      const zip = new AdmZip(zipPath);
      zip.extractAllTo(extractDir, true);

      fs.rmSync(zipPath);
    }
  }
}

/**
 * Processes the default Figma export into a more generic colors.tokens.json
 * structure, organizing by mode and palette, and updating references accordingly.
 * @param {string} themeFolder The name of the theme folder to process.
 */
function processFiles(themeFolder: string) {
  const figmaExports = path.join(figmaExportsPath, themeFolder);

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
              console.log("Updating reference:", v);
              item[k] =
                `{${typeof groupNames === "string" ? groupNames : groupNames.join(".")}.${m[1]}}`;
              console.log("  to:", item[k]);
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
    const themeBuildPath = path.join(buildPath, themeFolder);
    fs.rmSync(themeBuildPath, { force: true, recursive: true });
    fs.mkdirSync(themeBuildPath, { recursive: true });

    const outPath = path.join(themeBuildPath, "color.tokens.json");
    fs.writeFileSync(outPath, JSON.stringify(colorTokens, null, 2), "utf-8");
    console.log(`Wrote ${outPath}`);
  } catch (e) {
    // swallow write errors for now
  }
}

unzipFiles(figmaExportsPath);
processFiles("QGDS");
