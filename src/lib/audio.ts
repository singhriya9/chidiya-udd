import { Howl } from "howler";

type SpriteEngine = Howl | null;

let defaultEngine: SpriteEngine = null;
let packEngine: SpriteEngine = null;
let loadedPackId: string | null = null;
const packEngineCache = new Map<string, Howl>();
let muted = false;

function getAllEngines(): Howl[] {
  const engines = [packEngine, defaultEngine, ...packEngineCache.values()];
  const seen = new Set<Howl>();
  const unique: Howl[] = [];

  for (const engine of engines) {
    if (!engine || seen.has(engine)) continue;
    seen.add(engine);
    unique.push(engine);
  }

  return unique;
}

function hasSprite(engine: Howl, id: string): boolean {
  const sprites = (engine as Howl & { _sprite?: Record<string, [number, number]> })._sprite;
  return Boolean(sprites && sprites[id]);
}

async function loadSpriteEngine(spriteBasePath: string): Promise<Howl | null> {
  try {
    const response = await fetch(`/sounds/${spriteBasePath}.json`);
    if (!response.ok) return null;

    const spriteData = await response.json();
    return new Howl({
      src: [`/sounds/${spriteBasePath}.mp3`],
      sprite: spriteData.sprite,
      html5: true,
    });
  } catch {
    return null;
  }
}

export async function initAudio(): Promise<void> {
  if (defaultEngine) return;

  // Prefer pack1 sprite because it is the guaranteed local baseline asset.
  defaultEngine = await loadSpriteEngine("sprite_pack1");
  if (!defaultEngine) {
    console.warn(
      "[audio] No default sprite found. Audio will run silently."
    );
  }
}

export async function loadAudioPack(packId: string): Promise<void> {
  if (!packId) return;
  if (loadedPackId === packId && packEngine) return;

  loadedPackId = packId;

  const cachedEngine = packEngineCache.get(packId);
  if (cachedEngine) {
    packEngine = cachedEngine;
    return;
  }

  const engine = await loadSpriteEngine(`sprite_${packId}`);
  if (!engine) {
    packEngine = null;
    return;
  }

  packEngineCache.set(packId, engine);
  packEngine = engine;
}

export function playSound(id: string): void {
  if (muted) return;

  for (const engine of getAllEngines()) {
    if (!hasSprite(engine, id)) continue;

    try {
      engine.play(id);
      return;
    } catch {
      // Try the next available engine. If none match, stay silent.
    }
  }
}

export function isAudioReady(): boolean {
  return defaultEngine !== null || packEngine !== null;
}

export function getLoadedPackId(): string | null {
  return loadedPackId;
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

export function toggleMuted(): boolean {
  muted = !muted;
  return muted;
}

export function stopAllSounds(): void {
  for (const engine of getAllEngines()) {
    try {
      engine.stop();
    } catch {
      // Ignore stop failures and continue cleanup.
    }
  }
}

export function clearAudioPack(): void {
  loadedPackId = null;
  packEngine = null;
}
