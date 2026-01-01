#!/usr/bin/env bun

/**
 * HX One Device Investigation
 *
 * Let's see what we can learn about device communication
 */

console.log("🔍 HX One Device Investigation\n");

// Check for MIDI devices
console.log("Checking system for connected devices...\n");

const checks = [
  {
    name: "USB Devices (ioreg)",
    cmd: "ioreg -p IOUSB -l -w 0 | grep -i -A 10 -B 5 'line\\|hx'",
  },
  {
    name: "Audio/MIDI Devices",
    cmd: "system_profiler SPUSBDataType | grep -i -A 10 'line\\|hx'",
  },
  {
    name: "Running Processes (Librarian?)",
    cmd: "ps aux | grep -i 'line\\|hx\\|librarian' | grep -v grep",
  },
  {
    name: "Network connections (if librarian is running)",
    cmd: "lsof -i -P | grep -i 'line\\|hx'",
  },
];

for (const check of checks) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`${check.name}`);
  console.log("=".repeat(60));

  const proc = Bun.spawn(["bash", "-c", check.cmd], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const output = await new Response(proc.stdout).text();
  const error = await new Response(proc.stderr).text();

  if (output.trim()) {
    console.log(output);
  } else if (error.trim()) {
    console.log(`(No matches found or error: ${error.slice(0, 100)})`);
  } else {
    console.log("(No matches found)");
  }
}

console.log("\n" + "=".repeat(60));
console.log("📋 Next Steps:");
console.log("=".repeat(60));
console.log(`
1. CONNECT your HX One via USB
2. OPEN the Line 6 Librarian app
3. Run this script again to see what appears

Then we can:
- Check if it uses MIDI (SysEx messages)
- Monitor USB traffic
- Inspect the librarian app
- Look for communication protocols
`);
