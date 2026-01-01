# HX One Direct Device Communication

## 🎉 Key Findings

### Device Detection ✅
Your HX One is **connected and detected**:
- **USB Vendor ID:** `0x0e41` (Line 6)
- **USB Product ID:** `0x4255` (16981)
- **Device Class:** `0xEF` (Miscellaneous/Interface Association)
- **Connection:** USB 2.0 (480 Mb/s)

### Librarian Analysis ✅
The Line 6 HX One Librarian uses:
1. **libusb-1.0** - Direct USB communication
2. **CoreMIDI** - MIDI protocol for device control
3. **CoreAudio** - Audio streaming

**Evidence from binary strings:**
- `L6MIDI_IN` / `L6MIDI_OUT`
- `MIDIOutput` / `MIDIEntity`
- `MidiControlManager`
- `sendWirelessDeviceUpdateDataToServer`

### Communication Protocol 📡
The HX One likely uses **USB MIDI SysEx messages** for:
- Preset upload/download
- Parameter changes
- Device configuration

## Two Paths Forward

### Path A: Manual Testing (✅ Ready Now)

**Status:** All tools ready, works immediately

**Process:**
1. Create test presets on HX One (baseline + variations)
2. Export via Librarian to `test-presets/`
3. Run our analyzer to map parameters

**Tools available:**
```bash
# Compare presets and find differences
bun run map-parameters.ts test-presets/

# Inspect any preset
bun run preset-inspector.ts "presets/somefile.hx1p"
```

**Advantages:**
- Works right now
- No additional setup
- Safe and proven
- Will give us complete parameter maps

**Time to results:** ~30 minutes of preset creation

---

### Path B: Direct MIDI Communication (🔧 Requires Setup)

**Status:** Possible, needs MIDI library installation

**What's needed:**
```bash
# Install MIDI support
pip3 install mido python-rtmidi

# Then scan for device
python3 scan-midi-devices.py
```

**Advantages:**
- Can automate preset uploads
- No Librarian needed
- Full programmatic control
- Could build a custom editor

**Next steps:**
1. Install MIDI library
2. Detect HX One MIDI ports
3. Reverse engineer SysEx protocol
4. Send presets directly

**Challenges:**
- Need to discover Line 6 SysEx format
- Might require protocol reverse engineering
- More complex than manual method

## Recommendation

### For Parameter Mapping: **Path A (Manual)**
- Fastest way to understand parameters
- All tools ready
- Just need 5-10 test presets

### For Automation: **Path B (MIDI)**
- Worth pursuing after we understand parameters
- Enables building custom tools
- Could create CLI preset uploader

## Quick Start: Manual Testing

### 1. Create Test Presets

Pick one effect (e.g., "70s Chorus"):

```
Preset 1: "00_baseline" - All controls at minimum
Preset 2: "01_mix_max" - Only Mix at maximum
Preset 3: "02_speed_max" - Only Speed at maximum
... (one for each control)
```

### 2. Export & Analyze

```bash
# Create directory
mkdir -p test-presets/70s-chorus/

# Export your test presets to this folder via Librarian

# Run analyzer
bun run map-parameters.ts test-presets/70s-chorus/
```

### 3. Results

You'll get:
- **Exact parameter map** showing which offset controls which knob
- **JSON export** with all mappings
- **Value ranges** for each parameter

Then you can:
- Build a preset editor
- Create presets programmatically
- Batch-process existing presets

## MIDI Communication (Optional)

If you want to pursue direct MIDI:

### Install MIDI Support
```bash
pip3 install mido python-rtmidi
python3 scan-midi-devices.py
```

### If HX One appears as MIDI device:
- We can send/receive SysEx messages
- Upload presets without Librarian
- Automate everything

### If it doesn't appear:
- Device might use vendor-specific USB protocol
- Would need `libusb` with Node.js/Bun
- More reverse engineering required

## Status Summary

| Feature | Status | Notes |
|---------|--------|-------|
| File format decoded | ✅ Complete | Can read/write .hx1p files |
| Preset inspector | ✅ Working | View all 62 parameters |
| Preset creator | ✅ Working | Generate custom presets |
| Backup extractor | ✅ Working | Extract all 129 presets |
| Parameter mapping | ⏳ Ready | Need test presets from you |
| MIDI detection | ❓ Unknown | Need to install mido library |
| Direct USB upload | ❓ Possible | Via MIDI SysEx (needs testing) |

## What Do You Want To Do?

**Option 1:** Manual parameter mapping (quick, works now)
- You create test presets
- I analyze them
- We document the mappings

**Option 2:** Install MIDI tools and investigate direct communication
- Install mido: `pip3 install mido python-rtmidi`
- Run: `python3 scan-midi-devices.py`
- See if HX One shows up as MIDI device

**Option 3:** Both!
- Start with manual mapping (immediate results)
- Pursue MIDI automation in parallel

What's your preference?
