import { createAvatar } from "@dicebear/core";
import * as adventurer from "@dicebear/adventurer-neutral";

export function getAvatarUrl(seed: string, size = 128): string {
  return createAvatar(adventurer, { seed, size }).toDataUri();
}

export function getAvatarSvg(seed: string, size = 128): string {
  return createAvatar(adventurer, { seed, size }).toString();
}
