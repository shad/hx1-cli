# HX One MIDI Communication Tools 🎹

## ✅ SUCCESS! Direct MIDI Communication Working

Your HX One is fully accessible via MIDI! We can:
- ✅ Detect the device
- ✅ Send/receive MIDI messages
- ✅ Query firmware version (3.8.3.0.0)
- ✅ Identify device (Line 6, Family ID: 0x25)

## Available Tools

### 1. `scan-midi.ts` - Device Scanner
Scans for all MIDI devices and identifies HX One.

```bash
bun run scan-midi.ts
```

**Output:**
- Lists all MIDI input/output ports
- Identifies HX One devices
- Shows connection status

---

### 2. `test-midi-connection.ts` - Connection Tester
Tests bidirectional MIDI communication with HX One.

```bash
bun run test-midi-connection.ts
```

**What it does:**
- Opens MIDI I/O to HX One
- Sends device identity request
- Listens for responses
- Displays firmware info

**Output:**
```
Device: HX One
Manufacturer: Line 6 (00 01 0C)
Firmware: 3.8.3.0.0
Device Family: 0x0025 (37)
```

---

### 3. `monitor-sysex.ts` ⭐ - SysEx Monitor
Captures all MIDI traffic for protocol analysis.

```bash
bun run monitor-sysex.ts
```

**Instructions:**
1. Run the monitor
2. Use Librarian to send/receive presets
3. Watch SysEx messages in real-time
4. Press Ctrl+C to save capture

**Output:**
- Real-time hex dump of all messages
- Identifies Line 6 specific messages
- Saves to JSON file for analysis

**Use cases:**
- Reverse engineer preset upload format
- Understand parameter change messages
- Build automation tools

---

### 4. `decode-sysex-response.ts` - Message Decoder
Decodes captured SysEx messages.

```bash
bun run decode-sysex-response.ts
```

**What it shows:**
- Manufacturer ID breakdown
- Device family codes
- Firmware version parsing
- Protocol structure

---

## Protocol Information

### Line 6 SysEx Format

**Manufacturer ID:** `00 01 0C` (Line 6)
**Device Family:** `0x25` (37) - HX One
**Message Structure:**
```
F0          - SysEx Start
00 01 0C    - Line 6 Manufacturer ID
25          - Device Family (HX One)
<command>   - Command byte
<data>      - Variable length data
F7          - SysEx End
```

### Known Commands

From device identity response:
```
F0 7E 00 06 02 00 01 0C 25 00 05 00 00 00 53 03 F7
   │  │  │  │  └─────┬─────┘ └──┬──┘ └──────┬──────┘
   │  │  │  │      Line 6    Family   Version 3.83.0.0
   │  │  │  └─ Identity Reply
   │  │  └─ Device ID
   │  └─ Universal Non-Realtime
   └─ SysEx Start
```

### Firmware Version String
```
L6ImageType:main
L6ImageVersion:3.8.3.0.0
```

---

## Next Steps

### Option A: Capture Preset Transfer (Recommended)

**Goal:** Understand how presets are sent via SysEx

**Steps:**
1. Start monitor: `bun run monitor-sysex.ts`
2. In Librarian: Send a simple preset to HX One
3. Observe the SysEx messages
4. Analyze the format
5. Build a preset uploader!

**Expected to see:**
- Preset header with effect ID
- Parameter data in binary format
- Checksum or validation bytes

### Option B: Manual Parameter Mapping

**Goal:** Map parameters to controls

**Steps:**
1. Create test presets (baseline + variations)
2. Export via Librarian
3. Run: `bun run map-parameters.ts test-presets/`
4. Get exact parameter mappings

**Both approaches complement each other!**

---

## Building a Preset Uploader

Once we understand the SysEx format, we can build:

```typescript
// Pseudo-code for preset uploader
async function uploadPreset(presetFile: string) {
  const output = new easymidi.Output('HX One');

  // Read our .hx1p file
  const presetData = await Bun.file(presetFile).arrayBuffer();

  // Convert to Line 6 SysEx format
  const sysexMessage = convertToSysEx(presetData);

  // Send to device
  output.send('sysex', sysexMessage);

  console.log('✅ Preset uploaded!');
}
```

---

## Advantages of Direct MIDI Access

✅ **No Librarian needed** - Upload presets via CLI
✅ **Automation** - Batch operations
✅ **Custom tools** - Build your own editor
✅ **Version control** - Track preset changes
✅ **CI/CD** - Automated preset deployment

---

## Current Capabilities

| Feature | Status | Tool |
|---------|--------|------|
| Detect device | ✅ Working | `scan-midi.ts` |
| Query firmware | ✅ Working | `test-midi-connection.ts` |
| Monitor traffic | ✅ Working | `monitor-sysex.ts` |
| Decode messages | ✅ Working | `decode-sysex-response.ts` |
| Read preset files | ✅ Working | `preset-inspector.ts` |
| Create presets | ✅ Working | `create-preset.ts` |
| Upload via MIDI | 🔧 Next step | Need to capture format |
| Parameter mapping | ⏳ Ready | Need test presets |

---

## Quick Reference

### Scan for devices:
```bash
bun run scan-midi.ts
```

### Test connection:
```bash
bun run test-midi-connection.ts
```

### Capture preset transfer:
```bash
# Terminal 1: Start monitor
bun run monitor-sysex.ts

# Terminal 2: Use Librarian to send preset
# Back to Terminal 1: Observe SysEx messages
# Ctrl+C to save capture
```

### Analyze preset files:
```bash
bun run preset-inspector.ts "presets/some-preset.hx1p"
```

---

## Success Criteria

✅ **Device Detection** - HX One shows up as MIDI device
✅ **Communication** - Device responds to queries
✅ **Protocol ID** - Line 6 manufacturer confirmed
✅ **Firmware Info** - Version 3.8.3.0.0 detected

**Next:** Reverse engineer preset upload format!

---

## Resources

- **MIDI SysEx Spec:** [midi.org/specifications](https://www.midi.org/specifications)
- **Line 6 Manufacturer ID:** `00 01 0C`
- **HX One Device Family:** `0x25` (37)
- **easymidi docs:** [easymidi on npm](https://www.npmjs.com/package/easymidi)

---

**Status:** 🎉 MIDI communication fully operational!
**Next Step:** Capture and decode preset transfer SysEx messages
