#!/usr/bin/env bun

/**
 * HX One Preset Inspector
 *
 * Comprehensive tool for inspecting Line 6 HX One preset files.
 * Usage: bun run preset-inspector.ts <file.hx1p>
 */

interface Parameter {
  index: number;
  offset: number;
  type: number;
  typeName: string;
  value: number;
  displayValue: string;
}

interface PresetInfo {
  filename: string;
  fileSize: number;
  effectId: number;
  effectIdHex: string;
  dataSize: number;
  presetName: string;
  nameOffset: number;
  headerInts: number[];
  parameters: Parameter[];
}

async function parsePresetFile(filename: string): Promise<PresetInfo> {
  const file = Bun.file(filename);
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const view = new DataView(data.buffer);

  // Parse header
  const headerInts = [
    view.getUint32(0x00, true),
    view.getUint32(0x04, true),
    view.getUint32(0x08, true),
    view.getUint32(0x0C, true),
  ];

  const effectId = view.getUint32(0x10, true);
  const dataSize = view.getUint32(0x14, true);

  // Find preset name
  let presetName = "";
  let nameOffset = -1;

  for (let i = data.length - 100; i < data.length - 4; i++) {
    let str = "";
    let j = i;
    while (j < data.length && data[j] !== 0 && data[j] >= 32 && data[j] <= 126) {
      str += String.fromCharCode(data[j]);
      j++;
    }
    if (str.length >= 3 && str.length <= 30 && j < data.length && data[j] === 0) {
      presetName = str;
      nameOffset = i;
      break;
    }
  }

  // Parse parameters
  const parameters: Parameter[] = [];
  let offset = 0x18;
  let paramIndex = 0;

  while (offset < data.length - 100) {
    const type = view.getUint32(offset, true);

    if (type > 3) break;

    const typeNames = ["Flag", "Bool/Idx", "Integer", "Float"];
    const typeName = typeNames[type] || "Unknown";

    let value: number;
    let displayValue: string;

    if (type === 3) {
      value = view.getFloat32(offset + 4, true);
      displayValue = value.toFixed(6);
    } else {
      value = view.getUint32(offset + 4, true);
      displayValue = value.toString();
    }

    parameters.push({
      index: paramIndex,
      offset,
      type,
      typeName,
      value,
      displayValue,
    });

    offset += 8;
    paramIndex++;

    if (paramIndex >= 100) break;
  }

  return {
    filename,
    fileSize: data.length,
    effectId,
    effectIdHex: `0x${effectId.toString(16).toUpperCase().padStart(4, '0')}`,
    dataSize,
    presetName,
    nameOffset,
    headerInts,
    parameters,
  };
}

function displayPresetInfo(info: PresetInfo) {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         HX One Preset Inspector                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log();
  console.log(`File:         ${info.filename}`);
  console.log(`Size:         ${info.fileSize} bytes`);
  console.log(`Preset Name:  "${info.presetName}" (at offset 0x${info.nameOffset.toString(16).toUpperCase()})`);
  console.log(`Effect ID:    ${info.effectId} (${info.effectIdHex})`);
  console.log(`Data Size:    ${info.dataSize} bytes`);
  console.log();
  console.log(`Header Values: [${info.headerInts.join(', ')}]`);
  console.log();
  console.log("Parameters:");
  console.log("─────────────────────────────────────────────────────────────");
  console.log("Idx  Offset    Type       Value");
  console.log("─────────────────────────────────────────────────────────────");

  info.parameters.forEach(p => {
    const idx = p.index.toString().padStart(3);
    const offset = `0x${p.offset.toString(16).toUpperCase().padStart(4, '0')}`;
    const type = p.typeName.padEnd(10);
    const value = p.displayValue.padStart(12);
    console.log(`${idx}  ${offset}    ${type} ${value}`);
  });

  console.log();
  console.log(`Total Parameters: ${info.parameters.length}`);
  console.log();
}

function comparePresets(info1: PresetInfo, info2: PresetInfo) {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║         Preset Comparison                                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log();
  console.log(`Preset 1: "${info1.presetName}" (Effect ID: ${info1.effectIdHex})`);
  console.log(`Preset 2: "${info2.presetName}" (Effect ID: ${info2.effectIdHex})`);
  console.log();

  if (info1.effectId !== info2.effectId) {
    console.log("⚠️  Different effect types - comparison may not be meaningful");
    console.log();
  }

  console.log("Parameter Differences:");
  console.log("─────────────────────────────────────────────────────────────");

  const maxParams = Math.max(info1.parameters.length, info2.parameters.length);
  let differences = 0;

  for (let i = 0; i < maxParams; i++) {
    const p1 = info1.parameters[i];
    const p2 = info2.parameters[i];

    if (!p1 || !p2) {
      console.log(`[${i}] Parameter count mismatch`);
      differences++;
      continue;
    }

    if (p1.value !== p2.value) {
      console.log(`[${i}] ${p1.typeName.padEnd(10)} ${p1.displayValue.padStart(12)} → ${p2.displayValue.padStart(12)}`);
      differences++;
    }
  }

  if (differences === 0) {
    console.log("  ✓ No differences found (identical parameters)");
  }

  console.log();
  console.log(`Total differences: ${differences}`);
  console.log();
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: bun run preset-inspector.ts <file.hx1p> [file2.hx1p]");
  console.log();
  console.log("Examples:");
  console.log("  bun run preset-inspector.ts presets/12-String.hx1p");
  console.log("  bun run preset-inspector.ts preset1.hx1p preset2.hx1p");
  process.exit(1);
}

const preset1 = await parsePresetFile(args[0]);
displayPresetInfo(preset1);

if (args.length >= 2) {
  const preset2 = await parsePresetFile(args[1]);
  displayPresetInfo(preset2);
  comparePresets(preset1, preset2);
}
