#!/usr/bin/env bun

interface HXPresetParameter {
  type: number;
  value: number | boolean;
  rawBytes: Uint8Array;
}

interface HXPreset {
  header?: string;
  effectModelId?: number;
  presetName: string;
  parameters: HXPresetParameter[];
  rawData: Uint8Array;
}

function parsePreset(data: ArrayBuffer, hasHeaderMagic: boolean = false): HXPreset {
  const view = new DataView(data);
  const bytes = new Uint8Array(data);
  const decoder = new TextDecoder();

  let offset = 0;
  let header: string | undefined;

  // Skip header magic if present
  if (hasHeaderMagic) {
    const headerBytes = bytes.slice(0, 21);
    header = decoder.decode(headerBytes.slice(0, 21)).replace(/\0/g, '');
    offset = 24; // Skip header + padding
  }

  // Parse first integers
  const int1 = view.getUint32(offset, true);
  const int2 = view.getUint32(offset + 4, true);
  const int3 = view.getUint32(offset + 8, true);
  const int4 = view.getUint32(offset + 12, true);
  const effectModelId = view.getUint32(offset + 16, true);
  const dataSize = view.getUint32(offset + 20, true);

  console.log(`Effect Model ID: ${effectModelId} (0x${effectModelId.toString(16)})`);
  console.log(`Data size field: ${dataSize} bytes`);
  console.log(`Header ints: [${int1}, ${int2}, ${int3}, ${int4}]`);

  // Find preset name (usually near end of file)
  let presetName = "";
  for (let i = bytes.length - 100; i < bytes.length - 4; i++) {
    let str = "";
    let j = i;
    while (j < bytes.length && bytes[j] !== 0 && bytes[j] >= 32 && bytes[j] <= 126) {
      str += String.fromCharCode(bytes[j]);
      j++;
    }
    if (str.length >= 4 && str.length <= 20 && j < bytes.length && bytes[j] === 0) {
      if (!/Header|Binary/.test(str)) {
        presetName = str;
        console.log(`Preset name: "${presetName}" at offset 0x${i.toString(16)}`);
        break;
      }
    }
  }

  // Parse parameters (type-value pairs)
  const parameters: HXPresetParameter[] = [];
  let paramOffset = offset + 24;

  console.log(`\nParsing parameters starting at offset 0x${paramOffset.toString(16)}:`);
  let paramCount = 0;

  while (paramOffset < bytes.length - 100 && paramCount < 50) {
    const type = view.getUint32(paramOffset, true);

    // Type seems to be 0, 1, 2, or 3
    if (type <= 3) {
      let value: number | boolean;
      let size = 4;

      if (type === 0 || type === 1) {
        // Boolean or index
        value = view.getUint32(paramOffset + 4, true);
        size = 8;
      } else if (type === 2) {
        // Integer
        value = view.getUint32(paramOffset + 4, true);
        size = 8;
      } else if (type === 3) {
        // Float
        value = view.getFloat32(paramOffset + 4, true);
        size = 8;
      } else {
        break;
      }

      parameters.push({
        type,
        value,
        rawBytes: bytes.slice(paramOffset, paramOffset + size)
      });

      if (paramCount < 20) {
        const typeStr = type === 3 ? 'float' : type === 2 ? 'int' : type === 1 ? 'bool/idx' : 'flag';
        console.log(`  [${paramCount}] offset 0x${paramOffset.toString(16)}: type=${type} (${typeStr}), value=${typeof value === 'number' ? value.toFixed(6) : value}`);
      }

      paramOffset += size;
      paramCount++;
    } else {
      break;
    }
  }

  console.log(`Total parameters parsed: ${paramCount}\n`);

  return {
    header,
    effectModelId,
    presetName,
    parameters,
    rawData: bytes
  };
}

// Parse a single .hx1p file
console.log("=== Parsing individual preset file ===\n");
const presetFile = Bun.file("presets/12-String.hx1p");
const presetData = await presetFile.arrayBuffer();
const preset = parsePreset(presetData, false);

console.log("\n=== Parsing preset from backup ===\n");
// Parse first preset from backup
const backupFile = Bun.file("backup.hx1b");
const backupData = await backupFile.arrayBuffer();
const firstPresetData = backupData.slice(0, 1461);
const backupPreset = parsePreset(firstPresetData, true);

// Compare different presets
console.log("\n=== Comparing different effect types ===\n");
const presetFiles = [
  "presets/70s Chorus.hx1p",
  "presets/Adriatic Delay.hx1p",
  "presets/Arbitrator Fuzz.hx1p",
];

for (const file of presetFiles) {
  try {
    const f = Bun.file(file);
    const d = await f.arrayBuffer();
    const view = new DataView(d);
    const effectId = view.getUint32(16, true);
    const name = file.split('/').pop()?.replace('.hx1p', '') || '';
    console.log(`${name.padEnd(25)} - Effect ID: ${effectId.toString().padStart(5)} (0x${effectId.toString(16).padStart(4, '0')})`);
  } catch (e) {
    // Skip if file doesn't exist
  }
}
