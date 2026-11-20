import type {
  GetLocalVariablesResponse,
  LocalVariable,
  LocalVariableCollection,
  RGB,
  RGBA,
  VariableAlias,
  VariableComposedColor,
} from "@figma/rest-api-spec";
import { COLOR_COLLECTIONS } from "./constants";
import { filterFigmaColorVariables } from "./filterFigmaColors";

export type DtcgColorValue = {
  colorSpace: "srgb";
  components: [number, number, number];
  alpha: number;
  hex: string;
};

export type DtcgColorToken = {
  $type: "color";
  $value: DtcgColorValue | `{${string}}`;
  $description?: string;
  $extensions?: {
    "com.qld.gov.au.qgds-tokens": {
      figmaComposedColor: { opacityPercent: number };
    };
  };
};

export type DtcgColorDocument = Record<string, DtcgColorToken>;

export type NormalizedColorFile = {
  fileName: string;
  collection: (typeof COLOR_COLLECTIONS)[number];
  mode: string;
  tokens: DtcgColorDocument;
};

export const QGDS_FIGMA_COMPOSED_COLOR_EXTENSION = "com.qld.gov.au.qgds-tokens";

type ResolvedValue =
  | { type: "COLOR"; value: DtcgColorValue }
  | { type: "FLOAT"; value: number };

type ColorCollectionName = (typeof COLOR_COLLECTIONS)[number];
type CollectionEntry = {
  id: string;
  name: ColorCollectionName;
  collection: LocalVariableCollection;
};
type ModeNames = Record<ColorCollectionName, string>;
type VariableResolver = (variableId: string) => ResolvedValue;

/**
 * Checks whether a value is a non-null object.
 *
 * @param value - Value to inspect.
 * @returns Whether the value is a non-null object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Checks whether a value is a Figma variable alias.
 *
 * @param value - Value to inspect.
 * @returns Whether the value is a variable alias.
 */
function isVariableAlias(value: unknown): value is VariableAlias {
  return (
    isRecord(value) &&
    value["type"] === "VARIABLE_ALIAS" &&
    typeof value["id"] === "string"
  );
}

/**
 * Checks whether a value is a literal Figma RGB or RGBA color.
 *
 * @param value - Value to inspect.
 * @returns Whether the value contains numeric red, green, and blue channels.
 */
function isFigmaColor(value: unknown): value is RGB | RGBA {
  return (
    isRecord(value) &&
    typeof value["r"] === "number" &&
    typeof value["g"] === "number" &&
    typeof value["b"] === "number"
  );
}

/**
 * Checks whether a value is a composed Figma color.
 *
 * @param value - Value to inspect.
 * @returns Whether the value contains color and opacity components.
 */
function isComposedColor(value: unknown): value is VariableComposedColor {
  return isRecord(value) && "color" in value && "opacity" in value;
}

/**
 * Converts a Figma path into the required lowercase, hyphen-separated token name.
 *
 * @param variableName - Slash-separated Figma variable name.
 * @returns The normalized DTCG token name.
 * @throws {Error} If the variable name has an empty or unusable path segment.
 */
function toTokenName(variableName: string): string {
  const segments = variableName.split("/").map((segment) =>
    segment
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
  );

  if (segments.some((segment) => !segment)) {
    throw new Error(
      `Cannot convert Figma variable name "${variableName}" to a token name.`,
    );
  }

  return segments.join("-");
}

/**
 * Converts a mode name into a lowercase filename segment.
 *
 * @param modeName - Figma mode name.
 * @returns A hyphen-separated filename segment.
 * @throws {Error} If the mode name has no usable characters.
 */
function toModeSlug(modeName: string): string {
  const slug = modeName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) {
    throw new Error(
      `Cannot convert Figma mode name "${modeName}" to a filename.`,
    );
  }
  return slug;
}

/**
 * Converts a literal Figma RGB/RGBA value into a DTCG sRGB color value.
 *
 * @param color - Literal Figma color.
 * @returns A DTCG color value with a six-digit hex fallback.
 * @throws {Error} If a color component or alpha is outside the valid sRGB range.
 */
