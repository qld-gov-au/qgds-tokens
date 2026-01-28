import { getParentFolderFromFilePath } from "./utils";
import path from "path";
import type { Transform } from "style-dictionary/types";
import { isReference, isFigmaColorTokenValue } from "./utils";

const colorModes = ["light", "dark"];

// Transform for color primitives token names

// Transform for color palette token names
export const ColorNameTransform: Transform = {
  type: "name",
  name: "ColorNameTransform",
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

export const ValueFigmaColorToHexOrRGBA: Transform = {
  type: "value",
  name: "ValueFigmaColorToHexOrRGBA",
  filter: (token) => token.$type === "color",
  transform: (token) => {
    if (isReference(token.$value)) return token.$value
    if (isFigmaColorTokenValue(token.$value)) {
      const {colorSpace, components, alpha, hex} = token.$value;
      if(alpha === 0) {
        return "transparent";
      }
      else if (alpha < 1){ 
        return `${colorSpace === "srgb" ? "rgba" : colorSpace}(${components.map(value => Math.round(value)).join(" ")} / ${Math.round(alpha * 100) / 100})`
      } else {
        return hex.toLowerCase();
      }
    }
  }
};
