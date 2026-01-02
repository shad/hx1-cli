# HX One MIDI Implementation Overview

**Based on:** HX One Owner's Manual Rev C (Firmware 3.70+)
**Document Version:** 2026-01-01

---

## Table of Contents

1. [Overview](#overview)
2. [MIDI Connectivity](#midi-connectivity)
3. [Preset Switching](#preset-switching)
4. [MIDI Control Change (CC) Commands](#midi-control-change-cc-commands)
5. [MIDI Note On Commands](#midi-note-on-commands)
6. [Looper Control](#looper-control)
7. [Configuration Settings](#configuration-settings)
8. [Scripting Use Cases](#scripting-use-cases)
9. [Limitations](#limitations)

---

## Overview

The Line 6 HX One supports comprehensive MIDI control via both USB and 5-pin MIDI IN, allowing:

- **Preset Recall** - Switch between presets 000-127 via Program Change
- **Parameter Control** - Adjust effect parameters via MIDI CC
- **Footswitch Emulation** - Trigger footswitch functions via MIDI CC or Note On
- **Looper Control** - Control the Simple Looper via MIDI
- **Tempo Sync** - Sync to external MIDI Clock

### Answer to "Can I select the 'next' preset from a script?"

**Yes! There are two methods:**

1. **Direct Preset Selection**: Send MIDI Program Change messages to select any specific preset (PC 000-127)
2. **Incremental Next/Previous**: Use **CC#72** for preset navigation:
   - **CC#72 value 64** = Next preset
   - **CC#72 value 0** = Previous preset

**Note:** CC#72 is not documented in the HX One Owner's Manual but has been confirmed to work for preset navigation.

---

## MIDI Connectivity

### Input Methods
- **5-pin MIDI IN** (standard MIDI DIN)
- **USB MIDI** (when connected to computer)

### Default Configuration
- **MIDI Channel:** 1 (configurable to 1-16 or Omni)
- **Program Change Reception:** Enabled by default

---

## Preset Switching

### MIDI Program Change (PC)

**Command Format:**
```
PC: 000-127 → Loads HX One presets 000-127
```

**Example MIDI Messages:**
```
PC 0   → Loads Preset 000
PC 10  → Loads Preset 010
PC 127 → Loads Preset 127
```

### Configuration
- **Setting:** `MIDI PC Rx` (MIDI Program Change Receive)
- **Default:** On
- **Location:** Settings View
- **Options:** On/Off

When `MIDI PC Rx` is OFF, HX One will ignore incoming Program Change messages.

---

## MIDI Control Change (CC) Commands

### Documented CC Mappings

| CC Number | Function | Description |
|-----------|----------|-------------|
| CC1 | ON Switch | **Toggles** the effect on/off (emulates footswitch press) |
| CC2 | FLUX | Activates FLUX function |
| CC3 | Expression Pedal | Controls expression pedal input |
| **CC72** | **Preset Navigation** | **Value 0 = Previous, Value 64 = Next** ⭐ |
| Various | Effect Parameters | Control specific effect parameters |

**Important Note on CC#1:**
CC#1 emulates pressing the ON footswitch, which **toggles** the effect state. It does NOT set an absolute on/off state. Any CC#1 message (regardless of value) will toggle the effect. This means:
- If effect is OFF, CC#1 turns it ON
- If effect is ON, CC#1 turns it OFF
- Your script must track state if you need to know the current on/off status

**Key Discoveries:**
- **CC#72** for next/previous preset navigation is **not documented in the manual** but confirmed working
- The manual indicates additional CC mappings exist for controlling HX One parameters
- Refer to page 31 of the manual for additional parameter control details

---

## MIDI Note On Commands

The manual mentions that MIDI Note On messages can be used to control various HX One functions, but specific Note On mappings are not fully detailed in the main MIDI section.

**Reference:** See page 31 "Controlling HX One Parameters via MIDI" for more information.

---

## Looper Control

The Simple Looper can be controlled via MIDI. Specific commands are documented on page 32 of the manual.

**Key Looper MIDI Functions:**
- Record/Overdub control
- Play/Stop control
- Undo/Redo
- Half-speed playback
- Reverse playback

**Reference:** See page 32 "Controlling the Simple Looper via MIDI" for complete command list.

---

## Configuration Settings

### MIDI Channel

**Location:** Settings View
**Default:** Channel 1
**Options:** 1-16, or Omni

**To Change MIDI Channel:**
1. Enter Settings View
2. Navigate to MIDI Channel setting
3. Select desired channel (1-16) or Omni

### MIDI PC Rx (Program Change Receive)

**Location:** Settings View
**Default:** On
**Options:** On/Off

**Purpose:** Enable/disable reception of MIDI Program Change messages

### MIDI Clock

**Purpose:** Sync tempo-based effects to external MIDI Clock source
**Usage:** Send MIDI Clock from DAW or MIDI controller to HX One

---

## Scripting Use Cases

### Use Case 1: Direct Preset Selection

**Goal:** Load a specific preset from a script

**Solution:**
```python
# Example using Python with mido library
import mido

# Open MIDI output to HX One
output = mido.open_output('HX One')

# Load preset 42
msg = mido.Message('program_change', program=42, channel=0)
output.send(msg)
```

### Use Case 2: Incremental "Next Preset" Navigation

**Goal:** Move to the next preset without knowing all preset numbers

**Solution:**
```python
import mido

# Track current preset (0-127)
current_preset = 0

def load_next_preset():
    global current_preset
    output = mido.open_output('HX One')

    # Increment preset (wrap around at 127)
    current_preset = (current_preset + 1) % 128

    # Send Program Change
    msg = mido.Message('program_change', program=current_preset, channel=0)
    output.send(msg)

    print(f"Loaded preset {current_preset:03d}")

# Usage
load_next_preset()  # → Preset 001
load_next_preset()  # → Preset 002
```

**Important:** Your script must track the current preset number, as HX One doesn't send MIDI feedback about which preset is currently active (not documented in manual).

### Use Case 3: Toggle Effect On/Off

**Goal:** Turn the effect on/off via MIDI

**Solution:**
```python
import mido

output = mido.open_output('HX One')

# Emulate ON footswitch via CC1
msg = mido.Message('control_change', control=1, value=127, channel=0)
output.send(msg)
```

### Use Case 4: Control Expression Pedal via MIDI

**Goal:** Control expression pedal input from a script

**Solution:**
```python
import mido

output = mido.open_output('HX One')

# Set expression pedal to 50% (value 0-127)
msg = mido.Message('control_change', control=3, value=64, channel=0)
output.send(msg)
```

---

## Limitations

### 1. Undocumented CC#72 for Preset Navigation ✅

**UPDATE:** While the manual does not document this, **CC#72 provides next/previous preset navigation**:
- CC#72 value 64 = Next preset
- CC#72 value 0 = Previous preset

This is the preferred method for incremental preset navigation. Alternatively, you can track the current preset in your script and send Program Change messages to navigate.

### 2. No MIDI Feedback (Unconfirmed)

The manual does not indicate that HX One sends MIDI messages reporting:
- Current preset number
- Parameter values
- Effect on/off state

**Implication:** Your script must maintain state if you need to track current settings.

### 3. Preset Range Limited to 000-127

MIDI Program Change supports 0-127, matching HX One's preset capacity.

### 4. Incomplete CC Map in Manual

The manual provides examples of CC mappings (CC1, CC2, CC3) but doesn't publish a complete MIDI CC implementation chart.

**Recommendation:** Use the `monitor-sysex.ts` tool to capture MIDI traffic while adjusting parameters on the device to reverse-engineer additional CC mappings.

---

## Practical Integration Examples

### Integration with Existing HX One Toolkit

Our HX One toolkit already includes MIDI communication tools:

```bash
# Test MIDI connection
bun run test-midi-connection.ts

# Monitor MIDI traffic
bun run monitor-sysex.ts

# Scan for HX One device
bun run scan-midi.ts
```

### Sample Script: Preset Sequencer

```typescript
#!/usr/bin/env bun

import easymidi from 'easymidi';

// Open MIDI output
const output = new easymidi.Output('HX One');

// Sequence of presets to load
const presetSequence = [0, 10, 20, 30, 40];
let currentIndex = 0;

function loadNextInSequence() {
  const presetNum = presetSequence[currentIndex];

  console.log(`Loading preset ${presetNum.toString().padStart(3, '0')}`);

  // Send Program Change
  output.send('program', { number: presetNum, channel: 0 });

  // Move to next in sequence (wrap around)
  currentIndex = (currentIndex + 1) % presetSequence.length;
}

// Load next preset every 5 seconds
setInterval(loadNextInSequence, 5000);

console.log('Preset sequencer running...');
console.log('Press Ctrl+C to stop');
```

---

## Additional Resources

### Manual References
- **Page 30:** MIDI overview and Program Change
- **Page 31:** Controlling parameters via MIDI CC and Note On
- **Page 32:** Simple Looper MIDI control
- **Page 5:** Preset Mode footswitch functions (context for preset navigation)

### HX One Toolkit Tools
- `scan-midi.ts` - Detect HX One MIDI device
- `test-midi-connection.ts` - Test bidirectional MIDI communication
- `monitor-sysex.ts` - Capture MIDI traffic for protocol analysis
- `decode-sysex-response.ts` - Decode captured SysEx messages

### MIDI Libraries for Scripting

**JavaScript/TypeScript (Bun/Node.js):**
- `easymidi` - Simple MIDI I/O (used in our toolkit)
- `@tonejs/midi` - MIDI file parsing/creation

**Python:**
- `mido` - MIDI I/O and message handling
- `python-rtmidi` - Real-time MIDI I/O

**Other:**
- `rtmidi` (C++) - Cross-platform MIDI I/O
- Various language bindings available

---

## Summary

### What You CAN Do
✅ Load any preset 000-127 via MIDI Program Change
✅ Navigate to next/previous preset via CC#72 (value 64 = next, 0 = previous)
✅ Control parameters via MIDI CC
✅ Emulate footswitch functions (ON, FLUX) via MIDI CC
✅ Control expression pedal via MIDI CC
✅ Control the Simple Looper via MIDI
✅ Sync tempo to MIDI Clock

### What's NOT Directly Supported
❌ MIDI feedback of current state (preset number, parameters, etc.)
❌ Complete published MIDI CC implementation chart (many commands undocumented)

### Recommended Approach for Preset Navigation Scripts

**Primary Method (Preferred):**
Use **CC#72** for incremental preset navigation:
- CC#72 value 64 = Next preset
- CC#72 value 0 = Previous preset

**Alternative Method:**
If you need more control, maintain state in your script:
1. Track current preset number (0-127)
2. Send Program Change messages - Use `PC (current ± 1)` to navigate
3. Handle wrap-around - Decide behavior at boundaries (0→127, 127→0)
4. Optional: Build a preset manager - Create a higher-level abstraction

---

**Document Status:** ✅ Based on HX One Owner's Manual Rev C
**Last Updated:** 2026-01-01
**Toolkit Version:** Compatible with HX One Toolkit (TypeScript + Bun)