function toDtcgColor(color: RGB | RGBA): DtcgColorValue {
  const components: [number, number, number] = [color.r, color.g, color.b];
  const alpha = "a" in color ? color.a : 1;

  if (
    components.some(
      (component) =>
        !Number.isFinite(component) || component < 0 || component > 1,
    ) ||
    !Number.isFinite(alpha) ||
    alpha < 0 ||
    alpha > 1
  ) {
    throw new Error(
      "Figma color components and opacity must be between 0 and 1.",
    );
  }

  const hex = `#${components
    .map((component) =>
      Math.round(component * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

  return {
    colorSpace: "srgb",
    components,
    alpha,
    hex,
  };
}

/**
 * Creates a value resolver for one active Base, Theme, and Palette mode combination.
 *
 * @param variablesById - All variables in the original Figma response.
 * @param collectionsById - Selected collection names keyed by ID.
 * @param activeModes - Active mode IDs keyed by collection ID.
 * @param selectedCollectionIds - IDs of selected local collections.
 * @param modeNames - Active mode names keyed by collection name.
 * @returns A resolver that follows aliases and detects cycles.
 */
function createVariableResolver(
  variablesById: ReadonlyMap<string, LocalVariable>,
  collectionsById: ReadonlyMap<string, ColorCollectionName>,
  activeModes: ReadonlyMap<string, string>,
  selectedCollectionIds: ReadonlySet<string>,
  modeNames: ModeNames,
): VariableResolver {
  const resolvedCache = new Map<string, ResolvedValue>();
  const resolving = new Set<string>();
  const resolvingStack: string[] = [];

  const resolveVariable = (variableId: string): ResolvedValue => {
    const cached = resolvedCache.get(variableId);
    if (cached) {
      return cached;
    }

    const variable = variablesById.get(variableId);
    if (!variable) {
      throw new Error(
        `Alias target "${variableId}" does not exist in the Figma response.`,
      );
    }
    if (resolving.has(variableId)) {
      const cycle = [...resolvingStack, variableId]
        .map((id) => variablesById.get(id)?.name ?? id)
        .join(" -> ");
      throw new Error(`Figma variable alias cycle detected: ${cycle}.`);
    }
    if (
      variable.remote ||
      variable.deletedButReferenced ||
      !selectedCollectionIds.has(variable.variableCollectionId) ||
      variable.name
        .split("/")
        .some((segment) => segment.trimStart().startsWith("_"))
    ) {
      throw new Error(
        `Alias target "${variable.name}" (${variable.id}) is excluded from color output.`,
      );
    }

    const modeId = activeModes.get(variable.variableCollectionId);
    if (!modeId) {
      throw new Error(
        `No active mode is configured for alias target "${variable.name}".`,
      );
    }
    if (!Object.hasOwn(variable.valuesByMode, modeId)) {
      const collectionName = collectionsById.get(variable.variableCollectionId);
      throw new Error(
        `Variable "${variable.name}" has no value for active mode "${collectionName ? modeNames[collectionName] : modeId}".`,
      );
    }

    resolving.add(variableId);
    resolvingStack.push(variableId);
    try {
      const resolved = resolveVariableValue(
        variable,
        variable.valuesByMode[modeId],
      );
      resolvedCache.set(variableId, resolved);
      return resolved;
    } finally {
      resolvingStack.pop();
      resolving.delete(variableId);
    }
  };

  const resolveVariableValue = (
    variable: LocalVariable,
    value: unknown,
  ): ResolvedValue => {
    if (variable.resolvedType === "COLOR") {
      if (isVariableAlias(value)) {
        const target = resolveVariable(value.id);
        if (target.type !== "COLOR") {
          throw new Error(
            `Color variable "${variable.name}" aliases non-color variable "${value.id}".`,
          );
        }
        return target;
      }

      if (isComposedColor(value)) {
        const color = isVariableAlias(value.color)
          ? resolveVariable(value.color.id)
          : isFigmaColor(value.color)
            ? {
                type: "COLOR" as const,
                value: toDtcgColor(value.color),
              }
            : undefined;
        if (!color || color.type !== "COLOR") {
          throw new Error(
            `Composed color "${variable.name}" has an invalid color component.`,
          );
        }

        let opacity: number;
        if (isVariableAlias(value.opacity)) {
          const opacityValue = resolveVariable(value.opacity.id);
          if (opacityValue.type !== "FLOAT") {
            throw new Error(
              `Composed color "${variable.name}" aliases non-number opacity "${value.opacity.id}".`,
            );
          }
          opacity = opacityValue.value;
        } else if (typeof value.opacity === "number") {
          opacity = value.opacity;
        } else {
          throw new Error(
            `Composed color "${variable.name}" has an invalid opacity component.`,
          );
        }

        if (!Number.isFinite(opacity) || opacity < 0 || opacity > 100) {
          throw new Error(
            `Composed color "${variable.name}" has opacity outside the range 0 to 100 percent.`,
          );
        }
        return {
          type: "COLOR",
          value: {
            ...color.value,
            alpha: color.value.alpha * (opacity / 100),
          },
        };
      }

      if (isFigmaColor(value)) {
        return { type: "COLOR", value: toDtcgColor(value) };
      }
      throw new Error(
        `Color variable "${variable.name}" has an unsupported value.`,
      );
    }

    if (variable.resolvedType === "FLOAT") {
      if (isVariableAlias(value)) {
        const target = resolveVariable(value.id);
        if (target.type !== "FLOAT") {
          throw new Error(
            `Number variable "${variable.name}" aliases non-number variable "${value.id}".`,
          );
        }
        return target;
      }
      if (typeof value === "number" && Number.isFinite(value)) {
        return { type: "FLOAT", value };
      }
    }

    throw new Error(
      `Alias target "${variable.name}" has unsupported type "${variable.resolvedType}" or value.`,
    );
  };

  return resolveVariable;
}

/**
 * Validates every selected color variable for one active mode combination.
 *
 * @param variables - Selected color variables.
 * @param activeModes - Active mode IDs keyed by collection ID.
 * @param tokenNameById - Normalized names keyed by variable ID.
 * @param resolveVariable - Resolver for this mode combination.
 * @throws {Error} If a mode value is missing or cannot resolve to a color.
 */
function validateModeCombination(
  variables: LocalVariable[],
  activeModes: ReadonlyMap<string, string>,
  tokenNameById: ReadonlyMap<string, string>,
  resolveVariable: VariableResolver,
): void {
  for (const variable of variables) {
    const modeId = activeModes.get(variable.variableCollectionId);
    if (!modeId || !Object.hasOwn(variable.valuesByMode, modeId)) {
      throw new Error(
        `Color variable "${variable.name}" has no value for its active mode.`,
      );
    }

    const resolved = resolveVariable(variable.id);
    if (resolved.type !== "COLOR") {
      throw new Error(
        `Color variable "${variable.name}" did not resolve to a color.`,
      );
    }
    if (!tokenNameById.has(variable.id)) {
      throw new Error(
        `No normalized token name exists for "${variable.name}".`,
      );
    }
  }
}

/**
 * Builds one DTCG document for a selected collection mode.
 *
 * @param entry - Selected collection and its ID.
 * @param modeId - Active mode ID for the collection.
 * @param variables - Selected color variables.
 * @param tokenNameById - Normalized names keyed by variable ID.
 * @param resolveVariable - Resolver for the active combination.
 * @returns The collection's DTCG tokens for this mode.
 * @throws {Error} If a value or alias cannot be represented in the output.
 */
function createCollectionModeTokens(
  entry: CollectionEntry,
  modeId: string,
  variables: LocalVariable[],
  tokenNameById: ReadonlyMap<string, string>,
  resolveVariable: VariableResolver,
): DtcgColorDocument {
  const tokens: DtcgColorDocument = {};
  const collectionVariables = variables.filter(
    (variable) => variable.variableCollectionId === entry.id,
  );

  for (const variable of collectionVariables) {
    if (!Object.hasOwn(variable.valuesByMode, modeId)) {
      throw new Error(
        `Color variable "${variable.name}" has no value for active mode "${modeId}".`,
      );
    }
    const value = variable.valuesByMode[modeId];
    const tokenName = tokenNameById.get(variable.id);
    if (!tokenName) {
      throw new Error(
        `No normalized token name exists for "${variable.name}".`,
      );
    }

    let tokenValue: DtcgColorValue | `{${string}}`;
    let opacityPercent: number | undefined;
    if (isVariableAlias(value)) {
      const targetName = tokenNameById.get(value.id);
      if (!targetName) {
        throw new Error(
          `Alias from "${variable.name}" targets a color that is not included in the output: "${value.id}".`,
        );
      }
      tokenValue = `{${targetName}}`;
    } else if (isComposedColor(value)) {
      if (isVariableAlias(value.color)) {
        const targetName = tokenNameById.get(value.color.id);
        if (!targetName) {
          throw new Error(
            `Composed color "${variable.name}" targets a color that is not included in the output: "${value.color.id}".`,
          );
        }
        tokenValue = `{${targetName}}`;
      } else if (isFigmaColor(value.color)) {
        tokenValue = toDtcgColor(value.color);
      } else {
        throw new Error(
          `Composed color "${variable.name}" has an invalid color component.`,
        );
      }

      if (isVariableAlias(value.opacity)) {
        const resolvedOpacity = resolveVariable(value.opacity.id);
        if (resolvedOpacity.type !== "FLOAT") {
          throw new Error(
            `Composed color "${variable.name}" aliases non-number opacity "${value.opacity.id}".`,
          );
        }
        opacityPercent = resolvedOpacity.value;
      } else if (typeof value.opacity === "number") {
        opacityPercent = value.opacity;
      } else {
        throw new Error(
          `Composed color "${variable.name}" has an invalid opacity component.`,
        );
      }

      if (
        !Number.isFinite(opacityPercent) ||
        opacityPercent < 0 ||
        opacityPercent > 100
      ) {
        throw new Error(
          `Composed color "${variable.name}" has opacity outside the range 0 to 100 percent.`,
        );
      }
    } else if (isFigmaColor(value)) {
      tokenValue = toDtcgColor(value);
    } else {
      throw new Error(
        `Color variable "${variable.name}" has an unsupported value.`,
      );
    }

    const token: DtcgColorToken = {
      $type: "color",
      $value: tokenValue,
    };
    if (variable.description.trim()) {
      token.$description = variable.description;
    }
    if (opacityPercent !== undefined) {
      token.$extensions = {
        [QGDS_FIGMA_COMPOSED_COLOR_EXTENSION]: {
          figmaComposedColor: { opacityPercent },
        },
      };
    }
    tokens[tokenName] = token;
  }

  return tokens;
}

/**
 * Finds a selected collection by its supported name.
 *
 * @param entries - Selected collection entries.
 * @param name - Supported collection name.
 * @returns The matching collection entry.
 * @throws {Error} If the collection is missing.
 */
function getCollectionEntry(
  entries: CollectionEntry[],
  name: ColorCollectionName,
): CollectionEntry {
  const entry = entries.find((candidate) => candidate.name === name);
  if (!entry) {
    throw new Error(`Missing selected Figma collection "${name}".`);
  }
  return entry;
}

/**
 * Creates DTCG color documents for each selected collection mode.
 *
 * @param response - Successful local variables response from Figma.
 * @returns One normalized DTCG document per collection mode.
 * @throws {Error} If names collide, mode values are missing, or aliases cannot be resolved.
 */
export function normalizeFigmaColors(
  response: GetLocalVariablesResponse,
): NormalizedColorFile[] {
  const filteredResponse = filterFigmaColorVariables(response);
  const collections = filteredResponse.meta.variableCollections;
  const collectionEntries = COLOR_COLLECTIONS.map((name) => {
    const entry = Object.entries(collections).find(
      ([, collection]) => collection.name === name,
    );
    if (!entry) {
      throw new Error(`Missing selected Figma collection "${name}".`);
    }
    return { id: entry[0], name, collection: entry[1] };
  });
  const variables = Object.values(filteredResponse.meta.variables).sort(
    (left, right) => left.name.localeCompare(right.name),
  );
  const variablesByTokenName = new Map<string, LocalVariable>();

  for (const variable of variables) {
    const tokenName = toTokenName(variable.name);
    const existing = variablesByTokenName.get(tokenName);
    if (existing) {
      throw new Error(
        `Figma variable names "${existing.name}" and "${variable.name}" both normalize to "${tokenName}".`,
      );
    }
    variablesByTokenName.set(tokenName, variable);
  }

  const tokenNameById = new Map(
    [...variablesByTokenName.entries()].map(([tokenName, variable]) => [
      variable.id,
      tokenName,
    ]),
  );
  const variablesById = new Map(
    Object.values(response.meta.variables).map((variable) => [
      variable.id,
      variable,
    ]),
  );
  const selectedCollectionIds = new Set(collectionEntries.map(({ id }) => id));
  const collectionsById = new Map(
    collectionEntries.map(({ id, name }) => [id, name]),
  );
  const outputFiles = new Map<string, NormalizedColorFile>();
  const base = getCollectionEntry(collectionEntries, "Base");
  const theme = getCollectionEntry(collectionEntries, "Theme");
  const palette = getCollectionEntry(collectionEntries, "Palette");

  for (const baseMode of base.collection.modes) {
    for (const themeMode of theme.collection.modes) {
      for (const paletteMode of palette.collection.modes) {
        const activeModes = new Map([
          [base.id, baseMode.modeId],
          [theme.id, themeMode.modeId],
          [palette.id, paletteMode.modeId],
        ]);
        const modeNames: ModeNames = {
          Base: baseMode.name,
          Theme: themeMode.name,
          Palette: paletteMode.name,
        };
        const resolveVariable = createVariableResolver(
          variablesById,
          collectionsById,
          activeModes,
          selectedCollectionIds,
          modeNames,
        );
        validateModeCombination(
          variables,
          activeModes,
          tokenNameById,
          resolveVariable,
        );

        for (const entry of collectionEntries) {
          const modeId = activeModes.get(entry.id);
          if (!modeId) {
            throw new Error(
              `No active mode is configured for collection "${entry.name}".`,
            );
          }
          const mode = entry.collection.modes.find(
            (candidate) => candidate.modeId === modeId,
          );
          if (!mode) {
            throw new Error(
              `Active mode "${modeId}" does not exist in collection "${entry.name}".`,
            );
          }

          const tokens = createCollectionModeTokens(
            entry,
            modeId,
            variables,
            tokenNameById,
            resolveVariable,
          );
          const collectionSlug = toModeSlug(entry.name);
          const modeSuffix =
            entry.name === "Base" && entry.collection.modes.length === 1
              ? ""
              : `-${toModeSlug(mode.name)}`;
          const fileName = `colors-${collectionSlug}${modeSuffix}.tokens.json`;
          const existingFile = outputFiles.get(fileName);
          if (
            existingFile &&
            JSON.stringify(existingFile.tokens) !== JSON.stringify(tokens)
          ) {
            throw new Error(
              `Collection mode "${entry.name} / ${mode.name}" has values that depend on another collection mode.`,
            );
          }
          if (!existingFile) {
            outputFiles.set(fileName, {
              fileName,
              collection: entry.name,
              mode: mode.name,
              tokens,
            });
          }
        }
      }
    }
  }

  const collectionOrder = new Map(
    collectionEntries.map(({ name }, index) => [name, index]),
  );
  return [...outputFiles.values()].sort((left, right) => {
    const collectionOrderDifference =
      (collectionOrder.get(left.collection) ?? 0) -
      (collectionOrder.get(right.collection) ?? 0);
    if (collectionOrderDifference !== 0) {
      return collectionOrderDifference;
    }

    const modes = collectionEntries.find(({ name }) => name === left.collection)
      ?.collection.modes;
    return (
      (modes?.findIndex((mode) => mode.name === left.mode) ?? 0) -
      (modes?.findIndex((mode) => mode.name === right.mode) ?? 0)
    );
  });
}
