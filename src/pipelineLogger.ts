import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PIPELINE_LOGS_DIR } from "./constants";

export type PipelineLogLevel = "info" | "warn" | "error";

export type PipelineLogEvent = {
  runId: string;
  stage: string;
  level: PipelineLogLevel;
  message: string;
  details?: Record<string, unknown>;
};

export type PipelineLogEntry = PipelineLogEvent & {
  timestamp: string;
};

/**
 * Checks whether a value is a non-null, non-array object.
 *
 * @param value - Value to inspect.
 * @returns Whether the value is a record.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Starts a fresh pipeline log for a new fetch run.
 *
 * @throws {Error} If the log directory or file cannot be written.
 */
export async function resetPipelineLog(): Promise<void> {
  const logDirectory = path.resolve(process.cwd(), PIPELINE_LOGS_DIR);
  const logPath = path.join(logDirectory, "figma-pipeline.jsonl");

  await mkdir(logDirectory, { recursive: true });
  await writeFile(logPath, "", "utf8");
}

/**
 * Reads the most recent pipeline log entry, if the log exists and has entries.
 *
 * @returns The last structured log entry, or undefined for a missing or empty log.
 * @throws {Error} If the log cannot be read or its last entry is malformed.
 */
export async function readLastPipelineLogEntry(): Promise<
  PipelineLogEntry | undefined
> {
  const logPath = path.resolve(
    process.cwd(),
    PIPELINE_LOGS_DIR,
    "figma-pipeline.jsonl",
  );
  let contents: string;

  try {
    contents = await readFile(logPath, "utf8");
  } catch (error: unknown) {
    if (isRecord(error) && error["code"] === "ENOENT") {
      return undefined;
    }
    throw error;
  }

  const lastLine = contents.trimEnd().split(/\r?\n/).filter(Boolean).at(-1);
  if (!lastLine) {
    return undefined;
  }

  const entry: unknown = JSON.parse(lastLine);
  if (
    !isRecord(entry) ||
    typeof entry["timestamp"] !== "string" ||
    typeof entry["runId"] !== "string" ||
    typeof entry["stage"] !== "string" ||
    !["info", "warn", "error"].includes(String(entry["level"])) ||
    typeof entry["message"] !== "string"
  ) {
    throw new Error("The latest Figma pipeline log entry is malformed.");
  }

  return entry as PipelineLogEntry;
}

/**
 * Appends a structured event to the pipeline JSON Lines log.
 *
 * @param event - Stage, severity, message, and non-sensitive diagnostic details.
 * @throws {Error} If the log directory or file cannot be written.
 */
export async function writePipelineLog(event: PipelineLogEvent): Promise<void> {
  const logDirectory = path.resolve(process.cwd(), PIPELINE_LOGS_DIR);
  const logPath = path.join(logDirectory, "figma-pipeline.jsonl");
  const entry = {
    timestamp: new Date().toISOString(),
    ...event,
  };

  await mkdir(logDirectory, { recursive: true });
  await appendFile(logPath, `${JSON.stringify(entry)}\n`, "utf8");
}
