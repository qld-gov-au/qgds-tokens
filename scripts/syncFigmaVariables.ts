import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { FIGMA_EXPORTS_DIR, PIPELINE_LOGS_DIR } from "../src/constants";
import {
  analyzeFigmaColorVariables,
  filterFigmaColorVariables,
} from "../src/filterFigmaColors";
import { fetchFigmaVariables } from "../src/fetchFigmaVariables";
import { resetPipelineLog, writePipelineLog } from "../src/pipelineLogger";

const runId = randomUUID();

const outputPath = path.resolve(
  process.cwd(),
  FIGMA_EXPORTS_DIR,
  "figma-variables.local.json",
);
const logPath = path.resolve(
  process.cwd(),
  PIPELINE_LOGS_DIR,
  "figma-pipeline.jsonl",
);

/**
 * Returns an error message with the Figma access token removed.
 *
 * @param error - Error thrown by the sync pipeline.
 * @param accessToken - Token that must not appear in logs.
 * @returns A safe error message for diagnostics.
 */
function getSafeErrorMessage(
  error: unknown,
  accessToken: string | undefined,
): string {
  const message = error instanceof Error ? error.message : String(error);
  const secret = accessToken?.trim();
  return secret ? message.replaceAll(secret, "[REDACTED]") : message;
}

/**
 * Fetches local variables using environment credentials and saves the raw response locally.
 *
 * @throws {Error} If the required environment variables are missing or fetching/writing fails.
 */
async function syncFigmaVariables(): Promise<void> {
  let stage = "configuration";
  let accessToken: string | undefined;
  await resetPipelineLog();
  await writePipelineLog({
    runId,
    stage,
    level: "info",
    message: "Figma variable sync started.",
  });

  try {
    const envFilePath = path.resolve(process.cwd(), ".env");
    if (existsSync(envFilePath)) {
      process.loadEnvFile(envFilePath);
    }

    const fileKey = process.env["FIGMA_FILE_KEY"];
    accessToken = process.env["FIGMA_ACCESS_TOKEN"];

    if (!fileKey?.trim()) {
      throw new Error(
        "Set FIGMA_FILE_KEY to the Figma file key before syncing.",
      );
    }
    if (!accessToken?.trim()) {
      throw new Error(
        "Set FIGMA_ACCESS_TOKEN to a Figma token with file_variables:read access before syncing.",
      );
    }

    stage = "fetch";
    await writePipelineLog({
      runId,
      stage,
      level: "info",
      message: "Fetching local Figma variables.",
    });
    const variables = await fetchFigmaVariables(fileKey, accessToken);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(
      outputPath,
      `${JSON.stringify(variables, null, 2)}\n`,
      "utf8",
    );
    await writePipelineLog({
      runId,
      stage,
      level: "info",
      message: "Saved raw Figma variables.",
      details: {
        collectionCount: Object.keys(variables.meta.variableCollections).length,
        variableCount: Object.keys(variables.meta.variables).length,
        outputPath: path.relative(process.cwd(), outputPath),
      },
    });

    stage = "color-filter";
    await writePipelineLog({
      runId,
      stage,
      level: "info",
      message: "Analyzing and filtering supported local color collections.",
    });
    const analysis = analyzeFigmaColorVariables(variables);
    const filteredVariables = filterFigmaColorVariables(variables);
    await writePipelineLog({
      runId,
      stage,
      level: "info",
      message: "Filtered supported color variables.",
      details: {
        selectedCollectionCount: Object.keys(
          filteredVariables.meta.variableCollections,
        ).length,
        selectedColorVariableCount: analysis.selectedColorVariables,
        excludedDeletedVariableCount: analysis.excludedDeletedVariables,
        composedColorValueCount: analysis.composedColorValues,
      },
    });

    for (const issue of analysis.issues) {
      await writePipelineLog({
        runId,
        stage,
        level: "warn",
        message: issue.code,
        details: issue,
      });
    }

    stage = "complete";
    await writePipelineLog({
      runId,
      stage,
      level: "info",
      message: "Figma variable sync completed.",
    });

    console.log(
      `Saved raw Figma variables to ${path.relative(process.cwd(), outputPath)}`,
    );
    console.log(`Pipeline diagnostics appended to ${logPath}`);
  } catch (error: unknown) {
    try {
      await writePipelineLog({
        runId,
        stage,
        level: "error",
        message: "Figma variable sync failed.",
        details: {
          errorType: error instanceof Error ? error.name : "UnknownError",
          errorMessage: getSafeErrorMessage(error, accessToken),
        },
      });
    } catch (loggingError: unknown) {
      console.error("Could not write the pipeline failure log:", loggingError);
    }
    throw error;
  }
}

syncFigmaVariables().catch((error: unknown) => {
  console.error("Figma variable sync failed:", error);
  process.exitCode = 1;
});
