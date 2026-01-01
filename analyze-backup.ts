#!/usr/bin/env bun

const file = Bun.file("backup.hx1b");
const data = await file.arrayBuffer();
const view = new DataView(data);
const bytes = new Uint8Array(data);
const decoder = new TextDecoder();

console.log(`Backup file size: ${bytes.length} bytes\n`);

// Look for the magic header
const headerMagic = "F19BinaryPresetHeader";
const magicOffsets: number[] = [];

for (let i = 0; i < bytes.length - headerMagic.length; i++) {
  const str = decoder.decode(bytes.slice(i, i + headerMagic.length));
  if (str === headerMagic) {
    magicOffsets.push(i);
  }
}

console.log(`Found "${headerMagic}" at ${magicOffsets.length} locations:`);
magicOffsets.forEach((offset, idx) => {
  console.log(`  Preset ${idx + 1}: offset 0x${offset.toString(16).padStart(6, '0')} (${offset} bytes)`);
});

// Extract preset names
console.log("\nPreset names found in backup:");
const presetNamePattern = /[A-Za-z0-9][A-Za-z0-9 \-&']{2,19}/;
const presetNames: Array<{offset: number, name: string}> = [];

for (let i = 0; i < bytes.length - 20; i++) {
  // Look for null-terminated strings after specific patterns
  let str = "";
  let j = i;
  while (j < i + 20 && bytes[j] !== 0 && bytes[j] >= 32 && bytes[j] <= 126) {
    str += String.fromCharCode(bytes[j]);
    j++;
  }

  if (str.length >= 4 && str.length <= 20 && j < bytes.length && bytes[j] === 0) {
    // Check if it looks like a preset name
    if (presetNamePattern.test(str) && !str.includes("Binary") && !str.includes("Header")) {
      presetNames.push({ offset: i, name: str });
    }
  }
}

// Deduplicate and show first 20
const uniqueNames = new Set<string>();
presetNames.forEach(p => uniqueNames.add(p.name));
console.log(`  Found ${uniqueNames.size} unique preset names`);
Array.from(uniqueNames).slice(0, 20).forEach(name => {
  console.log(`    - ${name}`);
});

// Analyze structure around first header
if (magicOffsets.length > 0) {
  const firstHeader = magicOffsets[0];
  console.log(`\nAnalyzing structure around first header (offset 0x${firstHeader.toString(16)}):`);

  // Check what's before the header
  console.log(`  Bytes before header:`);
  for (let i = Math.max(0, firstHeader - 16); i < firstHeader; i += 4) {
    const val = view.getUint32(i, true);
    console.log(`    0x${i.toString(16).padStart(6, '0')}: ${val.toString().padStart(10)} (0x${val.toString(16).padStart(8, '0')})`);
  }

  // Check what's after the header
  const afterHeader = firstHeader + headerMagic.length + 1;
  console.log(`  Bytes after header (from 0x${afterHeader.toString(16)}):`);
  for (let i = afterHeader; i < afterHeader + 32 && i < bytes.length; i += 4) {
    const val = view.getUint32(i, true);
    const floatVal = view.getFloat32(i, true);
    console.log(`    0x${i.toString(16).padStart(6, '0')}: ${val.toString().padStart(10)} (float: ${floatVal.toFixed(6)})`);
  }
}

// Calculate potential preset size
if (magicOffsets.length > 1) {
  const presetSize = magicOffsets[1] - magicOffsets[0];
  console.log(`\nEstimated preset size: ${presetSize} bytes (0x${presetSize.toString(16)})`);
}
