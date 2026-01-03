# HX One CLI Tool Specification (`hx1`)

**Version:** 1.0.0
**Target Audience:** Musicians with technical skills who want to script and automate their HX One workflow
**Design Philosophy:** Simple, composable commands inspired by Git and other modern CLI tools

---

## Table of Contents

1. [Overview](#overview)
2. [Installation & Setup](#installation--setup)
3. [Command Reference](#command-reference)
4. [File Management](#file-management)
5. [Scripting & Automation](#scripting--automation)
6. [Configuration](#configuration)
7. [Examples](#examples)

---

## Overview

The `hx1` command-line tool provides complete control over your Line 6 HX One guitar effects pedal via MIDI. It enables:

- **Remote preset control** - Navigate and load presets from your computer
- **Backup & restore** - Pull all presets to local files, push them back
- **Preset management** - Compare, inspect, and modify preset files
- **Device status** - Query current state and device info
- **Automation** - Script complex preset workflows

### Design Principles

- **Zero configuration** - Works out of the box when HX One is connected
- **Sensible defaults** - Local `presets/` directory, human-readable output
- **Composable** - Chain commands with standard Unix tools
- **Scriptable** - JSON output mode for automation
- **Safe** - Confirmation prompts for destructive operations

---

## Installation & Setup

```bash
# Install globally
npm install -g @shadr/hx1-cli

# Or use directly with bun (current)
bun install
alias hx1="bun run hx1.ts"
```

### First Run

```bash
# Initialize local preset directory
hx1 init

# Verify device connection
hx1 status

# Pull all presets from device
hx1 pull --all
```

---

## Command Reference

### Navigation Commands

#### `hx1 next`
Load the next preset on the device.

```bash
hx1 next
```

**Behavior:**
- Wraps around: preset 127 → preset 0
- Outputs: `Loaded preset 011: "Vintage Phaser"`

#### `hx1 prev`
Load the previous preset on the device.

```bash
hx1 prev
```

**Behavior:**
- Wraps around: preset 0 → preset 127
- Outputs: `Loaded preset 009: "Magic Diodes"`

#### `hx1 load <preset>`
Load a specific preset by number or name.

```bash
# By number (0-127)
hx1 load 42

# By name (fuzzy match)
hx1 load "70s Chorus"
hx1 load chorus          # Matches first preset containing "chorus"

# By file
hx1 load presets/my-custom.hx1p
```

**Options:**
- `-n, --number` - Load by preset number only (skip name lookup)
- `-q, --quiet` - Suppress output

**Examples:**
```bash
hx1 load 0                    # Load preset 000
hx1 load "Adriatic Delay"     # Load by exact name
hx1 load delay                # Load first preset matching "delay"
```

---

### Transfer Commands

#### `hx1 pull [preset...] [options]`
Pull preset(s) from device to local files.

```bash
# Pull all presets
hx1 pull --all

# Pull specific preset(s)
hx1 pull 10
hx1 pull 0 1 2 3 4

# Pull range
hx1 pull 10..20

# Pull by name pattern
hx1 pull --name "Chorus*"
```

**Options:**
- `-a, --all` - Pull all 128 presets
- `-d, --dir <path>` - Target directory (default: `./presets/`)
- `-o, --overwrite` - Overwrite existing files without prompting
- `-n, --dry-run` - Show what would be pulled without doing it
- `--format <format>` - Filename format (see [File Management](#file-management))
- `-q, --quiet` - Suppress progress output
- `-j, --json` - Output JSON for scripting

**File Naming:**
Default format: `{number:03d} - {name}.hx1p`
- Example: `010 - 70s Chorus.hx1p`

**Examples:**
```bash
# Pull everything
hx1 pull --all

# Pull presets 0-9 to custom directory
hx1 pull 0..9 --dir backups/

# Pull without prompts
hx1 pull --all --overwrite

# See what would be pulled
hx1 pull --all --dry-run
```

**Output:**
```
Pulling presets from HX One...
  ✓ 000 - Magic Diodes.hx1p
  ✓ 001 - Vital Dist.hx1p
  ✓ 010 - 70s Chorus.hx1p
  ...
✓ Pulled 128 presets to ./presets/
```

#### `hx1 push <preset> <file> [options]`
Push a preset file to a specific slot on the device.

**⚠️ Status:** Not yet implemented (requires upload protocol)

```bash
# Push file to preset slot 10
hx1 push 10 presets/my-custom.hx1p

# Push with different name
hx1 push 10 presets/my-custom.hx1p --name "My Custom"

# Push multiple
hx1 push 10 custom-delay.hx1p 11 custom-reverb.hx1p
```

**Options:**
- `--name <name>` - Override preset name in file
- `-n, --dry-run` - Validate file without uploading
- `-y, --yes` - Skip confirmation prompt
- `-q, --quiet` - Suppress output

**Safety:**
- Requires confirmation before overwriting device presets
- Validates preset file format before upload
- Shows diff of changes

**Examples:**
```bash
# Push to slot 42
hx1 push 42 presets/custom-chorus.hx1p

# Push multiple presets
hx1 push 10 a.hx1p 11 b.hx1p 12 c.hx1p

# Non-interactive mode (for scripts)
hx1 push 10 file.hx1p --yes --quiet
```

#### `hx1 backup [file] [options]`
Create a complete backup of all device presets.

```bash
# Backup to default file: ./backups/hx1-backup-{timestamp}.hx1b
hx1 backup

# Backup to specific file
hx1 backup my-backup.hx1b

# Backup to directory
hx1 backup --dir backups/
```

**Options:**
- `-d, --dir <path>` - Backup directory (default: `./backups/`)
- `-f, --format <format>` - Filename format (default: `hx1-backup-{timestamp}.hx1b`)
- `-q, --quiet` - Suppress output

**Output:**
```
Creating backup...
  ✓ Pulled 128 presets
  ✓ Saved to backups/hx1-backup-20260101-143022.hx1b
```

#### `hx1 restore <file> [options]`
Restore all presets from a backup file.

**⚠️ Status:** Not yet implemented (requires upload protocol)

```bash
# Restore from backup
hx1 restore backups/hx1-backup-20260101-143022.hx1b

# Preview changes
hx1 restore backup.hx1b --dry-run
```

**Options:**
- `-n, --dry-run` - Show what would be restored
- `-y, --yes` - Skip confirmation
- `-q, --quiet` - Suppress output

**Safety:**
- **Destructive operation** - overwrites all 128 device presets
- Requires explicit confirmation
- Shows preview of changes

---

### Information Commands

#### `hx1 status [options]`
Show current device and preset status.

```bash
hx1 status
```

**Output:**
```
HX One Status:
  Device:        HX One
  Connection:    USB MIDI
  Firmware:      3.8.3.0.0
  MIDI Channel:  1

Current State:
  Preset:        010 - "70s Chorus"
  Effect:        ON
  Bypass:        OFF

Local:
  Presets:       128 files in ./presets/
  Backups:       3 backups in ./backups/
  Last Pull:     2026-01-01 14:30:22
```

**Options:**
- `-j, --json` - Output JSON
- `-s, --short` - Compact output (just preset number/name)

**JSON Output:**
```json
{
  "device": {
    "name": "HX One",
    "firmware": "3.8.3.0.0",
    "midiChannel": 1,
    "connected": true
  },
  "current": {
    "preset": 10,
    "name": "70s Chorus",
    "effectOn": true
  },
  "local": {
    "presetsDir": "./presets/",
    "presetCount": 128,
    "backupsDir": "./backups/",
    "backupCount": 3,
    "lastPull": "2026-01-01T14:30:22Z"
  }
}
```

#### `hx1 list [options]`
List all presets (device or local files).

```bash
# List device presets
hx1 list

# List local files
hx1 list --local

# List with effect IDs
hx1 list --verbose
```

**Options:**
- `-l, --local` - List local preset files instead of device
- `-v, --verbose` - Show effect IDs and file sizes
- `-f, --filter <pattern>` - Filter by name pattern
- `-j, --json` - Output JSON
- `--format <format>` - Custom output format

**Output:**
```
Device Presets (128):
  000  Magic Diodes
  001  Vital Dist
  010  70s Chorus        ← current
  011  Vintage Phaser
  ...
  127  Test Preset
```

**Verbose Output:**
```
  010  70s Chorus          Effect: 0x01F4 (500)   Size: 1440 bytes
```

**Examples:**
```bash
# List all device presets
hx1 list

# List local files
hx1 list --local

# Find all chorus presets
hx1 list --filter "*chorus*"

# Get JSON for scripting
hx1 list --json | jq '.[] | select(.name | contains("Delay"))'
```

#### `hx1 info <preset> [options]`
Show detailed information about a preset.

```bash
# Info about device preset
hx1 info 10

# Info about local file
hx1 info presets/custom.hx1p
```

**Output:**
```
Preset Information:

File:         presets/010 - 70s Chorus.hx1p
Size:         1440 bytes
Preset Name:  "70s Chorus"
Effect ID:    500 (0x01F4)
Effect Name:  70s Chorus

Parameters (62 total):
  [0]  Offset 0x0018  Float     0.600000
  [1]  Offset 0x0020  Bool/Idx  0
  [2]  Offset 0x0028  Float     0.400000
  ...

Parameter Mappings (if known):
  [0]  Mix         60%
  [2]  Speed       40%
  ...
```

**Options:**
- `-j, --json` - Output JSON
- `-p, --parameters` - Show all parameters (default)
- `--no-parameters` - Hide parameters
- `--hex` - Show hex dump

#### `hx1 compare <preset1> <preset2> [options]`
Compare two presets and show differences.

```bash
# Compare two files
hx1 compare presets/a.hx1p presets/b.hx1p

# Compare device preset to file
hx1 compare 10 presets/custom.hx1p

# Compare two device presets
hx1 compare 10 20
```

**Output:**
```
Comparing Presets:
  A: 010 - 70s Chorus
  B: 020 - Adriatic Delay

Differences:
  Effect ID:      500 → 1677
  Preset Name:    "70s Chorus" → "Adriatic Delay"

  Parameter Changes (15):
    [0]  Float     0.600000 → 0.450000
    [2]  Float     0.400000 → 0.750000
    [5]  Integer   1 → 3
    ...

  ✓ 47 parameters unchanged
```

**Options:**
- `-v, --verbose` - Show unchanged parameters too
- `-j, --json` - Output JSON
- `--diff-tool <cmd>` - Use external diff tool (e.g., `vimdiff`)

---

### Control Commands

#### `hx1 on`
Turn the effect ON.

```bash
hx1 on
```

**MIDI:** Sends CC#1 (ON switch)

#### `hx1 off`
Turn the effect OFF (bypass).

```bash
hx1 off
```

**MIDI:** Sends CC#1 (ON switch)

#### `hx1 toggle`
Toggle effect ON/OFF.

```bash
hx1 toggle
```

---

### Management Commands

#### `hx1 init [options]`
Initialize a local preset workspace.

```bash
# Create default directories
hx1 init

# Custom preset directory
hx1 init --preset-dir my-presets/
```

**Creates:**
```
./presets/          # Local preset files
./backups/          # Backup files (.hx1b)
./.hx1config        # Configuration file
```

**Options:**
- `--preset-dir <path>` - Custom preset directory
- `--backup-dir <path>` - Custom backup directory

#### `hx1 config [key] [value]`
View or modify configuration.

```bash
# Show all config
hx1 config

# Get specific value
hx1 config preset-dir

# Set value
hx1 config preset-dir ./my-presets/
hx1 config midi-channel 2

# Reset to defaults
hx1 config --reset
```

**Configuration Keys:**
- `preset-dir` - Local preset directory (default: `./presets/`)
- `backup-dir` - Backup directory (default: `./backups/`)
- `midi-channel` - MIDI channel (default: `1`)
- `midi-device` - MIDI device name (default: auto-detect)
- `filename-format` - Preset filename format
- `confirm-overwrites` - Prompt before overwriting (default: `true`)

---

## File Management

### Filename Formats

Default format: `{number:03d} - {name}.hx1p`

**Available variables:**
- `{number}` - Preset number (0-127)
- `{number:03d}` - Zero-padded preset number (000-127)
- `{name}` - Preset name from file
- `{effect}` - Effect name (if known)
- `{effect-id}` - Effect ID in hex
- `{timestamp}` - Current timestamp

**Examples:**
```bash
# Default: "010 - 70s Chorus.hx1p"
hx1 pull --all

# Simple: "010.hx1p"
hx1 pull --all --format "{number:03d}.hx1p"

# Descriptive: "70s Chorus (010).hx1p"
hx1 pull --all --format "{name} ({number:03d}).hx1p"

# Effect-based: "Chorus - 70s.hx1p"
hx1 pull --all --format "{effect} - {name}.hx1p"
```

### Directory Structure

```
project/
├── presets/                    # Local preset files
│   ├── 000 - Magic Diodes.hx1p
│   ├── 001 - Vital Dist.hx1p
│   ├── 010 - 70s Chorus.hx1p
│   └── ...
│
├── backups/                    # Device backups
│   ├── hx1-backup-20260101-143022.hx1b
│   └── hx1-backup-20260101-120000.hx1b
│
└── .hx1config                  # Configuration file
```

---

## Scripting & Automation

### JSON Output Mode

Most commands support `--json` for machine-readable output.

```bash
# Get current preset as JSON
hx1 status --json | jq '.current.preset'

# List all presets with "delay" in name
hx1 list --json | jq '.[] | select(.name | contains("Delay"))'

# Export preset info
hx1 info 10 --json > preset-10-info.json
```

### Exit Codes

- `0` - Success
- `1` - General error
- `2` - Device not found
- `3` - File not found
- `4` - Invalid preset number/name
- `5` - MIDI communication error
- `6` - User cancelled operation

### Scripting Examples

#### Backup before pulling
```bash
#!/bin/bash
echo "Creating backup..."
hx1 backup || exit 1

echo "Pulling presets..."
hx1 pull --all --overwrite || exit 1

echo "Complete!"
```

#### Load preset sequence
```bash
#!/bin/bash
# Load presets 10, 20, 30 with 5 second delays
for preset in 10 20 30; do
  hx1 load $preset
  sleep 5
done
```

#### Find and load by name
```bash
#!/bin/bash
# Load first chorus preset
PRESET=$(hx1 list --json | jq -r '.[] | select(.name | contains("Chorus")) | .number' | head -1)
hx1 load $PRESET
```

#### Batch pull by effect type
```bash
#!/bin/bash
# Pull all delay presets
hx1 list --json | \
  jq -r '.[] | select(.name | contains("Delay")) | .number' | \
  xargs hx1 pull --dir delays/
```

---

## Configuration

### Configuration File (`.hx1config`)

TOML format:

```toml
[directories]
presets = "./presets/"
backups = "./backups/"

[midi]
channel = 1
device = "auto"  # or "HX One"

[behavior]
confirm-overwrites = true
auto-backup = false

[format]
filename = "{number:03d} - {name}.hx1p"
backup = "hx1-backup-{timestamp}.hx1b"

[output]
default-format = "human"  # or "json"
color = true
```

### Environment Variables

- `HX1_PRESET_DIR` - Override preset directory
- `HX1_BACKUP_DIR` - Override backup directory
- `HX1_MIDI_DEVICE` - MIDI device name
- `HX1_NO_COLOR` - Disable colored output

---

## Examples

### Daily Workflow

```bash
# Morning: pull any changes from device
hx1 pull --all --overwrite

# Work on presets in DAW/editor
# ... edit files in presets/ ...

# Evening: push changes back
hx1 push 10 presets/my-new-delay.hx1p
hx1 push 11 presets/my-new-reverb.hx1p
```

### Setlist Automation

```bash
#!/bin/bash
# Load presets for setlist

echo "Song 1: Clean tone"
hx1 load 10

read -p "Press enter for Song 2..."
hx1 load 20

read -p "Press enter for Song 3..."
hx1 load 30
```

### Preset Management

```bash
# Compare current device preset to backup
hx1 pull 10 --dir /tmp/
hx1 compare /tmp/010*.hx1p backups/previous/010*.hx1p

# Find all modified presets
for i in {0..127}; do
  if ! hx1 compare $i presets/ --quiet; then
    echo "Preset $i has changes"
  fi
done
```

### Version Control Integration

```bash
# Save presets to git
hx1 pull --all --overwrite
git add presets/
git commit -m "Preset update $(date)"
git push

# Restore from git
git checkout main -- presets/
hx1 push --all presets/  # Push all files to device
```

---

## Implementation Notes

### Current Status

✅ **Implemented:**
- `hx1 next` - CC#72 (value 64)
- `hx1 prev` - CC#72 (value 0)
- `hx1 load <number>` - MIDI Program Change
- `hx1 status` - Query device via SYSEX
- `hx1 list --local` - List local .hx1p files
- `hx1 info <file>` - Parse preset file
- `hx1 compare` - Compare two preset files
- `hx1 pull --all` - Pull from backup file
- `hx1 backup` - Create .hx1b backup file

⏳ **In Progress:**
- `hx1 pull <preset>` - Requires MIDI download protocol
- `hx1 push` - Requires MIDI upload protocol
- `hx1 restore` - Requires MIDI upload protocol

❓ **Unknown:**
- MIDI protocol for preset download (single preset)
- MIDI protocol for preset upload
- Parameter-to-control mapping

### Technical Requirements

**Dependencies:**
- `easymidi` - MIDI communication
- `commander` - CLI argument parsing
- `chalk` - Terminal colors
- `ora` - Spinners/progress
- `inquirer` - Interactive prompts

**Platform:**
- macOS, Linux, Windows
- Node.js 18+ or Bun
- USB MIDI connection to HX One

---

## Future Enhancements

### Potential Features

1. **Live Mode**
   ```bash
   hx1 live
   # Interactive TUI for preset navigation
   # Real-time parameter display
   ```

2. **Preset Editor**
   ```bash
   hx1 edit 10
   # Opens interactive preset editor
   # Adjust parameters, save changes
   ```

3. **Parameter Control**
   ```bash
   hx1 set param 0 0.8
   # Adjust individual parameters via MIDI
   ```

4. **Batch Operations**
   ```bash
   hx1 batch rename "*Chorus*" --prefix "My "
   hx1 batch copy 10..20 --to 50..60
   ```

5. **Preset Library**
   ```bash
   hx1 install artist-pack-01.zip
   hx1 search "vintage delay"
   ```

6. **Web UI**
   ```bash
   hx1 serve
   # Starts local web server for preset management
   ```

---

## Appendix

### MIDI Implementation Summary

| Function | MIDI Command | Notes |
|----------|--------------|-------|
| Load preset | Program Change (PC 0-127) | Direct preset selection |
| Next preset | CC#72 value 64 | Incremental navigation |
| Previous preset | CC#72 value 0 | Incremental navigation |
| Effect ON/OFF | CC#1 | Emulates ON footswitch |
| FLUX | CC#2 | FLUX function |
| Expression | CC#3 | Expression pedal control |
| Query status | SYSEX (Line 6) | Returns preset number, firmware |
| Upload preset | SYSEX (Line 6) | **Not yet implemented** |
| Download preset | SYSEX (Line 6) | **Not yet implemented** |

### File Format Reference

See `docs/FILE_FORMAT.md` for complete `.hx1p` format specification.

---

**Document Status:** ✅ Complete specification
**Last Updated:** 2026-01-01
**Version:** 1.0.0
