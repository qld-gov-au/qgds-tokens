import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { FIGMA_EXPORTS_DIR } from "../src/constants";
import { fetchFigmaVariables } from "../src/fetchFigmaVariables";

const outputPath = path.resolve(
  process.cwd(),
  FIGMA_EXPORTS_DIR,
  "figma-variables.local.json",
);

/**
 * Fetches local variables using environment credentials and saves the raw response locally.
 *
 * @throws {Error} If the required environment variables are missing or fetching/writing fails.
 */
async function syncFigmaVariables(): Promise<void> {
  const envFilePath = path.resolve(process.cwd(), ".env");
  if (existsSync(envFilePath)) {
    process.loadEnvFile(envFilePath);
  }

  const fileKey = process.env["FIGMA_FILE_KEY"];
  const accessToken = process.env["FIGMA_ACCESS_TOKEN"];

  if (!fileKey?.trim()) {
    throw new Error("Set FIGMA_FILE_KEY to the Figma file key before syncing.");
  }
  if (!accessToken?.trim()) {
    throw new Error(
      "Set FIGMA_ACCESS_TOKEN to a Figma token with file_variables:read access before syncing.",
    );
  }

  const variables = await fetchFigmaVariables(fileKey, accessToken);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(variables, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `Saved raw Figma variables to ${path.relative(process.cwd(), outputPath)}`,
  );
}

syncFigmaVariables().catch((error: unknown) => {
  console.error("Figma variable sync failed:", error);
  process.exitCode = 1;
});
