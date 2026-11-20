import type {
  GetLocalVariablesResponse,
  LocalVariableCollection,
  VariableAlias,
} from "@figma/rest-api-spec";
import { COLOR_COLLECTIONS } from "./constants";

export type FigmaColorFilterIssue = {
  code:
    | "deleted-but-referenced"
    | "unresolved-alias-target"
    | "alias-target-not-exported";
  variableId: string;
  variableName: string;
  collectionName: string;
  modeName: string;
  targetId?: string;
};

export type FigmaColorFilterAnalysis = {
  selectedColorVariables: number;
  excludedDeletedVariables: number;
  composedColorValues: number;
  issues: FigmaColorFilterIssue[];
};

/**
 * Checks whether a name contains a slash-separated segment prefixed with an underscore.
 *
 * @param name - Figma collection or variable name to inspect.
 * @returns Whether any name segment is hidden by the underscore convention.
 */
function hasUnderscorePrefixedSegment(name: string): boolean {
  return name.split("/").some((segment) => segment.trimStart().startsWith("_"));
}

/**
 * Selects the unique local collection for each supported collection name.
 *
 * @param response - Successful local variables response from Figma.
 * @returns The selected local collections keyed by collection ID.
 * @throws {Error} If a required collection is missing or has an ambiguous name.
 */
function getColorCollections(
  response: GetLocalVariablesResponse,
): Record<string, LocalVariableCollection> {
  const collections: Record<string, LocalVariableCollection> = {};

  for (const name of COLOR_COLLECTIONS) {
    const matches = Object.entries(response.meta.variableCollections).filter(
      ([, collection]) =>
        !collection.remote &&
        !hasUnderscorePrefixedSegment(collection.name) &&
        collection.name === name,
    );

    const match = matches[0];
    if (matches.length !== 1 || !match) {
      throw new Error(
        `Expected exactly one Figma variable collection named "${name}", found ${matches.length}.`,
      );
    }

    const [collectionId, collection] = match;
    collections[collectionId] = collection;
  }

  return collections;
}

/**
 * Checks whether a value is a Figma variable alias.
 *
 * @param value - Figma variable value to inspect.
 * @returns Whether the value is a variable alias.
 */
function isVariableAlias(value: unknown): value is VariableAlias {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "VARIABLE_ALIAS" &&
    "id" in value &&
    typeof value.id === "string"
  );
}

/**
 * Gets alias targets from a direct or composed Figma variable value.
 *
 * @param value - Figma variable value to inspect.
 * @returns The value parts and IDs of aliases contained in the value.
 */
function getAliasTargets(value: unknown): { part: string; id: string }[] {
  if (isVariableAlias(value)) {
    return [{ part: "value", id: value.id }];
  }

  if (typeof value !== "object" || value === null || !("color" in value)) {
    return [];
  }

  const aliases: { part: string; id: string }[] = [];
  if (isVariableAlias(value.color)) {
    aliases.push({ part: "color", id: value.color.id });
  }
  if ("opacity" in value && isVariableAlias(value.opacity)) {
    aliases.push({ part: "opacity", id: value.opacity.id });
  }
  return aliases;
}

/**
 * Analyzes selected color variables for entries that should be excluded or need review.
 *
 * @param response - Successful local variables response from Figma.
 * @returns Counts and structured issues for the selected local color variables.
 * @throws {Error} If a required collection is missing or has an ambiguous name.
 */
export function analyzeFigmaColorVariables(
  response: GetLocalVariablesResponse,
): FigmaColorFilterAnalysis {
  const collections = getColorCollections(response);
  const collectionIds = new Set(Object.keys(collections));
  const collectionNames = new Map(
    Object.entries(collections).map(([id, collection]) => [
      id,
      collection.name,
    ]),
  );
  const modesByCollection = new Map(
    Object.entries(collections).map(([id, collection]) => [
      id,
      new Map(collection.modes.map((mode) => [mode.modeId, mode.name])),
    ]),
  );
  const candidateVariables = Object.values(response.meta.variables).filter(
    (variable) =>
      variable.resolvedType === "COLOR" &&
      !variable.remote &&
      collectionIds.has(variable.variableCollectionId) &&
      !hasUnderscorePrefixedSegment(variable.name),
  );
  const exportedVariableIds = new Set(
    candidateVariables
      .filter((variable) => !variable.deletedButReferenced)
      .map((variable) => variable.id),
  );
  const variablesById = new Map(
    Object.values(response.meta.variables).map((variable) => [
      variable.id,
      variable,
    ]),
  );
  const issues: FigmaColorFilterIssue[] = [];
  let excludedDeletedVariables = 0;
  let composedColorValues = 0;

  for (const variable of candidateVariables) {
    const collectionName =
      collectionNames.get(variable.variableCollectionId) ?? "Unknown";
    if (variable.deletedButReferenced) {
      excludedDeletedVariables += 1;
      issues.push({
        code: "deleted-but-referenced",
        variableId: variable.id,
        variableName: variable.name,
        collectionName,
        modeName: "",
      });
      continue;
    }

    const modes = modesByCollection.get(variable.variableCollectionId);
    for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
      const modeName = modes?.get(modeId) ?? modeId;
      if (
        typeof value === "object" &&
        value !== null &&
        "color" in value &&
        "opacity" in value
      ) {
        composedColorValues += 1;
      }

      for (const alias of getAliasTargets(value)) {
        const target = variablesById.get(alias.id);
        if (!target || target.deletedButReferenced) {
          issues.push({
            code: "unresolved-alias-target",
            variableId: variable.id,
            variableName: variable.name,
            collectionName,
            modeName,
            targetId: alias.id,
          });
        } else if (
          alias.part !== "opacity" &&
          !exportedVariableIds.has(alias.id)
        ) {
          issues.push({
            code: "alias-target-not-exported",
            variableId: variable.id,
            variableName: variable.name,
            collectionName,
            modeName,
            targetId: alias.id,
          });
        }
      }
    }
  }

  return {
    selectedColorVariables:
      candidateVariables.length - excludedDeletedVariables,
    excludedDeletedVariables,
    composedColorValues,
    issues,
  };
}

/**
 * Selects local color variables from the Base, Theme, and Palette collections.
 *
 * @param response - Successful local variables response from Figma.
 * @returns A new response containing only selected collections and visible color variables.
 * @throws {Error} If a required collection is missing or has an ambiguous name.
 */
export function filterFigmaColorVariables(
  response: GetLocalVariablesResponse,
): GetLocalVariablesResponse {
  const variableCollections = getColorCollections(response);
  const collectionIds = new Set(Object.keys(variableCollections));

  const variables = Object.fromEntries(
    Object.entries(response.meta.variables).filter(
      ([, variable]) =>
        variable.resolvedType === "COLOR" &&
        !variable.remote &&
        !variable.deletedButReferenced &&
        collectionIds.has(variable.variableCollectionId) &&
        !hasUnderscorePrefixedSegment(variable.name),
    ),
  );

  return {
    ...response,
    meta: {
      ...response.meta,
      variables,
      variableCollections,
    },
  };
}
