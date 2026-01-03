# HX One CLI

**Professional command-line tool for Line 6 HX One guitar effects pedal**

Control your HX One directly from your computer via USB MIDI. Switch presets, toggle effects, check device status, and manage preset files - all from the terminal.

[![Tests](https://img.shields.io/badge/tests-95%20passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-82.56%25-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

---

## ⚠️ Disclaimer

This is a community-developed tool provided **as-is** without warranty. While it uses standard MIDI commands documented in the Line 6 HX One manual, **use at your own risk**. Always maintain backups of your presets.

This tool is not affiliated with, endorsed by, or supported by Line 6 or Yamaha Guitar Group. Line 6 and HX One are trademarks of their respective owners.

Tested on HX One firmware `v3.83`

---

## Features

- **MIDI Control** - Control HX One via USB MIDI connection
- **Preset Navigation** - Switch between presets instantly
- **Effect Toggle** - Turn effects on/off remotely
- **Device Status** - Query device information and state
- **Preset Files** - Parse, compare, and analyze `.hx1p` preset files
- **Fast & Reliable** - Built with TypeScript, thoroughly tested
- **Clean Output** - Human-readable by default, JSON available

## Quick Start

### Prerequisites

- HX One connected via USB
- macOS, Linux, or Windows

### Installation

#### Option 1: Standalone Binary (Recommended - No Node.js required)

Download the pre-built binary for your platform from [Releases](https://github.com/shad/hx-one/releases/latest):

**macOS:**
```bash
# Intel Mac
curl -L https://github.com/shad/hx-one/releases/latest/download/hx1-macos-x64.tar.gz | tar xz
sudo mv hx1 /usr/local/bin/

# Apple Silicon (M1/M2/M3)
curl -L https://github.com/shad/hx-one/releases/latest/download/hx1-macos-arm64.tar.gz | tar xz
sudo mv hx1 /usr/local/bin/
```

**Linux:**
```bash
# x64
curl -L https://github.com/shad/hx-one/releases/latest/download/hx1-linux-x64.tar.gz | tar xz
sudo mv hx1 /usr/local/bin/

# ARM64
curl -L https://github.com/shad/hx-one/releases/latest/download/hx1-linux-arm64.tar.gz | tar xz
sudo mv hx1 /usr/local/bin/
```

**Windows:**
1. Download [hx1-windows-x64.zip](https://github.com/shad/hx-one/releases/latest/download/hx1-windows-x64.zip)
2. Extract `hx1.exe`
3. Add to your PATH or run directly

#### Option 2: Via npm (requires Node.js 18+)

```bash
# Using npm
npm install -g @shadr/hx1-cli

# Using bun
bun install -g @shadr/hx1-cli
```

#### Verify Installation

```bash
hx1 --version
```

### Basic Usage

```bash
# Check if device is connected
hx1 status

# Navigate presets
hx1 next          # Next preset
hx1 prev          # Previous preset
hx1 load 42       # Load preset #42

# Control effect
hx1 toggle        # Toggle effect on/off (emulates footswitch)
hx1 flux          # Activate FLUX (momentary effect variation)
```

## Commands

The CLI has two types of commands: **Device Control** (requires HX One connected) and **Preset Files** (works offline).

### Device Control

These commands require an HX One connected via USB.

#### `hx1 status`

Display device connection status and information.

```bash
$ hx1 status
HX One Status:

  Device:        HX One
  Connection:    USB MIDI
  MIDI Channel:  1

✓ Device connected and ready
```

**Options:**
- `--json` - Output in JSON format for scripting

```bash
$ hx1 status --json
{
  "connected": true,
  "device": {
    "name": "HX One",
    "connection": "USB MIDI"
  }
}
```

---

#### `hx1 load <preset>`

Load a specific preset by number (0-127).

```bash
$ hx1 load 10
✓ Loaded preset 010

$ hx1 load 0
✓ Loaded preset 000
```

**Arguments:**
- `<preset>` - Preset number (0-127)

**Errors:**
- Invalid preset number (out of range)
- Device not connected

---

#### `hx1 next`

Navigate to the next preset.

```bash
$ hx1 next
✓ Next preset loaded
```

---

#### `hx1 prev`

Navigate to the previous preset.

```bash
$ hx1 prev
✓ Previous preset loaded
```

---

#### `hx1 toggle`

Toggle the effect on/off (emulates pressing the footswitch).

```bash
$ hx1 toggle
✓ Effect toggled
```

**Important:** CC#1 emulates the footswitch, which **toggles** the effect state. It does NOT set an absolute on/off state. This means:
- If effect is currently OFF, it turns ON
- If effect is currently ON, it turns OFF
- Your script must track state if you need to know current status

---

#### `hx1 flux`

Activate the FLUX function (momentary effect variation).

```bash
$ hx1 flux
✓ FLUX activated
```

**What is FLUX?**
FLUX is a momentary effect variation feature on HX One. The specific behavior depends on the current effect - it might create a dramatic parameter shift, momentary feedback, or other creative variation. Typically used as a momentary/held effect during performance.

**Use cases:**
- Add dramatic effect variations during performance
- Create momentary feedback or delay trails
- Trigger effect-specific special behaviors

---

### Preset Files

These commands work with `.hx1p` preset files offline (no device required).

#### `hx1 info <file>`

Display detailed information about a preset file.

```bash
$ hx1 info "presets/70s Chorus.hx1p"

Preset Information:

  File:        presets/70s Chorus.hx1p
  Name:        70s Chorus
  Effect ID:   500 (0x1F4)
  Data Size:   165 bytes
  Parameters:  20

Parameters:

  Idx  Type       Value
  ───  ─────────  ──────────────
    0  Float      0.600000
    1  BoolOrIndex  0
    2  Float      0.400000
    ...
```

**Use cases:**
- Inspect preset files before loading
- Identify effect types
- View parameter values
- Debug preset issues

---

#### `hx1 compare <file1> <file2>`

Compare two preset files and show differences.

```bash
$ hx1 compare "preset1.hx1p" "preset2.hx1p"

Preset Comparison:

  File 1: preset1.hx1p
  File 2: preset2.hx1p

  Name 1: My Clean Tone
  Name 2: My Clean Tone V2
          ✗ Different names

  Effect 1: 500 (0x1F4)
  Effect 2: 500 (0x1F4)
            ✓ Same effect

Parameter Summary:

  Total:       20
  Same:        18
  Different:   2

Different Parameters:

  Idx  Type       Value 1        Value 2
  ───  ─────────  ─────────────  ─────────────
    0  Float      0.600000       0.750000
    2  Float      0.400000       0.500000
```

**Use cases:**
- Find what changed between preset versions
- Compare your settings to factory presets
- Track preset modifications over time
- Understand parameter differences

---

### Scripting Examples

```bash
# Quick preset sequence for live performance
hx1 load 5 && sleep 30 && hx1 load 10 && sleep 45 && hx1 load 15

# Toggle effect on/off
hx1 toggle && sleep 2 && hx1 toggle

# Check connection before loading preset
if hx1 status --json | jq -e '.connected'; then
  hx1 load 42
fi

# Loop through presets (bash)
for i in {0..10}; do
  hx1 load $i
  sleep 5
done

# Compare two preset files
hx1 compare "original.hx1p" "modified.hx1p"

# Inspect preset before loading
hx1 info "presets/my-tone.hx1p"
```

---

## Troubleshooting

### Device Not Found

```
✗ HX One not found

💡 Make sure:
   • HX One is connected via USB
   • Device is powered on
   • USB cable is working
```

**Solutions:**
1. Check USB connection
2. Try a different USB port
3. Restart HX One
4. Check MIDI permissions (macOS)
5. List available MIDI devices: `hx1 status --json`

---

### Permission Denied (macOS)

On macOS, you may need to grant MIDI access:

1. System Settings → Privacy & Security → MIDI Devices
2. Allow Terminal (or your terminal app)
3. Restart terminal

---

### Commands Hang or Don't Exit

If commands don't return to prompt:
1. Press Ctrl+C to abort
2. Check for MIDI conflicts (close HX Edit, other MIDI software)
3. Restart the device

---

### Invalid Preset Number

```
✗ Invalid preset number: 200 (must be 0-127)
```

HX One supports presets 0-127 only. Use numbers in this range.

---

## Roadmap

### Version 1.x
- ✅ MIDI device control
- ✅ Preset navigation
- ✅ Effect on/off toggle
- ✅ Device status query
- ⏳ Preset file commands (list, info, compare)
- ⏳ Configuration file support

### Future
- Upload presets via MIDI
- Download presets from device
- Batch preset operations
- Preset library management
- Parameter editing

Have other ideas? Suggest them!

---

## MIDI Implementation

The CLI uses standard MIDI messages to communicate with HX One:

- **Program Change (PC 0-127)** - Select preset
- **Control Change CC#72** - Navigate presets
  - Value 0 = Previous
  - Value 64 = Next
- **Control Change CC#1** - Toggle effect on/off
  - Emulates pressing the ON footswitch (toggles state)
  - Does NOT set absolute on/off state
  - Any value triggers a toggle
- **Control Change CC#2** - Activate FLUX
  - Momentary effect variation
  - Behavior varies by effect type

All communication happens on MIDI Channel 1 by default.

---

## Preset File Format

HX One uses `.hx1p` files for individual presets:

- **Size:** 1440 bytes (fixed)
- **Format:** Little-endian binary
- **Contains:** Effect ID, parameters, preset name

### File Structure

```
Offset   Description
------   -----------
0x10     Effect Model ID (e.g., 500 = 70s Chorus)
0x14     Data size
0x18     Parameters (8 bytes each)
0x584    Preset name (null-terminated string)
```

For complete technical details, see [docs/file-format.md](docs/file-format.md).

---

## Development

### Local Development Setup

To use `hx1` as a command during development (instead of `bun run dev`):

```bash
# Clone repository
git clone https://github.com/shad/hx-one.git
cd hx-one

# Install dependencies
bun install

# Build and link globally
bun run build
bun link

# Now you can use 'hx1' directly
hx1 --version
hx1 status

# After making changes, rebuild and the command updates automatically
bun run build
```

The `hx1` command will point to `/Users/yourusername/.bun/bin/hx1` and use your local development version.

**Unlink when done:**
```bash
bun unlink
```

### Building from Source

```bash
# Install dependencies
bun install

# Run tests
bun run test

# Build
bun run build

# Run without linking
bun run dev status
```

### Project Structure

```
hx-one/
├── src/
│   ├── cli/           # CLI commands
│   ├── core/          # Business logic
│   ├── services/      # MIDI & file services
│   └── types/         # TypeScript types
├── tests/
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── fixtures/      # Test data
└── docs/              # Documentation
```

For development guidelines, see [CLAUDE.md](CLAUDE.md).

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass: `bun run check-all`
5. Submit a pull request

See [CLAUDE.md](CLAUDE.md) for code standards and architecture guidelines.

---

## Technical Details

- **Language:** TypeScript (strict mode)
- **Runtime:** Node.js 18+ / Bun 1.0+
- **MIDI Library:** easymidi
- **CLI Framework:** Commander.js
- **Testing:** Vitest (95 tests, 82% coverage)
- **Architecture:** Layered (CLI → Services → Core)

For detailed documentation:
- **[CLI Specification](docs/hx1-spec.md)** - Complete command reference
- **[MIDI Overview](docs/hx1-midi-overview.md)** - MIDI implementation details
- **[File Format](docs/file-format.md)** - Binary format documentation
- **[Research Notes](docs/RESEARCH.md)** - Reverse engineering process

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/hx-one/issues)
- **Discussions:** [HX One Forums](https://line6.com/support/forums)

---

**Built with ❤️ for the HX One community**

---

## Quick Reference

```bash
# Device Control (requires HX One connected)
hx1 next                    # Next preset
hx1 prev                    # Previous preset
hx1 load <0-127>            # Load specific preset
hx1 toggle                  # Toggle effect on/off
hx1 flux                    # Activate FLUX (momentary effect)
hx1 status                  # Device status
hx1 status --json           # JSON output

# Preset Files (offline)
hx1 info <file>             # Show preset details
hx1 compare <f1> <f2>       # Compare presets

# General
hx1 --help                  # Show help
hx1 --version               # Show version
```
