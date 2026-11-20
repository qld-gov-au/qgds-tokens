import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";
import {
  readLastPipelineLogEntry,
  resetPipelineLog,
  writePipelineLog,
} from "../src/pipelineLogger";

describe("pipeline logger", () => {
  it("resets prior entries while allowing later stages to append", async () => {
    const originalDirectory = process.cwd();
    const temporaryDirectory = await mkdtemp(
      path.join(os.tmpdir(), "qgds-pipeline-log-"),
    );

    try {
      process.chdir(temporaryDirectory);
      await writePipelineLog({
        runId: "previous-run",
        stage: "fetch",
        level: "info",
        message: "Previous run.",
      });
      await resetPipelineLog();
      await writePipelineLog({
        runId: "current-run",
        stage: "normalize",
        level: "info",
        message: "Current run.",
      });
      const lastEntry = await readLastPipelineLogEntry();

      const logPath = path.join(
        temporaryDirectory,
        "logs",
        "figma-pipeline.jsonl",
      );
      const entries = (await readFile(logPath, "utf8"))
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line) as { runId: string; message: string });

      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        runId: "current-run",
        message: "Current run.",
      });
      expect(lastEntry).toMatchObject({
        runId: "current-run",
        message: "Current run.",
      });
    } finally {
      process.chdir(originalDirectory);
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  });
});
