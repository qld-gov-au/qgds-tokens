import type {
  GetLocalVariablesResponse,
  LocalVariableCollection,
} from "@figma/rest-api-spec";
import { COLOR_COLLECTIONS } from "./constants";

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
 * Selects color variables from the Base, Theme, and Palette collections.
 *
 * @param response - Successful local variables response from Figma.
 * @returns A new response containing only selected collections and visible color variables.
 * @throws {Error} If a required collection is missing or has an ambiguous name.
 */
export function filterFigmaColorVariables(
  response: GetLocalVariablesResponse,
): GetLocalVariablesResponse {
  const variableCollections: Record<string, LocalVariableCollection> = {};
  const collectionIds = new Set<string>();

  for (const name of COLOR_COLLECTIONS) {
    const matches = Object.entries(response.meta.variableCollections).filter(
      ([, collection]) =>
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
    variableCollections[collectionId] = collection;
    collectionIds.add(collectionId);
  }

  const variables = Object.fromEntries(
    Object.entries(response.meta.variables).filter(
      ([, variable]) =>
        variable.resolvedType === "COLOR" &&
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
