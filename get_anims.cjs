const fs = require('fs');
const buffer = fs.readFileSync('astronaut.glb');
// The GLB header is 12 bytes
// Followed by chunks
// Chunk 0 is JSON
const jsonChunkLength = buffer.readUInt32LE(12);
const jsonChunkType = buffer.readUInt32LE(16);
if (jsonChunkType === 0x4E4F534A) { // 'JSON'
  const jsonStr = buffer.toString('utf8', 20, 20 + jsonChunkLength);
  const json = JSON.parse(jsonStr);
  if (json.animations) {
    console.log("Animations:", json.animations.map(a => a.name));
  } else {
    console.log("No animations found.");
  }
}
