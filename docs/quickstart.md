#!/usr/bin/env bun

# HX One Toolkit - Quick Start Guide

## 🎯 What You Can Do

### ✅ Already Working:
1. **Read preset files** - Understand any .hx1p file
2. **Create presets** - Generate custom presets programmatically
3. **Compare presets** - Find differences between any two presets
4. **Extract from backup** - Get all 129 presets from .hx1b
5. **MIDI communication** - Direct device access (no Librarian needed!)
6. **Query device info** - Get firmware version via MIDI

### 🔧 Next Steps:
1. **Parameter mapping** - Map offsets to actual controls
2. **MIDI preset upload** - Send presets directly via SysEx

---

## Common Tasks

### Task 1: Inspect a Preset

**See what's in any preset file:**

```bash
bun run preset-inspector.ts "presets/70s Chorus.hx1p"
```

**Output:**
```
File: presets/70s Chorus.hx1p
Effect ID: 500 (0x01F4)
Preset Name: "70s Chorus"

Parameters (62 total):
[0] 0x0018 Float    0.600000
[1] 0x0020 Bool/Idx 0
[2] 0x0028 Float    0.400000
...
```

---

### Task 2: Compare Two Presets

**Find what changed between versions:**

```bash
bun run preset-inspector.ts preset1.hx1p preset2.hx1p
```

**Shows exact differences:**
```
Parameter Differences:
[0] Float  0.600000 → 0.800000
[2] Float  0.400000 → 0.500000
```

---

### Task 3: Extract All Presets from Backup

**Get individual files from .hx1b:**

```bash
bun run extract-all-presets.ts
```

**Creates:**
```
extracted-presets/
├── Magic Diodes.hx1p
├── Vital Dist.hx1p
├── 70s Chorus.hx1p
... (129 total)
```

---

### Task 4: Check MIDI Connection

**Verify device is connected:**

```bash
bun run scan-midi.ts
```

**Output:**
```
✅ HX One / Line 6 Device Found!
   🎛️  HX One (Input)
   🎛️  HX One (Output)
```

---

### Task 5: Query Device Info

**Get firmware version:**

```bash
bun run test-midi-connection.ts
```

**Output:**
```
Device: HX One
Manufacturer: Line 6 (00 01 0C)
Firmware: 3.8.3.0.0
Device Family: 0x0025 (37)
```

---

### Task 6: Map Parameters (IMPORTANT!)

**This tells you which offset controls which knob!**

**Step 1:** Create test presets on HX One
```
1. Load "70s Chorus" effect
2. Set all controls to minimum → Save as "00_baseline.hx1p"
3. Set ONLY Mix to maximum → Save as "01_mix_max.hx1p"
4. Set ONLY Speed to maximum → Save as "02_speed_max.hx1p"
... (one for each control)
```

**Step 2:** Export via Librarian to `test-presets/70s-chorus/`

**Step 3:** Run analyzer
```bash
bun run map-parameters.ts test-presets/70s-chorus/
```

**Output:**
```
📊 "01_mix_max":
   [0] Offset 0x0018 (Float) 0.000000 → 1.000000

→ Now you know: Offset 0x18 = Mix control!
```

---

### Task 7: Capture Preset Transfer (Advanced)

**Reverse engineer the MIDI protocol:**

**Terminal 1:** Start monitoring
```bash
bun run monitor-sysex.ts
```

**Librarian:** Send a preset to HX One

**Terminal 1:** Watch SysEx messages in real-time
```
📨 SYSEX MESSAGE:
   Length: 1450 bytes
   Hex: F0 00 01 0C 25 ... F7
   ✅ Line 6 Manufacturer ID detected!
```

Press Ctrl+C to save capture to JSON

**Result:** Complete understanding of upload protocol!

---

### Task 8: Create a Custom Preset

**Generate presets programmatically:**

Edit `create-preset.ts`:
```typescript
const myPreset: PresetBuilder = {
  effectId: 0x01F4,  // 70s Chorus
  name: "My Custom Chorus",
  parameters: [
    { type: 3, value: 0.8 },  // Mix at 80%
    { type: 3, value: 0.5 },  // Speed at 50%
    // ... more parameters
  ]
};
```

Run:
```bash
bun run create-preset.ts
```

