import { describe, expect, it } from "@jest/globals";
import type {
  GetLocalVariablesResponse,
  LocalVariable,
  LocalVariableCollection,
} from "@figma/rest-api-spec";
import { filterFigmaColorVariables } from "../src/filterFigmaColors";

/**
 * Creates a minimal Figma variable collection fixture.
 *
 * @param id - Collection ID.
 * @param name - Collection name.
 * @returns A local variable collection fixture.
 */
function createCollection(id: string, name: string): LocalVariableCollection {
  const modeId = `${id}-mode`;
  return {
    id,
    name,
    key: `${id}-key`,
    modes: [{ modeId, name: "Default" }],
    defaultModeId: modeId,
    remote: false,
    hiddenFromPublishing: false,
    variableIds: [],
  };
}

/**
 * Creates a minimal Figma variable fixture.
 *
 * @param id - Variable ID.
 * @param name - Variable name.
 * @param collectionId - ID of the containing collection.
 * @param resolvedType - Figma variable type.
 * @returns A local variable fixture.
 */
function createVariable(
  id: string,
  name: string,
  collectionId: string,
  resolvedType: LocalVariable["resolvedType"] = "COLOR",
): LocalVariable {
  return {
    id,
    name,
    key: `${id}-key`,
    variableCollectionId: collectionId,
    resolvedType,
    valuesByMode: {},
    remote: false,
    description: "",
    hiddenFromPublishing: false,
    scopes: [],
    codeSyntax: {},
  };
}

/**
 * Creates a Figma local variables response containing selected and ignored data.
 *
 * @param collections - Collections to include in the fixture.
 * @returns A local variables response fixture.
 */
function createResponse(
  collections: Record<string, LocalVariableCollection> = {
    base: createCollection("base", "Base"),
    theme: createCollection("theme", "Theme"),
    palette: createCollection("palette", "Palette"),
    other: createCollection("other", "Other"),
    archived: createCollection("archived", "_Archive"),
  },
): GetLocalVariablesResponse {
  return {
    status: 200,
    error: false,
    meta: {
      variableCollections: collections,
      variables: {
        "base-blue": createVariable("base-blue", "Brand/Blue", "base"),
        "theme-primary": createVariable(
          "theme-primary",
          "Text/Primary",
          "theme",
        ),
        "palette-neutral": createVariable(
          "palette-neutral",
          "Neutral/500",
          "palette",
        ),
        "other-color": createVariable("other-color", "Color", "other"),
        "archived-color": createVariable("archived-color", "Color", "archived"),
        "underscore-token": createVariable(
          "underscore-token",
          "_Deprecated",
          "base",
        ),
        "underscore-path": createVariable(
          "underscore-path",
          "Brand/_Deprecated",
          "theme",
        ),
        "non-color": createVariable(
          "non-color",
          "Font Family",
          "base",
          "STRING",
        ),
      },
    },
  };
}

describe("filterFigmaColorVariables", () => {
  it("keeps colors from supported collections and excludes underscore names", () => {
    const response = createResponse();

    const filtered = filterFigmaColorVariables(response);

    expect(Object.keys(filtered.meta.variableCollections)).toEqual([
      "base",
      "theme",
      "palette",
    ]);
    expect(Object.keys(filtered.meta.variables)).toEqual([
      "base-blue",
      "theme-primary",
      "palette-neutral",
    ]);
    expect(filtered.meta.variableCollections["base"]?.modes).toEqual([
      { modeId: "base-mode", name: "Default" },
    ]);
    expect(Object.keys(response.meta.variables)).toHaveLength(8);
  });

  it("fails when a supported collection is missing", () => {
    const response = createResponse({
      base: createCollection("base", "Base"),
      theme: createCollection("theme", "Theme"),
    });

    expect(() => filterFigmaColorVariables(response)).toThrow(
      'Expected exactly one Figma variable collection named "Palette", found 0.',
    );
  });

  it("fails when a supported collection name is ambiguous", () => {
    const response = createResponse({
      base: createCollection("base", "Base"),
      secondBase: createCollection("secondBase", "Base"),
      theme: createCollection("theme", "Theme"),
      palette: createCollection("palette", "Palette"),
    });

    expect(() => filterFigmaColorVariables(response)).toThrow(
      'Expected exactly one Figma variable collection named "Base", found 2.',
    );
  });
});
