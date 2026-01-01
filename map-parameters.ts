#!/usr/bin/env bun

/**
 * Parameter Mapping Tool
 *
 * Analyzes test presets to map parameter offsets to controls
 *
 * Usage:
 *   bun run map-parameters.ts test-presets/70s-chorus/
 */

interface ParsedPreset {
  filename: string;
  name: string;
  effectId: number;
  parameters: Array<{ offset: number; type: number; value: number }>;
}

async function parsePreset(filepath: string): Promise<ParsedPreset> {
  const file = Bun.file(filepath);
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const view = new DataView(data.buffer);

  const effectId = view.getUint32(0x10, true);

  // Find preset name
  let name = filepath.split("/").pop()?.replace(".hx1p", "") || "Unknown";
  for (let i = data.length - 100; i < data.length - 4; i++) {
    let str = "";
    let j = i;
    while (j < data.length && data[j] !== 0 && data[j] >= 32 && data[j] <= 126) {
      str += String.fromCharCode(data[j]);
      j++;
    }
    if (str.length >= 3 && str.length <= 30 && j < data.length && data[j] === 0) {
      name = str;
      break;
    }
  }

  // Parse parameters
  const parameters: Array<{ offset: number; type: number; value: number }> = [];
  let offset = 0x18;

  while (offset < data.length - 100) {
    const type = view.getUint32(offset, true);
    if (type > 3) break;

    let value: number;
    if (type === 3) {
      value = view.getFloat32(offset + 4, true);
    } else {
      value = view.getUint32(offset + 4, true);
    }

    parameters.push({ offset, type, value });
    offset += 8;

    if (parameters.length >= 100) break;
  }

  return { filename: filepath, name, effectId, parameters };
}

async function comparePresets(baseline: ParsedPreset, test: ParsedPreset) {
  const differences: Array<{
    offset: number;
    index: number;
    type: number;
    baselineValue: number;
    testValue: number;
    delta: number;
  }> = [];

  for (let i = 0; i < Math.min(baseline.parameters.length, test.parameters.length); i++) {
    const baseParam = baseline.parameters[i];
    const testParam = test.parameters[i];

    if (baseParam.value !== testParam.value) {
      differences.push({
        offset: baseParam.offset,
        index: i,
        type: baseParam.type,
        baselineValue: baseParam.value,
        testValue: testParam.value,
        delta: testParam.value - baseParam.value,
      });
    }
  }

  return differences;
}

async function analyzeDirectory(dirPath: string) {
  const dir = Bun.file(dirPath);

  // Find all .hx1p files
  const files: string[] = [];
  const proc = Bun.spawn(["find", dirPath, "-name", "*.hx1p", "-type", "f"], {
    stdout: "pipe",
  });

  const output = await new Response(proc.stdout).text();
  files.push(...output.trim().split("\n").filter((f) => f.length > 0));

  if (files.length === 0) {
    console.log(`❌ No .hx1p files found in ${dirPath}`);
    console.log(`\nPlease create test presets first. See TESTING_PLAN.md`);
    return;
  }

  console.log(`\n📁 Found ${files.length} preset files\n`);

  // Sort files (baseline should be first)
  files.sort();

  // Parse all presets
  const presets: ParsedPreset[] = [];
  for (const file of files) {
    const preset = await parsePreset(file);
    presets.push(preset);
    console.log(`  ✓ Loaded: ${preset.name}`);
  }

  // Find baseline (should be first or contain "baseline" in name)
  const baseline = presets.find((p) =>
    p.name.toLowerCase().includes("baseline")
  ) || presets[0];

  console.log(`\n🎯 Using baseline: "${baseline.name}"\n`);
  console.log("=" .repeat(80));
  console.log("PARAMETER MAPPING RESULTS");
  console.log("=".repeat(80));

  const parameterMap = new Map<number, string[]>();

  // Compare each test preset to baseline
  for (const test of presets) {
    if (test === baseline) continue;

    const diffs = await comparePresets(baseline, test);

    if (diffs.length === 0) {
      console.log(`\n⚠️  "${test.name}" - No changes detected (identical to baseline)`);
      continue;
    }

    console.log(`\n📊 "${test.name}":`);
    console.log(`   Changed ${diffs.length} parameter(s):`);

    for (const diff of diffs) {
      const typeStr = diff.type === 3 ? "Float" : diff.type === 2 ? "Int" : "Bool";
      const displayBase = diff.type === 3 ? diff.baselineValue.toFixed(6) : diff.baselineValue.toString();
      const displayTest = diff.type === 3 ? diff.testValue.toFixed(6) : diff.testValue.toString();

      console.log(
        `   [${diff.index.toString().padStart(2)}] ` +
        `Offset 0x${diff.offset.toString(16).toUpperCase().padStart(4, "0")} ` +
        `(${typeStr.padEnd(5)}) ` +
        `${displayBase.padStart(12)} → ${displayTest.padStart(12)}`
      );

      // Track which presets changed this parameter
      if (!parameterMap.has(diff.offset)) {
        parameterMap.set(diff.offset, []);
      }
      parameterMap.get(diff.offset)!.push(test.name);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(80));
  console.log("PARAMETER MAP SUMMARY");
  console.log("=".repeat(80));

  const sortedOffsets = Array.from(parameterMap.keys()).sort((a, b) => a - b);

  for (const offset of sortedOffsets) {
    const presetNames = parameterMap.get(offset)!;
    console.log(
      `\nOffset 0x${offset.toString(16).toUpperCase().padStart(4, "0")} ` +
      `→ Changed by: ${presetNames.join(", ")}`
    );
  }

  // Export JSON
  const mapData = {
    effectId: baseline.effectId,
    effectName: baseline.name.replace(/baseline|test/gi, "").trim(),
    baseline: baseline.name,
    mappings: sortedOffsets.map((offset) => ({
      offset: `0x${offset.toString(16).toUpperCase()}`,
      offsetDecimal: offset,
      index: baseline.parameters.findIndex((p) => p.offset === offset),
      type: baseline.parameters.find((p) => p.offset === offset)?.type,
      changedBy: parameterMap.get(offset),
    })),
  };

  const outputFile = `${dirPath}/parameter-map.json`;
  await Bun.write(outputFile, JSON.stringify(mapData, null, 2));

  console.log(`\n✅ Parameter map saved to: ${outputFile}\n`);
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: bun run map-parameters.ts <directory>");
  console.log("\nExample:");
  console.log("  bun run map-parameters.ts test-presets/70s-chorus/");
  console.log("\nSee TESTING_PLAN.md for instructions on creating test presets.");
  process.exit(1);
}

const directory = args[0];
await analyzeDirectory(directory);
