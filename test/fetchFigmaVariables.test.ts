import { afterEach, describe, expect, it, jest } from "@jest/globals";
import type { GetLocalVariablesResponse } from "@figma/rest-api-spec";
import { fetchFigmaVariables } from "../src/fetchFigmaVariables";

const responseBody: GetLocalVariablesResponse = {
  status: 200,
  error: false,
  meta: {
    variables: {},
    variableCollections: {},
  },
};

describe("fetchFigmaVariables", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("requests local variables for the supplied file and returns the raw response", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(responseBody), { status: 200 }),
      );

    await expect(
      fetchFigmaVariables("file-key", "figma-token"),
    ).resolves.toEqual(responseBody);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.figma.com/v1/files/file-key/variables/local",
      {
        headers: {
          "X-Figma-Token": "figma-token",
        },
      },
    );
  });

  it("encodes the file key in the request URL", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(responseBody), { status: 200 }),
      );

    await fetchFigmaVariables("file/key", "figma-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.figma.com/v1/files/file%2Fkey/variables/local",
      expect.any(Object),
    );
  });

  it("reports HTTP failures with the response details", async () => {
    jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("Access denied", { status: 403 }));

    await expect(
      fetchFigmaVariables("file-key", "figma-token"),
    ).rejects.toThrow("HTTP 403: Access denied");
  });

  it("rejects malformed successful responses", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: 200, error: false }), {
        status: 200,
      }),
    );

    await expect(
      fetchFigmaVariables("file-key", "figma-token"),
    ).rejects.toThrow("unexpected local variables response");
  });

  it("rejects responses that do not report success", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 500,
          error: true,
          meta: { variables: {}, variableCollections: {} },
        }),
        { status: 200 },
      ),
    );

    await expect(
      fetchFigmaVariables("file-key", "figma-token"),
    ).rejects.toThrow("unexpected local variables response");
  });

  it("requires a file key and token", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch");

    await expect(fetchFigmaVariables(" ", "figma-token")).rejects.toThrow(
      "A Figma file key is required.",
    );
    await expect(fetchFigmaVariables("file-key", " ")).rejects.toThrow(
      "A Figma access token is required.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
