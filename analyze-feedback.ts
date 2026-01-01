#!/usr/bin/env bun

/**
 * Analyze the SYSEX messages from HX One
 */

// Sample messages captured
const messages = [
  "F0 00 01 0C 25 05 4D 00 52 00 00 0B 00 01 00 00 00 04 00 00 00 00 00 00 53 03 00 00 F7",
  "F0 00 01 0C 25 05 4D 00 53 00 00 0B 00 01 00 00 00 04 00 00 00 00 00 00 53 03 00 00 F7",
  "F0 00 01 0C 25 05 4D 00 64 00 00 0B 00 01 00 00 00 04 00 00 00 00 00 00 53 03 00 00 F7",
];

console.log("🔍 Analyzing HX One SYSEX Messages\n");
console.log("="
.repeat(70));

messages.forEach((hex, idx) => {
  const bytes = hex.split(' ').map(b => parseInt(b, 16));

  console.log(`\nMessage ${idx + 1}:`);
  console.log(`  F0          - SysEx Start`);
  console.log(`  00 01 0C    - Line 6 Manufacturer ID`);
  console.log(`  25          - Device (HX One)`);
  console.log(`  05          - Command`);
  console.log(`  4D          - Fixed byte`);
  console.log(`  00          - Fixed byte`);
  console.log(`  ${bytes[8].toString(16).padStart(2, '0').toUpperCase()}          - Counter (${bytes[8]})`);
  console.log(`  00 00 0B... - Remaining data`);
  console.log(`  53 03       - Firmware version bytes (3.83)`);
  console.log(`  00 00       - Padding`);
  console.log(`  F7          - SysEx End`);
});

console.log("\n" + "=".repeat(70));
console.log("📊 Analysis:");
console.log("="
.repeat(70));
console.log(`
✅ HX One IS sending SYSEX messages periodically (~5 seconds)
✅ Messages are Line 6 protocol (00 01 0C)
✅ Command byte: 0x05
✅ Contains firmware version: 3.83 (53 03)

❌ Only one byte changes (message counter at offset 8)
❌ No CC (Control Change) messages observed
❌ No Program Change messages observed
❌ Knob movements did NOT trigger additional messages

🔍 Conclusion:
   • These appear to be HEARTBEAT/STATUS messages
   • HX One does NOT send MIDI feedback for:
     - Parameter changes (knob movements)
     - Effect on/off state

   • Need to test: Preset changes
     - Does it send feedback when preset changes?
     - Let's test this next!
`);

console.log("="
.repeat(70));
console.log("💡 Next Test:");
console.log("="
.repeat(70));
console.log(`
Run the MIDI monitor again and:
  1. Change presets using footswitches
  2. Or send a "next preset" command via MIDI
  3. See if the SYSEX message changes

Look for changes in these areas:
  • Different command byte (not 0x05)
  • Preset number embedded in message
  • Additional SYSEX messages
  • Program Change messages
`);
