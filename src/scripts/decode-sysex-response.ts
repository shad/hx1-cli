#!/usr/bin/env bun

/**
 * Decode the SysEx responses from HX One
 */

// Response 1: Universal Device Identity
const response1 = [
  240, 126, 0, 6, 2, 0, 1, 12, 37, 0, 5, 0, 0, 0, 83, 3, 247
];

// Response 2: Firmware version info
const response2 = [
  240, 0, 1, 12, 37, 5, 6, 2, 76, 54, 73, 109, 97, 103, 101, 84, 121, 112, 101,
  58, 109, 97, 105, 110, 0, 76, 54, 73, 109, 97, 103, 101, 86, 101, 114, 115, 105,
  111, 110, 58, 51, 46, 56, 46, 51, 46, 48, 46, 48, 0, 76, 54, 73, 109, 97, 103,
  101, 84, 121, 112, 101, 58, 110, 111, 110, 101, 0, 76, 54, 73, 109, 97, 103, 101,
  86, 101, 114, 115, 105, 111, 110, 58, 110, 111, 110, 101, 0, 247
];

console.log("🔍 Decoding HX One SysEx Responses\n");
console.log("=".repeat(70));

// Decode Response 1
console.log("📨 Response 1: Universal Device Identity");
console.log("=".repeat(70));
console.log(`Full message: ${response1.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}`);
console.log();
console.log(`  F0          - SysEx Start`);
console.log(`  7E          - Universal Non-Realtime`);
console.log(`  00          - Device ID (0 = all)`);
console.log(`  06 02       - Identity Reply`);
console.log(`  00 01 0C    - Manufacturer ID (Line 6)`);
console.log(`  25 00       - Device Family (0x0025 = 37)`);
console.log(`  05 00       - Device Family Member`);
console.log(`  00 00 53 03 - Software Revision (3.83.0.0)`);
console.log(`  F7          - SysEx End`);

// Decode Response 2
console.log("\n" + "=".repeat(70));
console.log("📨 Response 2: Firmware Version Info");
console.log("=".repeat(70));

const text = String.fromCharCode(...response2.slice(8, -1));
const parts = text.split('\0').filter(s => s.length > 0);

console.log("Decoded strings:");
parts.forEach(part => {
  console.log(`  • ${part}`);
});

console.log("\n" + "=".repeat(70));
console.log("✅ Device Information Summary");
console.log("=".repeat(70));
console.log(`  Device: HX One`);
console.log(`  Manufacturer: Line 6 (00 01 0C)`);
console.log(`  Device Family: 0x0025 (37)`);
console.log(`  Firmware: 3.8.3.0.0`);
console.log(`  Image Type: main`);
console.log();

console.log("=".repeat(70));
console.log("💡 What This Means");
console.log("=".repeat(70));
console.log(`
✅ MIDI Communication Working!
   • Device responds to SysEx queries
   • We can identify firmware version
   • Line 6 Manufacturer ID confirmed: 00 01 0C
   • Device Family ID: 0x25 (37)

🔧 Next Steps:
   1. Monitor SysEx during preset transfer
   2. Reverse engineer preset upload protocol
   3. Build direct preset uploader

📋 To capture preset transfer:
   bun run monitor-sysex.ts

Then in Librarian:
   • Send a preset to HX One
   • Watch the SysEx messages
   • Analyze the format
`);