**Output:** `my-custom-preset.hx1p`

---

## Workflow Recommendations

### For Parameter Understanding:
1. ✅ `preset-inspector.ts` - See what's in files
2. ✅ `map-parameters.ts` - Map offsets to controls
3. ✅ Manual test preset creation

### For Automation:
1. ✅ `scan-midi.ts` - Verify connection
2. ✅ `monitor-sysex.ts` - Capture protocol
3. 🔧 Build preset uploader (next step!)

### For Batch Operations:
1. ✅ `extract-all-presets.ts` - Get all presets
2. ✅ `preset-inspector.ts` - Analyze each
3. ✅ `create-preset.ts` - Generate variations

---

## File Organization

```
hx-one/
├── backup.hx1b                 # Your original backup
├── presets/                    # Original preset files (128)
├── extracted-presets/          # Extracted from backup (129)
├── test-presets/               # Your test presets for mapping
│   └── 70s-chorus/
│       ├── 00_baseline.hx1p
│       ├── 01_mix_max.hx1p
│       └── ...
│
├── Tools (TypeScript):
│   ├── scan-midi.ts           # 🎹 MIDI device scanner
│   ├── test-midi-connection.ts # 🎹 Connection tester
│   ├── monitor-sysex.ts       # 🎹 SysEx monitor
│   ├── decode-sysex-response.ts # 🎹 Message decoder
│   ├── preset-inspector.ts    # 📁 Main inspector
│   ├── extract-all-presets.ts # 📁 Backup extractor
│   ├── create-preset.ts       # 📁 Preset creator
│   ├── map-parameters.ts      # 🗺️  Parameter mapper
│   └── ...
│
└── Documentation:
    ├── README.md              # Main documentation
    ├── QUICKSTART.md          # This file
    ├── MIDI_TOOLS.md          # MIDI tools guide
    ├── TESTING_PLAN.md        # Parameter mapping guide
    ├── FILE_FORMAT.md         # Binary format spec
    └── SUMMARY.md             # Quick reference
```

---

## Dependencies

**Required:**
- Bun (installed ✅)
- easymidi package (installed ✅)

**Optional:**
- Line 6 HX One Librarian (for manual preset testing)

---

## Troubleshooting

### "HX One not found" (MIDI)
- Ensure device is connected via USB
- Close Librarian (might have exclusive access)
- Try: `bun run scan-midi.ts`

### "No such file" errors
- Check file paths are correct
- Ensure .hx1p files are in `presets/` directory
- Use absolute paths if needed

### "Parameter mapping incomplete"
- Need more test presets
- Ensure only ONE parameter changes per test
- Verify baseline has all controls at minimum

---

## What's Next?

### Immediate (Works Now):
1. ✅ Create test presets for parameter mapping
2. ✅ Run `map-parameters.ts` to understand controls
3. ✅ Use MIDI tools to query device

### Short-term (This Week):
1. 🔧 Capture preset upload SysEx with `monitor-sysex.ts`
2. 🔧 Decode the upload protocol
3. 🔧 Build direct preset uploader

### Long-term (Future):
1. 📱 Build CLI preset manager
2. 🌐 Build web-based preset editor
3. 🔄 Automated preset synchronization
4. 📊 Preset analytics and visualization

---

## Quick Command Reference

```bash
# MIDI Tools
bun run scan-midi.ts                    # Find HX One
bun run test-midi-connection.ts         # Test connection
bun run monitor-sysex.ts                # Capture traffic

# Preset Control (NEW!)
bun run load-preset.ts NUM              # Load specific preset (0-127)
bun run next-preset.ts                  # Load next preset
bun run previous-preset.ts              # Load previous preset

# File Tools
bun run preset-inspector.ts FILE        # Inspect preset
bun run preset-inspector.ts F1 F2       # Compare two
bun run extract-all-presets.ts          # Extract from backup
bun run map-parameters.ts DIR           # Map parameters

# Create
bun run create-preset.ts                # Generate preset
```

---

**Status:** ✅ All core tools operational!
**Next:** Create test presets for parameter mapping OR capture SysEx for upload protocol

**Choose your path:**
- 🗺️  **Manual testing** → Immediate parameter understanding
- 🎹 **MIDI capture** → Direct upload automation

**Both are valuable! Start with whichever interests you more.**
