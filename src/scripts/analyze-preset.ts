#!/usr/bin/env bun

const file = Bun.file("presets/12-String.hx1p");
const data = await file.arrayBuffer();
const view = new DataView(data);
const bytes = new Uint8Array(data);

console.log(`File size: ${bytes.length} bytes\n`);

// Parse first 64 bytes as 32-bit little-endian integers
console.log("First 64 bytes as 32-bit integers (little-endian):");
for (let i = 0; i < Math.min(64, bytes.length); i += 4) {
  const val = view.getUint32(i, true);
  console.log(`  Offset 0x${i.toString(16).padStart(4, '0')}: ${val.toString().padStart(10)} (0x${val.toString(16).padStart(8, '0')})`);
}

// Find preset name
const presetName = "12-String";
const textDecoder = new TextDecoder();
let presetNameOffset = -1;
for (let i = 0; i < bytes.length - presetName.length; i++) {
  const str = textDecoder.decode(bytes.slice(i, i + presetName.length));
  if (str === presetName) {
    presetNameOffset = i;
    break;
  }
}
console.log(`\nPreset name '${presetName}' found at offset: 0x${presetNameOffset.toString(16).padStart(4, '0')}`);

// Parse some floating point values
console.log("\nSome floating point values (IEEE 754, little-endian):");
const floatOffsets = [0x18, 0x1c, 0x20, 0x24, 0x28];
for (const offset of floatOffsets) {
  if (offset < bytes.length - 4) {
    const val = view.getFloat32(offset, true);
    console.log(`  Offset 0x${offset.toString(16).padStart(4, '0')}: ${val.toFixed(6)}`);
  }
}

// Look for effect model ID
console.log("\nFirst few bytes (likely header/magic):");
const firstInt1 = view.getUint32(0, true);
const firstInt2 = view.getUint32(4, true);
const firstInt3 = view.getUint32(8, true);
const firstInt4 = view.getUint32(12, true);
const effectId = view.getUint32(16, true);

console.log(`  [0x00-0x03]: ${firstInt1} (possibly version/magic)`);
console.log(`  [0x04-0x07]: ${firstInt2}`);
console.log(`  [0x08-0x0b]: ${firstInt3}`);
console.log(`  [0x0c-0x0f]: ${firstInt4}`);
console.log(`  [0x10-0x13]: ${effectId} (0x${effectId.toString(16)}) - possible effect model ID`);

// Check for text strings throughout the file
console.log("\nAll readable strings (length > 3):");
let currentString = "";
let stringStart = -1;
for (let i = 0; i < bytes.length; i++) {
  if (bytes[i] >= 32 && bytes[i] <= 126) {
    if (currentString.length === 0) stringStart = i;
    currentString += String.fromCharCode(bytes[i]);
  } else {
    if (currentString.length > 3) {
      console.log(`  0x${stringStart.toString(16).padStart(4, '0')}: "${currentString}"`);
    }
    currentString = "";
  }
}
