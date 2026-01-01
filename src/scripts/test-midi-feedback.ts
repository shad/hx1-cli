#!/usr/bin/env bun

/**
 * Test if HX One sends MIDI feedback about state changes
 *
 * This script monitors all incoming MIDI from HX One while you
 * interact with the device to see if it reports state changes.
 */

import easymidi from 'easymidi';

console.log("🔍 Testing HX One MIDI Feedback\n");
console.log("This will monitor all incoming MIDI messages from HX One.");
console.log("While this runs, try:");
console.log("  • Changing presets on the device");
console.log("  • Turning the effect ON/OFF");
console.log("  • Adjusting parameters (knobs)");
console.log("  • Moving the expression pedal (if connected)\n");
console.log("="
.repeat(70));
console.log("Press Ctrl+C to stop\n");

try {
  const input = new easymidi.Input('HX One');
  console.log("✅ Listening for MIDI from HX One...\n");

  let messageCount = 0;

  // Monitor all possible message types
  const messageTypes = [
    'sysex', 'cc', 'program', 'noteon', 'noteoff',
    'poly aftertouch', 'channel aftertouch', 'pitch'
  ];

  messageTypes.forEach(msgType => {
    input.on(msgType as any, (msg: any) => {
      messageCount++;
      const timestamp = new Date().toISOString();

      console.log(`\n📨 [${timestamp}] ${msgType.toUpperCase()}:`);

      if (msgType === 'sysex') {
        // easymidi might pass bytes directly or as an array
        const bytes = Array.isArray(msg.bytes) ? msg.bytes : (Array.isArray(msg) ? msg : []);

        if (bytes.length > 0) {
          const hexStr = bytes.map((b: number) =>
            b.toString(16).padStart(2, '0').toUpperCase()
          ).join(' ');
          console.log(`   Length: ${bytes.length} bytes`);
          console.log(`   Hex: ${hexStr}`);

          // Check for Line 6 manufacturer ID
          if (bytes[0] === 0xF0 && bytes.length >= 4) {
            const mfg = bytes.slice(1, 4);
            const mfgHex = mfg.map((b: number) =>
              b.toString(16).padStart(2, '0')
            ).join(' ');

            if (mfgHex === '00 01 0c') {
              console.log(`   ✅ Line 6 message!`);
              console.log(`   Device: 0x${bytes[4]?.toString(16).padStart(2, '0')}`);
              console.log(`   Command: 0x${bytes[5]?.toString(16).padStart(2, '0')}`);
            }
          }
        } else {
          console.log(`   Raw msg:`, JSON.stringify(msg));
        }
      } else if (msgType === 'cc') {
        console.log(`   Controller: ${msg.controller}`);
        console.log(`   Value: ${msg.value}`);
        console.log(`   Channel: ${msg.channel}`);
      } else if (msgType === 'program') {
        console.log(`   Program: ${msg.number}`);
        console.log(`   Channel: ${msg.channel}`);
      } else {
        console.log(`   Data:`, msg);
      }
    });
  });

  // Summary on exit
  process.on('SIGINT', () => {
    console.log("\n\n" + "=".repeat(70));
    console.log(`📊 Total messages received: ${messageCount}`);
    console.log("=".repeat(70));

    if (messageCount === 0) {
      console.log("\n❌ No MIDI messages received from HX One");
      console.log("\n💡 This suggests HX One does NOT send MIDI feedback about:");
      console.log("   • Current preset changes");
      console.log("   • Effect on/off state");
      console.log("   • Parameter value changes");
      console.log("   • Expression pedal position");
      console.log("\n⚠️  Implication: Your scripts must track state locally");
    } else {
      console.log("\n✅ HX One DOES send MIDI feedback!");
      console.log("   Check the messages above to understand what it reports");
    }

    input.close();
    process.exit(0);
  });

  console.log("💡 Instructions:");
  console.log("   1. Change presets using the device footswitches");
  console.log("   2. Turn the effect ON/OFF");
  console.log("   3. Adjust knobs/parameters");
  console.log("   4. If you have an expression pedal, move it");
  console.log("   5. Press Ctrl+C when done\n");

} catch (error: any) {
  console.error("❌ Error:", error.message);
  console.log("\n💡 Make sure:");
  console.log("   • HX One is connected via USB");
  console.log("   • Run 'bun run scan-midi.ts' to verify connection");
  process.exit(1);
}
