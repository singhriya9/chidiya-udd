#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// Try taking credentials from .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const API_KEY = process.env.ELEVENLABS_API_KEY;

// Configure which packs to generate audio for here.
// e.g., to generate just pack 1: const PACKS_TO_PROCESS = [1];
// e.g., to generate all 6 packs: const PACKS_TO_PROCESS = [1, 2, 3, 4, 5, 6];
const PACKS_TO_PROCESS = [1, 2, 3, 4, 5, 6];

if (!VOICE_ID || !API_KEY) {
  console.error('❌ Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID in .env');
  process.exit(1);
}

/**
 * Convert id like "chidiya_udd" → spoken text "Chidiya... Udd!"
 */
function toSpeech(id) {
  const word = id.replace('_udd', '');
  const capitalized = word.charAt(0).toUpperCase() + word.slice(1);
  return `${capitalized}... Ood!`;
}

async function generate() {
  console.log(
    `🎙️  Generating voice clips via ElevenLabs for Packs: ${PACKS_TO_PROCESS.join(', ')}...`,
  );
  console.log(`   Voice ID: ${VOICE_ID}\n`);

  for (const packNum of PACKS_TO_PROCESS) {
    const packPath = path.join(__dirname, `../party/pack${packNum}.json`);

    if (!fs.existsSync(packPath)) {
      console.warn(
        `   ⚠️  Pack ${packNum} not found at ${packPath}. Remember to run scripts/create-packs.js first.`,
      );
      continue;
    }

    const items = JSON.parse(fs.readFileSync(packPath, 'utf8'));
    // Generate them in folder structures like raw-sounds/pack1, raw-sounds/pack2
    const packOutDir = path.join(__dirname, `../raw-sounds/pack${packNum}`);

    if (!fs.existsSync(packOutDir)) {
      fs.mkdirSync(packOutDir, { recursive: true });
    }

    console.log(`\n--- Processing Pack ${packNum} (${items.length} items) ---`);

    for (const item of items) {
      if (!item.id) continue;

      const phrase = item.id;
      const text = toSpeech(phrase);
      const outPath = path.join(packOutDir, `${phrase}.mp3`);

      if (fs.existsSync(outPath)) {
        console.log(`   ↩  Skipping ${phrase}.mp3 (already exists)`);
        continue;
      }

      console.log(`   Generating: "${text}"`);

      let errText = null;
      try {
        const res = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text,
              model_id: 'eleven_flash_v2_5',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.8,
              },
            }),
          },
        );

        if (!res.ok) {
          errText = await res.text();
          console.error(`   ❌ Failed for "${phrase}": ${errText}`);
          continue;
        }

        const buffer = await res.arrayBuffer();
        fs.writeFileSync(outPath, Buffer.from(buffer));
        console.log(`   ✓ Saved ${phrase}.mp3 in pack${packNum}/`);
      } catch (error) {
        console.error(
          `   ❌ Network/Fetch Error for "${phrase}": ${error.message}`,
        );
      }

      // Rate limit buffer — 300ms between requests
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log('\n✅ All voice clips generated!');
  console.log('\nNext steps:');
  console.log('  Generate sprites for each pack by running these commands:');
  console.log(
    '    cd raw-sounds/pack1 && audiosprite --format howler --export mp3 --output ../../public/sounds/sprite_pack1 *.mp3',
  );
  console.log(
    '    cd raw-sounds/pack2 && audiosprite --format howler --export mp3 --output ../../public/sounds/sprite_pack2 *.mp3',
  );
  console.log('    (And so on for all 6 packs)');
}

generate().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
