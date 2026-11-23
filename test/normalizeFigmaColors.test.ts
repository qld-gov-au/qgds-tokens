import { describe, expect, it } from "@jest/globals";
import type {
  GetLocalVariablesResponse,
  LocalVariable,
  LocalVariableCollection,
} from "@figma/rest-api-spec";
import { normalizeFigmaColors } from "../src/normalizeFigmaColors";

/**
 * Creates a local Figma collection fixture.
 *
 * @param id - Collection ID.
 * @param name - Collection name.
 * @param modeNames - Names of collection modes.
 * @returns A local variable collection fixture.
 */
function createCollection(
  id: string,
  name: string,
  modeNames: string[],
): LocalVariableCollection {
  const modes = modeNames.map((modeName) => ({
    modeId: `${id}-${modeName}`,
    name: modeName,
  }));
  return {
    id,
    name,
    key: `${id}-key`,
    modes,
    defaultModeId: modes[0]?.modeId ?? "",
    remote: false,
    hiddenFromPublishing: false,
    variableIds: [],
  };
}

/**
 * Creates a Figma variable fixture.
 *
 * @param id - Variable ID.
 * @param name - Variable name.
 * @param collectionId - ID of the containing collection.
 * @param resolvedType - Figma variable type.
 * @param valuesByMode - Values keyed by collection mode ID.
 * @returns A local variable fixture.
 */
function createVariable(
  id: string,
  name: string,
  collectionId: string,
  resolvedType: LocalVariable["resolvedType"],
  valuesByMode: LocalVariable["valuesByMode"],
): LocalVariable {
  return {
    id,
    name,
    key: `${id}-key`,
    variableCollectionId: collectionId,
    resolvedType,
    valuesByMode,
    remote: false,
    description: "",
    hiddenFromPublishing: false,
    scopes: [],
    codeSyntax: {},
  };
}

/**
 * Creates a fixture with mode-specific aliases and a composed color.
 *
 * @returns A local Figma variables response fixture.
 */
function createResponse(): GetLocalVariablesResponse {
  const base = createCollection("base", "Base", ["default"]);
  const theme = createCollection("theme", "Theme", ["light", "dark"]);
  const palette = createCollection("palette", "Palette", ["default", "soft"]);

  return {
    status: 200,
    error: false,
    meta: {
      variableCollections: {
        base,
        theme,
        palette,
      },
      variables: {
        baseBlue: createVariable("base-blue", "Color/Blue", "base", "COLOR", {
          "base-default": { r: 1, g: 0, b: 0, a: 1 },
        }),
        baseGreen: createVariable(
          "base-green",
          "Color/Green",
          "base",
          "COLOR",
          {
            "base-default": { r: 0, g: 1, b: 0, a: 1 },
          },
        ),
        baseOpacity: createVariable(
          "base-opacity",
          "Opacity/Half",
          "base",
          "FLOAT",
          { "base-default": 50 },
        ),
        themeBrand: createVariable(
          "theme-brand",
          "Color/Brand",
          "theme",
          "COLOR",
          {
            "theme-light": { type: "VARIABLE_ALIAS", id: "base-blue" },
            "theme-dark": { type: "VARIABLE_ALIAS", id: "base-green" },
          },
        ),
        paletteOverlay: createVariable(
          "palette-overlay",
          "Color/Overlay",
          "palette",
          "COLOR",
          {
            "palette-default": {
              color: { type: "VARIABLE_ALIAS", id: "theme-brand" },
              opacity: { type: "VARIABLE_ALIAS", id: "base-opacity" },
            },
            "palette-soft": {
              color: { type: "VARIABLE_ALIAS", id: "theme-brand" },
              opacity: 25,
            },
          },
        ),
        paletteBrand: createVariable(
          "palette-brand",
          "Color/Brand Alias",
          "palette",
          "COLOR",
          {
            "palette-default": {
              type: "VARIABLE_ALIAS",
              id: "theme-brand",
            },
            "palette-soft": {
              type: "VARIABLE_ALIAS",
              id: "theme-brand",
            },
          },
        ),
      },
    },
  };
}

