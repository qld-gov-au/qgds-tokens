import { describe, expect, it } from "@jest/globals";
import type {
  GetLocalVariablesResponse,
  LocalVariable,
  LocalVariableCollection,
} from "@figma/rest-api-spec";
import {
  analyzeFigmaColorVariables,
  filterFigmaColorVariables,
} from "../src/filterFigmaColors";

/**
 * Creates a minimal Figma variable collection fixture.
 *
 * @param id - Collection ID.
 * @param name - Collection name.
 * @returns A local variable collection fixture.
 */
function createCollection(
  id: string,
  name: string,
  remote = false,
): LocalVariableCollection {
  const modeId = `${id}-mode`;
  return {
    id,
    name,
    key: `${id}-key`,
    modes: [{ modeId, name: "Default" }],
    defaultModeId: modeId,
    remote,
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
  remote = false,
): LocalVariable {
  return {
    id,
    name,
    key: `${id}-key`,
    variableCollectionId: collectionId,
    resolvedType,
    valuesByMode: {},
    remote,
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
    remoteTheme: createCollection("remote-theme", "Theme", true),
    palette: createCollection("palette", "Palette"),
    remotePalette: createCollection("remote-palette", "Palette", true),
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
        "remote-theme-color": createVariable(
          "remote-theme-color",
          "Text/Remote",
          "remote-theme",
        ),
        "palette-neutral": createVariable(
          "palette-neutral",
          "Neutral/500",
          "palette",
        ),
        "remote-palette-color": createVariable(
          "remote-palette-color",
          "Neutral/Remote",
          "remote-palette",
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
        "remote-variable": createVariable(
          "remote-variable",
          "Brand/Remote",
          "base",
          "COLOR",
          true,
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
    expect(Object.keys(response.meta.variables)).toHaveLength(11);
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

  it("excludes deleted variables and reports deleted and unresolved aliases", () => {
    const response = createResponse();
    const deleted = createVariable("deleted-color", "Brand/Deleted", "base");
    deleted.deletedButReferenced = true;
    response.meta.variables["deleted-color"] = deleted;

    const aliased = response.meta.variables["base-blue"];
    if (!aliased) {
      throw new Error("Missing base color fixture.");
    }
    aliased.valuesByMode["base-mode"] = {
      type: "VARIABLE_ALIAS",
      id: "missing-target",
    };

    const analysis = analyzeFigmaColorVariables(response);
    const filtered = filterFigmaColorVariables(response);

    expect(analysis.excludedDeletedVariables).toBe(1);
    expect(analysis.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "deleted-but-referenced",
          variableId: "deleted-color",
        }),
        expect.objectContaining({
          code: "unresolved-alias-target",
          variableId: "base-blue",
          targetId: "missing-target",
          modeName: "Default",
        }),
      ]),
    );
    expect(filtered.meta.variables["deleted-color"]).toBeUndefined();
  });

  it("counts composed color values without reporting them as issues", () => {
    const response = createResponse();
    const paletteColor = response.meta.variables["palette-neutral"];
    if (!paletteColor) {
      throw new Error("Missing palette color fixture.");
    }
    paletteColor.valuesByMode["palette-mode"] = {
      color: { type: "VARIABLE_ALIAS", id: "base-blue" },
      opacity: { type: "VARIABLE_ALIAS", id: "opacity-token" },
    };

    const analysis = analyzeFigmaColorVariables(response);

    expect(analysis.composedColorValues).toBe(1);
    expect(analysis.issues).not.toContainEqual(
      expect.objectContaining({ code: "composed-color" }),
    );
    expect(analysis.issues).toContainEqual(
      expect.objectContaining({
        code: "unresolved-alias-target",
        variableId: "palette-neutral",
      }),
    );
  });
});
