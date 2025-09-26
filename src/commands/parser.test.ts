import { describe, expect, it } from "vitest";

import { parseDroidCommand } from "./parser";

describe("parseDroidCommand", () => {
  it("returns null when @droid mention is missing", () => {
    expect(parseDroidCommand("please review this")).toBeNull();
  });

  it("parses explicit review command", () => {
    expect(parseDroidCommand("@droid review please")).toEqual({
      command: "review",
      args: ["please"]
    });
  });

  it("defaults to help when command missing", () => {
    expect(parseDroidCommand("hey @droid")).toEqual({
      command: "help",
      args: []
    });
  });
});
