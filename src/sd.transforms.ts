import { getParentFolderFromFilePath } from "./utils";
import path from "path";
import type { Transform } from "style-dictionary/types";

const colorModes = ["light", "dark"] as const;

// Transform for color primitives token names

// Transform for color palette token names
export const qgdsColorModeAndPaletteTransform: Transform = {
  type: "name",
  name: "name/qgds-color-mode-and-palette",
  transitive: false,
  filter: (token) =>
    token.$type === "color" &&
    getParentFolderFromFilePath(token.filePath || "").toLowerCase() !==
      "primitives",
  transform: (token) => {
    const modeName = path
      .basename(token.filePath)
      .replace(/\.tokens.json$/i, "") // remove file extension
      .replace(/\s*\([^)]*\)\s*/g, "") // remove anything in parentheses
      .trim()
      .toLowerCase();
    const paletteName = getParentFolderFromFilePath(token.filePath)
      .replace(/\s*\([^)]*\)\s*/g, "") // remove anything in parentheses
      .trim()
      .toLowerCase();

    return `${modeName in colorModes ? modeName + "-" : ""}${paletteName === "color" || paletteName === "mode 1" ? "default" : paletteName}-${token.name}`;
  },
};
