#!/usr/bin/env bun

/**
 * Test MIDI connection to HX One
 *
 * Attempts basic MIDI communication and listens for responses
 */

import easymidi from 'easymidi';

console.log("🔌 Testing MIDI Connection to HX One\n");

try {
  // Open MIDI input (to receive from device)
  const input = new easymidi.Input('HX One');
  console.log("✅ Opened MIDI Input: HX One");

  // Open MIDI output (to send to device)
  const output = new easymidi.Output('HX One');
  console.log("✅ Opened MIDI Output: HX One");

  console.log("\n" + "=".repeat(70));
  console.log("Listening for MIDI messages from HX One...");
  console.log("=".repeat(70));
  console.log("(Try changing a parameter on the device)\n");

  // Listen for various MIDI message types
  const messageTypes = [
    'noteon', 'noteoff', 'cc', 'program', 'sysex',
    'position', 'mtc', 'select', 'clock', 'start',
    'continue', 'stop', 'reset', 'activesense'
  ];

  messageTypes.forEach(type => {
    input.on(type, (msg: any) => {
      console.log(`📨 Received ${type.toUpperCase()}:`, msg);
    });
  });

  // Send a MIDI identity request (Universal SysEx)
  // F0 7E 7F 06 01 F7
  console.log("\n📤 Sending MIDI Identity Request...");
  const identityRequest = [0xF0, 0x7E, 0x7F, 0x06, 0x01, 0xF7];
  output.send('sysex', identityRequest);
  console.log("   Sent: F0 7E 7F 06 01 F7 (Universal Device Inquiry)");

  // Send Line 6 specific inquiry
  // Line 6 Manufacturer ID: 00 01 0C
  console.log("\n📤 Sending Line 6 Inquiry...");
  const line6Inquiry = [0xF0, 0x00, 0x01, 0x0C, 0x7F, 0x06, 0x01, 0xF7];
  output.send('sysex', line6Inquiry);
  console.log("   Sent: F0 00 01 0C 7F 06 01 F7 (Line 6 Specific)");

  // Keep listening for 10 seconds
  console.log("\n⏳ Listening for 10 seconds...\n");

  setTimeout(() => {
    console.log("\n" + "=".repeat(70));
    console.log("✅ Test completed!");
    console.log("=".repeat(70));
    console.log("\nIf you saw messages above:");
    console.log("   • We can communicate via MIDI!");
    console.log("   • Can now reverse engineer the SysEx protocol");
    console.log("   • Can send presets directly");
    console.log("\nIf no messages:");
    console.log("   • Device might not respond to these queries");
    console.log("   • May need to capture Librarian traffic");
    console.log("   • Try manual preset testing approach");

    input.close();
    output.close();
    process.exit(0);
  }, 10000);

} catch (error: any) {
  console.error("\n❌ Error:", error.message);
  console.log("\nPossible issues:");
  console.log("   • HX One not connected");
  console.log("   • Librarian might have exclusive access");
  console.log("   • MIDI permissions issue");
  process.exit(1);
}
