import type { GetLocalVariablesResponse } from "@figma/rest-api-spec";

/**
 * Checks whether a value is a non-null, non-array object.
 *
 * @param value - Value to check.
 * @returns Whether the value is a record of unknown values.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Checks whether an unknown value has the expected successful local-variables response shape.
 *
 * @param value - Parsed API response to validate.
 * @returns Whether the response matches Figma's local-variables response type.
 */
function isFigmaLocalVariablesResponse(
  value: unknown,
): value is GetLocalVariablesResponse {
  if (!isRecord(value) || value["status"] !== 200 || value["error"] !== false) {
    return false;
  }

  const meta = value["meta"];
  return (
    isRecord(meta) &&
    isRecord(meta["variables"]) &&
    isRecord(meta["variableCollections"])
  );
}

/**
 * Fetches local variables, collections, and modes from a Figma file.
 *
 * @param fileKey - Key identifying the Figma file.
 * @param accessToken - Figma personal access token with permission to read file variables.
 * @returns The raw successful local-variables response from Figma.
 * @throws {TypeError} If the file key or access token is blank.
 * @throws {Error} If the API request fails or returns an unexpected response.
 */
export async function fetchFigmaVariables(
  fileKey: string,
  accessToken: string,
): Promise<GetLocalVariablesResponse> {
  if (!fileKey.trim()) {
    throw new TypeError("A Figma file key is required.");
  }
  if (!accessToken.trim()) {
    throw new TypeError("A Figma access token is required.");
  }

  const response = await fetch(
    `https://api.figma.com/v1/files/${encodeURIComponent(fileKey.trim())}/variables/local`,
    {
      headers: {
        "X-Figma-Token": accessToken.trim(),
      },
    },
  );

  if (!response.ok) {
    const details = (await response.text()).trim();
    throw new Error(
      `Figma Variables API request failed with HTTP ${response.status}${details ? `: ${details}` : ""}`,
    );
  }

  const payload: unknown = await response.json();
  if (!isFigmaLocalVariablesResponse(payload)) {
    throw new Error(
      "Figma Variables API returned an unexpected local variables response.",
    );
  }
  return payload;
}
