import { describe, expect, it } from "vitest";
import {
  ANIMALS,
  CHAT_BACKGROUND_TIMEOUT_SECONDS,
  CHAT_DISCONNECT_TIMEOUT_SECONDS,
  QUEUE_WINDOW_SECONDS,
  chooseAnimal,
  canMarkMessageRead,
  createRoomCode,
  getPartnerTimeoutSeconds,
} from "./chat.js";

describe("anonymous chat configuration", () => {
  it("uses a 30-second lease for visible and hidden presence", () => {
    expect(QUEUE_WINDOW_SECONDS).toBe(30);
    expect(CHAT_DISCONNECT_TIMEOUT_SECONDS).toBe(30);
    expect(CHAT_BACKGROUND_TIMEOUT_SECONDS).toBe(30);
    expect(getPartnerTimeoutSeconds(false)).toBe(30);
    expect(getPartnerTimeoutSeconds(true)).toBe(30);
  });

  it("marks messages read only when the client and server both report visible", () => {
    expect(canMarkMessageRead(true, false)).toBe(true);
    expect(canMarkMessageRead(false, false)).toBe(false);
    expect(canMarkMessageRead(true, true)).toBe(false);
    expect(canMarkMessageRead(false, true)).toBe(false);
  });

  it("assigns a different animal when the previous identity is excluded", () => {
    for (const previous of ANIMALS) {
      const next = chooseAnimal(previous.key);
      expect(next.key).not.toBe(previous.key);
      expect(ANIMALS).toContainEqual(next);
    }
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

  it("generates unique temporary room codes in XXX-XXX-XXX format", () => {
    const codes = Array.from({ length: 100 }, createRoomCode);
    expect(codes.every(code => /^\d{3}-\d{3}-\d{3}$/.test(code))).toBe(true);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
