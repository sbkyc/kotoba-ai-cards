import { describe, expect, it } from "vitest";
import { toggleFavoriteId } from "./favorites";

describe("toggleFavoriteId", () => {
  it("adds an id that is not already favorited", () => {
    expect(toggleFavoriteId(["a"], "b")).toEqual(["a", "b"]);
  });

  it("removes an id that is already favorited", () => {
    expect(toggleFavoriteId(["a", "b"], "a")).toEqual(["b"]);
  });
});
