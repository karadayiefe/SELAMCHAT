import { describe, expect, it } from "vitest";
import {
  ANIMALS,
  CHAT_BACKGROUND_TIMEOUT_SECONDS,
  CHAT_DISCONNECT_TIMEOUT_SECONDS,
  QUEUE_WINDOW_SECONDS,
  createRoomCode,
  getPartnerTimeoutSeconds,
} from "./chat.js";

describe("anonymous chat configuration", () => {
  it("keeps the 30-second search window separate from visible and hidden chat disconnect windows", () => {
    expect(QUEUE_WINDOW_SECONDS).toBe(30);
    expect(CHAT_DISCONNECT_TIMEOUT_SECONDS).toBe(5);
    expect(CHAT_BACKGROUND_TIMEOUT_SECONDS).toBe(30);
    expect(getPartnerTimeoutSeconds(false)).toBe(5);
    expect(getPartnerTimeoutSeconds(true)).toBe(30);
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

  it("generates unique ten-character temporary room codes", () => {
    const codes = Array.from({ length: 100 }, createRoomCode);
    expect(codes.every(code => /^[A-Z0-9_-]{10}$/.test(code))).toBe(true);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
