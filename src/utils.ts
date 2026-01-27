import path from "path";
import { REGEX_TOKEN_REFERENCE_VALUE } from "./constants";
import { FigmaColorTokenValue } from "./types";

export function getParentFolderFromFilePath(filePath: string): string {
  return path.dirname(filePath).split(path.sep).pop() || "";
}

export function isReference(tokenValue: any): boolean {
  return (
    typeof tokenValue === "string" &&
    REGEX_TOKEN_REFERENCE_VALUE.test(tokenValue)
  );
}

export function isFigmaColorTokenValue(value: any): value is FigmaColorTokenValue {
    return (
        typeof value === "object" &&
        value !== null &&
        "colorSpace" in value &&
        "components" in value &&
        Array.isArray(value.components) &&
        value.components.length === 3 &&
        "alpha" in value &&
        "hex" in value
    );
}