describe("normalizeFigmaColors", () => {
  it("generates one DTCG file per collection mode and preserves composition metadata", () => {
    const files = normalizeFigmaColors(createResponse());
    const base = files.find((file) => file.collection === "Base");
    const themeLight = files.find(
      (file) => file.collection === "Theme" && file.mode === "light",
    );
    const themeDark = files.find(
      (file) => file.collection === "Theme" && file.mode === "dark",
    );
    const paletteDefault = files.find(
      (file) => file.collection === "Palette" && file.mode === "default",
    );
    const paletteSoft = files.find(
      (file) => file.collection === "Palette" && file.mode === "soft",
    );

    expect(files).toHaveLength(5);
    expect(base?.fileName).toBe("base.tokens.json");
    expect(themeLight?.fileName).toBe("theme-light.tokens.json");
    expect(themeDark?.fileName).toBe("theme-dark.tokens.json");
    expect(paletteDefault?.fileName).toBe("palette-default.tokens.json");
    expect(paletteSoft?.fileName).toBe("palette-soft.tokens.json");
    expect(themeLight?.tokens["color-brand"]?.$value).toBe("{color-blue}");
    expect(themeDark?.tokens["color-brand"]?.$value).toBe("{color-green}");
    expect(paletteDefault?.tokens["color-overlay"]?.$value).toBe(
      "{color-brand}",
    );
    expect(
      paletteDefault?.tokens["color-overlay"]?.$extensions?.[
        "com.qld.gov.au.qgds-tokens"
      ].figmaComposedColor.opacityPercent,
    ).toBe(50);
    expect(
      paletteSoft?.tokens["color-overlay"]?.$extensions?.[
        "com.qld.gov.au.qgds-tokens"
      ].figmaComposedColor.opacityPercent,
    ).toBe(25);
    expect(paletteDefault?.tokens["color-brand-alias"]?.$value).toBe(
      "{color-brand}",
    );
  });

  it("detects cycles in aliases", () => {
    const response = createResponse();
    const themeBrand = response.meta.variables["themeBrand"];
    if (!themeBrand) {
      throw new Error("Missing theme color fixture.");
    }
    themeBrand.valuesByMode["theme-light"] = {
      type: "VARIABLE_ALIAS",
      id: "palette-brand",
    };

    expect(() => normalizeFigmaColors(response)).toThrow(
      /Figma variable alias cycle detected/,
    );
  });

  it("fails when an alias target is missing", () => {
    const response = createResponse();
    const themeBrand = response.meta.variables["themeBrand"];
    if (!themeBrand) {
      throw new Error("Missing theme color fixture.");
    }
    themeBrand.valuesByMode["theme-light"] = {
      type: "VARIABLE_ALIAS",
      id: "missing-color",
    };

    expect(() => normalizeFigmaColors(response)).toThrow(
      'Alias target "missing-color" does not exist in the Figma response.',
    );
  });

  it("rejects normalized token name collisions", () => {
    const response = createResponse();
    response.meta.variables["baseBlueVariant"] = createVariable(
      "base-blue-variant",
      "Color/Blue!",
      "base",
      "COLOR",
      { "base-default": { r: 0, g: 0, b: 1, a: 1 } },
    );

    expect(() => normalizeFigmaColors(response)).toThrow(
      /both normalize to "color-blue"/,
    );
  });

  it("rejects invalid composed opacity values", () => {
    const response = createResponse();
    const overlay = response.meta.variables["paletteOverlay"];
    if (!overlay) {
      throw new Error("Missing composed color fixture.");
    }
    overlay.valuesByMode["palette-default"] = {
      color: { type: "VARIABLE_ALIAS", id: "theme-brand" },
      opacity: 150,
    };

    expect(() => normalizeFigmaColors(response)).toThrow(
      /opacity outside the range 0 to 100 percent/,
    );
  });
});
