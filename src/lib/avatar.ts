import { createAvatar } from '@dicebear/core';
import { micah } from '@dicebear/collection';

export function getAvatarSvg(seed: string): string {
  return createAvatar(micah, { seed, size: 64 }).toString();
}

export function getAvatarDataUri(seed: string): string {
  const svg = getAvatarSvg(seed);
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
