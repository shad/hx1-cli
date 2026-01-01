#!/usr/bin/env bun

/**
 * Monitor SysEx messages from HX One
 *
 * Captures all MIDI traffic to reverse engineer the protocol
 * Run this, then use the Librarian to transfer a preset
 */

import easymidi from 'easymidi';

console.log("🔍 SysEx Monitor for HX One\n");
console.log("This will capture all MIDI messages from the device.");
console.log("Use the Librarian to send/receive presets while this runs.\n");

try {
  const input = new easymidi.Input('HX One');
  console.log("✅ Monitoring MIDI Input from HX One\n");
  console.log("=".repeat(70));
  console.log("Press Ctrl+C to stop\n");

  const capturedMessages: any[] = [];

  // Monitor all message types
  input.on('sysex', (msg: any) => {
    const timestamp = new Date().toISOString();
    console.log(`\n📨 [${timestamp}] SYSEX MESSAGE:`);

    if (Array.isArray(msg)) {
      // Format as hex
      const hexStr = msg.map((b: number) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
      console.log(`   Length: ${msg.length} bytes`);
      console.log(`   Hex: ${hexStr}`);

      // Try to identify Line 6 messages
      if (msg[0] === 0xF0 && msg.length >= 4) {
        const manufacturerID = msg.slice(1, 4);
        const mfgHex = manufacturerID.map((b: number) => b.toString(16).padStart(2, '0')).join(' ');

        if (mfgHex === '00 01 0c') {
          console.log(`   ✅ Line 6 Manufacturer ID detected!`);
          console.log(`   Device: ${msg[4]?.toString(16).padStart(2, '0')}`);
          console.log(`   Command: ${msg[5]?.toString(16).padStart(2, '0')}`);
        }
      }

      // Save for later analysis
      capturedMessages.push({
        timestamp,
        type: 'sysex',
        data: msg,
        hex: hexStr
      });
    }
  });

  input.on('cc', (msg: any) => {
    const timestamp = new Date().toISOString();
    console.log(`\n📨 [${timestamp}] CONTROL CHANGE:`);
    console.log(`   Controller: ${msg.controller}`);
    console.log(`   Value: ${msg.value}`);

    capturedMessages.push({
      timestamp,
      type: 'cc',
      data: msg
    });
  });

  input.on('program', (msg: any) => {
    const timestamp = new Date().toISOString();
    console.log(`\n📨 [${timestamp}] PROGRAM CHANGE:`);
    console.log(`   Program: ${msg.number}`);

    capturedMessages.push({
      timestamp,
      type: 'program',
      data: msg
    });
  });

  // Save captured data on exit
  process.on('SIGINT', async () => {
    console.log("\n\n" + "=".repeat(70));
    console.log(`✅ Captured ${capturedMessages.length} messages`);
    console.log("=".repeat(70));

    if (capturedMessages.length > 0) {
      const filename = `sysex-capture-${Date.now()}.json`;
      await Bun.write(filename, JSON.stringify(capturedMessages, null, 2));
      console.log(`\n💾 Saved to: ${filename}`);
      console.log("\n💡 Next steps:");
      console.log("   1. Analyze the captured messages");
      console.log("   2. Identify preset transfer protocol");
      console.log("   3. Build preset upload tool");
    }

    input.close();
    process.exit(0);
  });

  console.log("💡 Instructions:");
  console.log("   1. Use the Librarian to send a preset to HX One");
  console.log("   2. Or receive a preset from HX One");
  console.log("   3. Watch the output here to see the SysEx messages");
  console.log("   4. Press Ctrl+C when done to save capture\n");

} catch (error: any) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
