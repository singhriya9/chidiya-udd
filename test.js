import fs from "node:fs";

const apiKey = "sk_df328c8f4bc06cbe1e8a93fc4de2b66f0fe1f1d30589da85";
// Use any these free & premade voice id in Jessica and Laura as these are only Indian typed Female voices available for free
// Jessica (Playful, Bright, Warm): cgSgspJ2msm6clMCkdW9
// Laura (Enthusiast, Quirky Attitude): FGY2WhTYpPnrIDTdsKH5
const voiceId = "cgSgspJ2msm6clMCkdW9";


// 1. Hit the Text-to-Speech endpoint, NOT the /voices endpoint
const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "xi-api-key": apiKey,
    "Accept": "audio/mpeg",
  },
  body: JSON.stringify({
    text: "Hello, this is a direct API test using a premade voice. Now let's play a game. Chidiya Udd? Tota ood? Maina ood? Table ood? Laptop ood? ",
    model_id: "eleven_flash_v2_5"
  }),
});

// 2. Catch errors
if (!res.ok) {
  console.error("Error:", res.status, await res.text());
  process.exit(1);
}

// 3. Read the stream exactly ONCE as an arrayBuffer
const arrayBuffer = await res.arrayBuffer();

// 4. Save the MP3
fs.writeFileSync("out.mp3", Buffer.from(arrayBuffer));
console.log("Success! Saved out.mp3");