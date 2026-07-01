import { describe, it, expect } from "vitest";

import { tokenize, convertCase, toCase } from "./case-transforms";

describe("tokenize", () => {
  it("splits snake_case", () => {
    expect(tokenize("hello_world_foo")).toEqual(["hello", "world", "foo"]);
  });

  it("splits camelCase", () => {
    expect(tokenize("helloWorldFoo")).toEqual(["hello", "world", "foo"]);
  });

  it("splits PascalCase and acronyms", () => {
    expect(tokenize("XMLParser")).toEqual(["xml", "parser"]);
    expect(tokenize("MyHTTPClient")).toEqual(["my", "http", "client"]);
  });

  it("handles kebab and mixed whitespace", () => {
    expect(tokenize("foo-bar  baz")).toEqual(["foo", "bar", "baz"]);
  });

  it("returns [] for empty input", () => {
    expect(tokenize("")).toEqual([]);
  });
});

describe("convertCase round-trips", () => {
  it("round-trips camel → snake → camel losslessly", () => {
    const original = "helloWorldFoo";
    const snake = convertCase(original).snake;
    expect(snake).toBe("hello_world_foo");
    expect(toCase(tokenize(snake), "camel")).toBe(original);
  });

  it("produces all six variants", () => {
    const out = convertCase("user profile id");
    expect(out.camel).toBe("userProfileId");
    expect(out.pascal).toBe("UserProfileId");
    expect(out.snake).toBe("user_profile_id");
    expect(out.kebab).toBe("user-profile-id");
    expect(out.constant).toBe("USER_PROFILE_ID");
    expect(out.title).toBe("User Profile Id");
  });
});
