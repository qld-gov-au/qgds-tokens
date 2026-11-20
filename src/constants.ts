export const DIST_BUILD_DIR = "./dist";

export const TOKENS_BUILD_DIR = "./tokens";

export const FIGMA_EXPORTS_DIR = "./figma-exports";

export const PIPELINE_LOGS_DIR = "./logs";

export const COLOR_COLLECTIONS = ["Base", "Theme", "Palette"] as const;

export const BRANDS = ["QGDS"];

export const REGEX_TOKEN_REFERENCE_VALUE = /^\{\s*([^}]+?)\s*\}$/;

type FigmaExportTokenPath = {
  sets: { collection: string; paths: string | string[] }[];
  applyModesAs?: "append" | "prepend" | "split";
};
export const FIGMA_EXPORT_TOKEN_PATHS: Record<string, FigmaExportTokenPath> = {
  size: {
    sets: [{ collection: "Base", paths: "Size.Positive" }],
  },
  space: {
    sets: [{ collection: "Base", paths: "Space" }],
  },
};
