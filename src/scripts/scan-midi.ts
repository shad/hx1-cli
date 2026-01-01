#!/usr/bin/env bun

/**
 * Scan for MIDI devices including HX One
 *
 * Uses easymidi for MIDI device detection
 */

import easymidi from 'easymidi';

console.log("🎹 MIDI Device Scanner\n");

try {
  // Get all MIDI inputs
  const inputs = easymidi.getInputs();
  console.log("📥 MIDI Input Ports:");
  if (inputs.length === 0) {
    console.log("   (No MIDI input devices found)");
  } else {
    inputs.forEach((port, idx) => {
      console.log(`   ${idx + 1}. ${port}`);
    });
  }

  // Get all MIDI outputs
  const outputs = easymidi.getOutputs();
  console.log("\n📤 MIDI Output Ports:");
  if (outputs.length === 0) {
    console.log("   (No MIDI output devices found)");
  } else {
    outputs.forEach((port, idx) => {
      console.log(`   ${idx + 1}. ${port}`);
    });
  }

  // Check for HX One or Line 6 devices
  const allPorts = [...inputs, ...outputs];
  const hxPorts = allPorts.filter(port =>
    /HX|Line.*6|line.*6/i.test(port)
  );

  console.log("\n" + "=".repeat(70));

  if (hxPorts.length > 0) {
    console.log("✅ HX One / Line 6 Device Found!");
    console.log("=".repeat(70));
    hxPorts.forEach(port => {
      console.log(`   🎛️  ${port}`);
    });

    console.log("\n💡 Next Steps:");
    console.log("   1. We can send/receive MIDI SysEx messages");
    console.log("   2. Upload presets directly without Librarian");
    console.log("   3. Build automation tools");
    console.log("\n🔧 To test MIDI communication:");
    console.log("   bun run test-midi-connection.ts");
  } else {
    console.log("⚠️  No HX One MIDI ports detected");
    console.log("=".repeat(70));
    console.log("\nPossible reasons:");
    console.log("   1. Device might not expose MIDI over USB");
    console.log("   2. Might need Librarian running to activate MIDI");
    console.log("   3. Could use vendor-specific USB protocol");
    console.log("\n💡 Alternatives:");
    console.log("   • Manual preset testing (recommended - works now!)");
    console.log("   • Investigate libusb direct USB communication");
  }

  console.log("\n" + "=".repeat(70));
  console.log("Total MIDI devices found:", allPorts.length);
  console.log("=".repeat(70) + "\n");

} catch (error) {
  console.error("❌ Error scanning MIDI devices:", error);
  console.log("\nThis might mean:");
  console.log("   • No MIDI drivers installed");
  console.log("   • MIDI subsystem not available");
  console.log("   • Permissions issue");
}
