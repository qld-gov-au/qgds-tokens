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

export function isFigmaColorTokenValue(
  value: any,
): value is FigmaColorTokenValue {
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

/**
 * Resolves a dot-notation path within a nested object
 * @param obj The object to traverse
 * @param path A dot-separated path (e.g., "Size.Positive")
 * @returns The value at the nested path, or undefined if not found
 */
export function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}
