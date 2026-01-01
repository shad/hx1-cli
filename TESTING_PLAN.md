# HX One Parameter Mapping Plan

## Goal
Map each parameter offset to its corresponding control on the HX One device.

## Method: Systematic Parameter Isolation

### Step 1: Choose a Test Effect
Pick one effect to fully map (e.g., "70s Chorus" or "Adriatic Delay")

### Step 2: Create Baseline Preset
1. On HX One: Load the effect
2. Set ALL parameters to their **minimum values**
3. Name it: `TEST_BASELINE`
4. Export via Line 6 Librarian
5. Save to: `test-presets/00_baseline.hx1p`

### Step 3: One Parameter at a Time
For each control on the device:

1. Load `TEST_BASELINE`
2. Change **only ONE parameter** to maximum
3. Name it descriptively: `TEST_MIX_MAX`, `TEST_SPEED_MAX`, etc.
4. Export via Librarian
5. Save to: `test-presets/01_mix_max.hx1p`, etc.

### Step 4: Compare with Inspector

```bash
bun run preset-inspector.ts \
  test-presets/00_baseline.hx1p \
  test-presets/01_mix_max.hx1p
```

This will show **exactly which offset changed** = that's the Mix parameter!

### Step 5: Document Findings

Record in a mapping file which offset controls what.

## Example Workflow

### Test Case: 70s Chorus

**Controls to test:**
1. Mix (usually 0.0-1.0)
2. Speed
3. Depth
4. Feedback
5. Tone
6. Any additional parameters

**Process:**
```
1. Create: 00_baseline_all_min.hx1p (all controls at minimum)
2. Create: 01_mix_max.hx1p (only Mix at maximum)
3. Compare → Find which offset changed
4. Create: 02_speed_max.hx1p (only Speed at maximum)
5. Compare → Find which offset changed
... repeat for all controls
```

## Automated Comparison Tool

I'll create a tool that compares multiple presets at once:

```bash
bun run map-parameters.ts test-presets/
```

This will analyze all test presets and generate a parameter map automatically.

## Alternative: Fine-Grained Testing

If you want to understand parameter ranges:

1. Create presets at different values:
   - Mix at 0%, 25%, 50%, 75%, 100%
2. Compare to see how the values scale
3. Determine if it's linear, logarithmic, etc.

## Directory Structure

```
test-presets/
├── 70s-chorus/
│   ├── 00_baseline.hx1p
│   ├── 01_mix_max.hx1p
│   ├── 02_speed_max.hx1p
│   ├── 03_depth_max.hx1p
│   └── ...
├── adriatic-delay/
│   ├── 00_baseline.hx1p
│   └── ...
└── results/
    ├── 70s-chorus-map.json
    └── adriatic-delay-map.json
```

## What I Need From You

### Option A: Manual Testing (Easiest)
1. **Is your HX One connected now?**
2. **Is Line 6 Librarian running?**
3. **Pick one effect to start with** (I recommend a simple one like Chorus)
4. Create baseline + test presets as described above
5. Save them to `test-presets/` directory
6. I'll analyze them with the tools

### Option B: Direct Communication (More Complex)
First, let me check if we can talk to the device directly:

**Please run these commands and share the output:**

```bash
# With HX One CONNECTED and Librarian RUNNING:
bun run investigate-device.ts

# Also check for MIDI devices:
ls -la /dev/cu.* /dev/tty.*

# See if it shows up as audio/MIDI:
system_profiler SPUSBDataType | grep -A 20 "Line 6"
```

This will tell us if we can communicate directly via:
- USB MIDI SysEx
- USB HID
- Custom USB protocol

## Questions

1. **Is your HX One currently connected via USB?**
2. **What version of Line 6 Librarian are you using?**
3. **Do you have time to create ~5-10 test presets manually?**
4. **Which effect would you like to map first?**

Once we have test presets, the rest is automated! The comparison tool will show exactly which bytes changed.
