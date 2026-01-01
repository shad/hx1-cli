#!/usr/bin/env bun

interface ParsedPreset {
  index: number;
  name: string;
  effectId: number;
  dataSize: number;
  parameters: Array<{
    offset: number;
    type: number;
    value: number;
  }>;
}

const PRESET_SIZE = 1461;
const HEADER_MAGIC = "F19BinaryPresetHeader";

async function extractAllPresets() {
  const backupFile = Bun.file("backup.hx1b");
  const data = await backupFile.arrayBuffer();
  const bytes = new Uint8Array(data);
  const view = new DataView(data);
  const decoder = new TextDecoder();

  const presets: ParsedPreset[] = [];

  // Find all header positions
  const headerOffsets: number[] = [];
  for (let i = 0; i < bytes.length - HEADER_MAGIC.length; i++) {
    const str = decoder.decode(bytes.slice(i, i + HEADER_MAGIC.length));
    if (str === HEADER_MAGIC) {
      headerOffsets.push(i);
    }
  }

  console.log(`Found ${headerOffsets.length} presets in backup\n`);

  // Parse each preset
  for (let i = 0; i < Math.min(10, headerOffsets.length); i++) {
    const startOffset = headerOffsets[i];
    const endOffset = i < headerOffsets.length - 1 ? headerOffsets[i + 1] : bytes.length;
    const presetBytes = bytes.slice(startOffset, endOffset);
    const presetView = new DataView(presetBytes.buffer, presetBytes.byteOffset, presetBytes.byteLength);

    // Skip header magic (21 bytes + null terminator + padding)
    const dataStart = 24;

    const effectId = presetView.getUint32(dataStart + 16, true);
    const dataSize = presetView.getUint32(dataStart + 20, true);

    // Find preset name
    let name = `Preset_${i}`;
    for (let j = presetBytes.length - 100; j < presetBytes.length - 4; j++) {
      let str = "";
      let k = j;
      while (k < presetBytes.length && presetBytes[k] !== 0 && presetBytes[k] >= 32 && presetBytes[k] <= 126) {
        str += String.fromCharCode(presetBytes[k]);
        k++;
      }
      if (str.length >= 4 && str.length <= 30 && k < presetBytes.length && presetBytes[k] === 0) {
        if (!/Header|Binary|F19/.test(str)) {
          name = str;
          break;
        }
      }
    }

    // Parse parameters
    const parameters: Array<{offset: number, type: number, value: number}> = [];
    let paramOffset = dataStart + 24;

    while (paramOffset < presetBytes.length - 100) {
      const type = presetView.getUint32(paramOffset, true);

      if (type > 3) break;

      let value: number;
      if (type === 3) {
        value = presetView.getFloat32(paramOffset + 4, true);
      } else {
        value = presetView.getUint32(paramOffset + 4, true);
      }

      parameters.push({ offset: paramOffset, type, value });
      paramOffset += 8;

      if (parameters.length >= 100) break; // Safety limit
    }

    presets.push({
      index: i,
      name,
      effectId,
      dataSize,
      parameters
    });

    console.log(`[${i.toString().padStart(3)}] ${name.padEnd(30)} | Effect ID: ${effectId.toString().padStart(5)} (0x${effectId.toString(16).padStart(4, '0')}) | Params: ${parameters.length}`);
  }

  return presets;
}

// Export all presets to individual files
async function exportPresetsToFiles() {
  const backupFile = Bun.file("backup.hx1b");
  const data = await backupFile.arrayBuffer();
  const bytes = new Uint8Array(data);
  const decoder = new TextDecoder();

  const HEADER_MAGIC = "F19BinaryPresetHeader";
  const headerOffsets: number[] = [];

  for (let i = 0; i < bytes.length - HEADER_MAGIC.length; i++) {
    const str = decoder.decode(bytes.slice(i, i + HEADER_MAGIC.length));
    if (str === HEADER_MAGIC) {
      headerOffsets.push(i);
    }
  }

  console.log(`\n\nExporting ${headerOffsets.length} presets...\n`);

  const outDir = "extracted-presets";
  await Bun.write(`${outDir}/.gitkeep`, "");

  for (let i = 0; i < headerOffsets.length; i++) {
    const startOffset = headerOffsets[i];
    // Individual presets are the backup preset minus the header magic
    // Backup format: header (24 bytes) + data (1437 bytes) = 1461 bytes
    // Individual format: just the data (1440 bytes)

    const dataStart = startOffset + 24;
    const dataEnd = startOffset + 1461;
    const presetData = bytes.slice(dataStart, Math.min(dataEnd, bytes.length));

    if (presetData.length >= 1400) {
      // Find name
      let name = `preset_${i.toString().padStart(3, '0')}`;
      for (let j = presetData.length - 100; j < presetData.length - 4; j++) {
        let str = "";
        let k = j;
        while (k < presetData.length && presetData[k] !== 0 && presetData[k] >= 32 && presetData[k] <= 126) {
          str += String.fromCharCode(presetData[k]);
          k++;
        }
        if (str.length >= 4 && str.length <= 30 && k < presetData.length && presetData[k] === 0) {
          if (!/Header|Binary|F19/.test(str)) {
            name = str.replace(/[^a-zA-Z0-9\-_ ]/g, '_');
            break;
          }
        }
      }

      const filename = `${outDir}/${name}.hx1p`;
      await Bun.write(filename, presetData);
      if (i < 10) {
        console.log(`  Exported: ${filename}`);
      }
    }
  }

  console.log(`\n✓ Exported ${headerOffsets.length} presets to ${outDir}/`);
}

const presets = await extractAllPresets();
await exportPresetsToFiles();
