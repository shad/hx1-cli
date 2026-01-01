#!/usr/bin/env bun

/**
 * Test if HX One sends feedback when presets change
 *
 * This will:
 * 1. Start monitoring incoming MIDI
 * 2. Send preset change commands
 * 3. Check if we get any feedback
 */

import easymidi from 'easymidi';

console.log("🔍 Testing Preset Change Feedback\n");
console.log("This will send preset changes and monitor for responses.");
console.log("="
.repeat(70));
console.log();

try {
  const input = new easymidi.Input('HX One');
  const output = new easymidi.Output('HX One');

  const capturedMessages: any[] = [];
  let heartbeatCount = 0;

  // Monitor all incoming messages
  input.on('sysex', (msg: any) => {
    const bytes = Array.isArray(msg.bytes) ? msg.bytes : (Array.isArray(msg) ? msg : []);

    if (bytes.length > 0) {
      const hexStr = bytes.map((b: number) =>
        b.toString(16).padStart(2, '0').toUpperCase()
      ).join(' ');

      // Check if it's the heartbeat message (command 0x05)
      if (bytes[5] === 0x05 && bytes.length === 29) {
        heartbeatCount++;
        console.log(`  [Heartbeat ${heartbeatCount}] Counter: ${bytes[8]}`);
      } else {
        // Different message! Log it
        console.log(`\n📨 DIFFERENT SYSEX MESSAGE:`);
        console.log(`   Length: ${bytes.length} bytes`);
        console.log(`   Hex: ${hexStr}`);
        console.log(`   Command: 0x${bytes[5]?.toString(16).padStart(2, '0')}`);

        capturedMessages.push({
          type: 'sysex',
          hex: hexStr,
          bytes: bytes
        });
      }
    }
  });

  input.on('cc', (msg: any) => {
    console.log(`\n📨 CC MESSAGE:`);
    console.log(`   Controller: ${msg.controller}`);
    console.log(`   Value: ${msg.value}`);
    console.log(`   Channel: ${msg.channel}`);

    capturedMessages.push({
      type: 'cc',
      data: msg
    });
  });

  input.on('program', (msg: any) => {
    console.log(`\n📨 PROGRAM CHANGE:`);
    console.log(`   Program: ${msg.number}`);
    console.log(`   Channel: ${msg.channel}`);

    capturedMessages.push({
      type: 'program',
      data: msg
    });
  });

  console.log("✅ Monitoring started...\n");
  console.log("Waiting 2 seconds before sending commands...\n");

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test sequence
  const tests = [
    { name: "Load Preset 10", action: () => output.send('program', { number: 10, channel: 0 }) },
    { name: "Load Preset 20", action: () => output.send('program', { number: 20, channel: 0 }) },
    { name: "Next Preset (CC#72)", action: () => output.send('cc', { controller: 72, value: 64, channel: 0 }) },
    { name: "Previous Preset (CC#72)", action: () => output.send('cc', { controller: 72, value: 0, channel: 0 }) },
  ];

  for (const test of tests) {
    console.log(`🎹 Sending: ${test.name}...`);
    test.action();

    // Wait 3 seconds to see if we get feedback
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log("\n\n" + "=".repeat(70));
  console.log("📊 Results:");
  console.log("=".repeat(70));
  console.log(`\nHeartbeat messages: ${heartbeatCount}`);
  console.log(`Non-heartbeat messages: ${capturedMessages.length}`);

  if (capturedMessages.length === 0) {
    console.log("\n❌ NO PRESET CHANGE FEEDBACK DETECTED");
    console.log("\n🔍 Conclusion:");
    console.log("   • HX One does NOT send MIDI when presets change");
    console.log("   • Only heartbeat messages (every ~5 seconds)");
    console.log("   • Your scripts MUST track state locally");
  } else {
    console.log("\n✅ PRESET CHANGE FEEDBACK DETECTED!");
    console.log("\nCaptured messages:");
    capturedMessages.forEach((msg, idx) => {
      console.log(`\n${idx + 1}. Type: ${msg.type}`);
      if (msg.hex) {
        console.log(`   Hex: ${msg.hex}`);
      } else {
        console.log(`   Data:`, msg.data);
      }
    });
  }

  input.close();
  output.close();

} catch (error: any) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
