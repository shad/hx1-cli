#!/usr/bin/env bun

/**
 * HX One Preset Creator (Template)
 *
 * This is a starting point for creating custom presets programmatically.
 * You'll need to map specific parameters to their meanings for each effect.
 *
 * Usage: bun run create-preset.ts
 */

interface PresetBuilder {
  effectId: number;
  name: string;
  parameters: Array<{type: number, value: number}>;
}

function createPreset(config: PresetBuilder): Uint8Array {
  const buffer = new ArrayBuffer(1440);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Write header
  view.setUint32(0x00, 0, true);  // Unknown
  view.setUint32(0x04, 1, true);  // Unknown
  view.setUint32(0x08, 0, true);  // Unknown
  view.setUint32(0x0C, 1, true);  // Unknown
  view.setUint32(0x10, config.effectId, true);  // Effect Model ID
  view.setUint32(0x14, 0, true);  // Data size (could be calculated)

  // Write parameters
  let offset = 0x18;
  for (const param of config.parameters) {
    view.setUint32(offset, param.type, true);

    if (param.type === 3) {
      // Float
      view.setFloat32(offset + 4, param.value, true);
    } else {
      // Integer/Bool/Flag
      view.setUint32(offset + 4, param.value, true);
    }

    offset += 8;

    if (offset >= 0x580) break; // Stop before name area
  }

  // Write preset name at the end
  const nameOffset = 0x584;
  const nameBytes = new TextEncoder().encode(config.name);
  bytes.set(nameBytes, nameOffset);
  bytes[nameOffset + nameBytes.length] = 0; // Null terminator

  return bytes;
}

// Example: Create a custom preset based on 12-String effect
const myPreset: PresetBuilder = {
  effectId: 0x09FA, // 12-String effect ID
  name: "My Custom 12",
  parameters: [
    { type: 3, value: 0.8 },    // Parameter 0 - maybe mix?
    { type: 3, value: 0.5 },    // Parameter 1
    { type: 3, value: 0.7 },    // Parameter 2
    { type: 3, value: 0.0 },    // Parameter 3
    { type: 2, value: 1 },      // Parameter 4
    // ... add more parameters as needed
  ]
};

// Pad parameters to match expected count (62 total)
while (myPreset.parameters.length < 62) {
  myPreset.parameters.push({ type: 0, value: 0 });
}

// Create the preset
const presetData = createPreset(myPreset);

// Save to file
const outputPath = "my-custom-preset.hx1p";
await Bun.write(outputPath, presetData);

console.log(`✅ Created preset: ${outputPath}`);
console.log(`   Effect ID: ${myPreset.effectId} (0x${myPreset.effectId.toString(16).toUpperCase()})`);
console.log(`   Name: "${myPreset.name}"`);
console.log(`   Parameters: ${myPreset.parameters.length}`);
console.log();
console.log("⚠️  Note: This is a template. You'll need to:");
console.log("   1. Map parameters to actual effect controls");
console.log("   2. Test on your HX One device");
console.log("   3. Validate parameter ranges");
console.log();
console.log("Verify with:");
console.log(`   bun run preset-inspector.ts ${outputPath}`);
