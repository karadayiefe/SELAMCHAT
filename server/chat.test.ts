import { describe, expect, it } from "vitest";
import {
  ANIMALS,
  CHAT_DISCONNECT_TIMEOUT_SECONDS,
  CHAT_START_GRACE_SECONDS,
  QUEUE_WINDOW_SECONDS,
  getPartnerTimeoutSeconds,
} from "./chat.js";

describe("anonymous chat configuration", () => {
  it("separates initial search and room startup from active-chat disconnect cleanup", () => {
    expect(QUEUE_WINDOW_SECONDS).toBe(30);
    expect(CHAT_START_GRACE_SECONDS).toBe(30);
    expect(CHAT_DISCONNECT_TIMEOUT_SECONDS).toBe(5);
    expect(getPartnerTimeoutSeconds(1000, false)).toBe(30);
    expect(getPartnerTimeoutSeconds(1000, true)).toBe(5);
    expect(getPartnerTimeoutSeconds(31_000, false)).toBe(5);
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
