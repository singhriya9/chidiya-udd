const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, '../party/items-full.json');
let items;
try {
  items = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (error) {
  console.error(`❌ Error reading items-full.json: ${error.message}`);
  process.exit(1);
}

// Fisher-Yates shuffle algorithm
function shuffle(array) {
  let currentIndex = array.length;
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

// Shuffle the items to ensure randomness
const shuffledItems = shuffle([...items]);

const PACK_SIZE = 100;
const NUM_PACKS = 6;

console.log(`📦 Dividing ${items.length} items into ${NUM_PACKS} packs of ${PACK_SIZE}...`);

for (let i = 0; i < NUM_PACKS; i++) {
  // Extract up to 100 items per pack
  const packItems = shuffledItems.slice(i * PACK_SIZE, (i + 1) * PACK_SIZE);
  
  // Save each pack
  const outPath = path.join(__dirname, `../party/pack${i + 1}.json`);
  fs.writeFileSync(outPath, JSON.stringify(packItems, null, 2));
  
  console.log(`✅ Created pack${i + 1}.json with ${packItems.length} items.`);
}

console.log('\n🎉 Done! You can now run "npm run generate:audio" to generate mp3s for these packs.');
