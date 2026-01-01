#!/usr/bin/env bun

/**
 * Inspect HX One USB device in detail
 */

console.log("🔍 Detailed HX One USB Device Inspection\n");

const checks = [
  {
    name: "USB Device Detailed Info",
    cmd: "system_profiler SPUSBDataType -json 2>/dev/null | jq '.SPUSBDataType[0].\"_items\"[] | select(.\"_name\" == \"HX One\" or .\"product_id\" == \"0x4255\")'",
  },
  {
    name: "IORegistry USB Device Details",
    cmd: "ioreg -p IOUSB -l -w 0 -r -n 'HX One'",
  },
  {
    name: "USB Interfaces",
    cmd: "ioreg -p IOUSB -l -w 0 -r -c IOUSBHostInterface | grep -A 30 -B 5 'HX One'",
  },
  {
    name: "MIDI Devices (if any)",
    cmd: "ls -la /dev/cu.* /dev/tty.* 2>/dev/null || echo 'No serial devices'",
  },
  {
    name: "CoreMIDI Devices",
    cmd: "system_profiler SPAudioDataType -json 2>/dev/null | jq '.SPAudioDataType[] | select(.\"_name\" | contains(\"MIDI\"))'",
  },
  {
    name: "Librarian App Info",
    cmd: "otool -L '/Applications/Line6/HX One Librarian.app/Contents/MacOS/HX One Librarian' 2>/dev/null | grep -i 'midi\\|usb\\|audio' || echo 'Librarian not found'",
  },
  {
    name: "Check for MIDI in Librarian",
    cmd: "strings '/Applications/Line6/HX One Librarian.app/Contents/MacOS/HX One Librarian' 2>/dev/null | grep -i 'sysex\\|midi\\|0e41\\|4255' | head -20 || echo 'Not found'",
  },
];

for (const check of checks) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`${check.name}`);
  console.log("=".repeat(70));

  const proc = Bun.spawn(["bash", "-c", check.cmd], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const output = await new Response(proc.stdout).text();
  const error = await new Response(proc.stderr).text();

  if (output.trim()) {
    console.log(output.trim().slice(0, 5000)); // Limit output
  } else {
    console.log("(No output or not found)");
  }
}

console.log("\n" + "=".repeat(70));
console.log("📊 Analysis:");
console.log("=".repeat(70));
console.log(`
Based on the device class (0xEF), the HX One likely uses:
1. USB Audio (for audio I/O)
2. USB MIDI (for preset transfer and control)

Next steps to enable direct communication:
1. Try Node.js 'usb' library for direct USB access
2. Try CoreMIDI via SysEx messages (most likely)
3. Reverse engineer the Librarian's communication

The most promising approach is likely USB MIDI SysEx messages.
`);
