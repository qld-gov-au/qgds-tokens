import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  FIGMA_EXPORTS_DIR,
  PIPELINE_LOGS_DIR,
  TOKENS_BUILD_DIR,
} from "../src/constants";
import { analyzeFigmaColorVariables } from "../src/filterFigmaColors";
import { isFigmaLocalVariablesResponse } from "../src/fetchFigmaVariables";
import { normalizeFigmaColors } from "../src/normalizeFigmaColors";
import {
  readLastPipelineLogEntry,
  writePipelineLog,
} from "../src/pipelineLogger";

const inputPath = path.resolve(
  process.cwd(),
  FIGMA_EXPORTS_DIR,
  "figma-variables.local.json",
);
const outputDirectory = path.resolve(process.cwd(), TOKENS_BUILD_DIR, "colors");
const logPath = path.resolve(
  process.cwd(),
  PIPELINE_LOGS_DIR,
  "figma-pipeline.jsonl",
);

/**
 * Normalizes the saved Figma response and writes DTCG color documents.
 *
 * @throws {Error} If the source is missing/invalid, normalization fails, or output cannot be written.
 */
async function normalizeSavedFigmaColors(): Promise<void> {
  let runId: string = randomUUID();
  let stage = "color-normalization";
  let analysisAlreadyLogged = false;

  try {
    const lastLogEntry = await readLastPipelineLogEntry();
    if (
      lastLogEntry?.stage === "complete" &&
      lastLogEntry.message === "Figma variable sync completed."
    ) {
      runId = lastLogEntry.runId;
      analysisAlreadyLogged = true;
    }

    await writePipelineLog({
      runId,
      stage,
      level: "info",
      message: "Figma color normalization started.",
      details: { inputPath: path.relative(process.cwd(), inputPath) },
    });

    const rawResponse: unknown = JSON.parse(await readFile(inputPath, "utf8"));
    if (!isFigmaLocalVariablesResponse(rawResponse)) {
      throw new Error(
        "Saved Figma variables do not match the successful local variables response format.",
      );
    }

    const analysis = analyzeFigmaColorVariables(rawResponse);
    if (!analysisAlreadyLogged) {
      for (const issue of analysis.issues) {
        await writePipelineLog({
          runId,
          stage,
          level: "warn",
          message: issue.code,
          details: issue,
        });
      }
    }

    const files = normalizeFigmaColors(rawResponse);
    const tokenCount = files.reduce(
      (total, file) => total + Object.keys(file.tokens).length,
      0,
    );

    await mkdir(outputDirectory, { recursive: true });
    for (const file of files) {
      await writeFile(
        path.join(outputDirectory, file.fileName),
        `${JSON.stringify(file.tokens, null, 2)}\n`,
        "utf8",
      );
    }

    stage = "complete";
    await writePipelineLog({
      runId,
      stage,
      level: "info",
      message: "Figma color normalization completed.",
      details: {
        outputPath: path.relative(process.cwd(), outputDirectory),
        fileCount: files.length,
        tokenCount,
        composedColorValueCount: analysis.composedColorValues,
        files: files.map(({ fileName, collection, mode }) => ({
          fileName,
          collection,
          mode,
        })),
      },
    });

    console.log(
      `Wrote ${files.length} DTCG color files (${tokenCount} tokens) to ${path.relative(process.cwd(), outputDirectory)}`,
    );
    console.log(`Pipeline diagnostics appended to ${logPath}`);
  } catch (error: unknown) {
    try {
      await writePipelineLog({
        runId,
        stage,
        level: "error",
        message: "Figma color normalization failed.",
        details: {
          errorType: error instanceof Error ? error.name : "UnknownError",
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });
    } catch (loggingError: unknown) {
      console.error("Could not write the pipeline failure log:", loggingError);
    }
    throw error;
  }
}

normalizeSavedFigmaColors().catch((error: unknown) => {
  console.error("Figma color normalization failed:", error);
  process.exitCode = 1;
});
