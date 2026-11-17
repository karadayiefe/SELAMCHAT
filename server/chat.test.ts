import { describe, expect, it } from "vitest";
import { ANIMALS, PRESENCE_TIMEOUT_SECONDS } from "./chat.js";

describe("anonymous chat configuration", () => {
  it("uses a short heartbeat timeout", () => {
    expect(PRESENCE_TIMEOUT_SECONDS).toBeGreaterThan(0);
    expect(PRESENCE_TIMEOUT_SECONDS).toBeLessThanOrEqual(3);
  });

  it("assigns unique, schema-safe animal identities", () => {
    expect(ANIMALS.length).toBeGreaterThanOrEqual(50);

    for (const field of ["key", "name", "emoji", "color"] as const) {
      const values = ANIMALS.map(animal => animal[field]);
      expect(new Set(values).size, `${field} values must be unique`).toBe(values.length);
    }

    for (const animal of ANIMALS) {
      expect(animal.key.length).toBeLessThanOrEqual(32);
      expect(animal.name.length).toBeLessThanOrEqual(40);
      expect(animal.emoji.length).toBeLessThanOrEqual(16);
      expect(animal.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
