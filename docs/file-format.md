# Line 6 HX One File Format Documentation

## Overview

The Line 6 HX One uses two binary file formats for storing presets:
- `.hx1p` - Individual preset files (1440 bytes)
- `.hx1b` - Backup files containing multiple presets

## File Format: `.hx1p` (Individual Preset)

**File Size:** 1440 bytes (0x5A0)

### Structure

```
Offset  Size  Type        Description
------  ----  ----------  -----------
0x00    4     uint32_le   Unknown (usually 0)
0x04    4     uint32_le   Unknown (usually 1)
0x08    4     uint32_le   Unknown (usually 0)
0x0C    4     uint32_le   Unknown (usually 1)
0x10    4     uint32_le   Effect Model ID
0x14    4     uint32_le   Data size
0x18    ?     params      Parameter data (type-value pairs)
...     ...   ...         ...
~0x580  32    string      Preset name (null-terminated, max ~20 chars)
```

### Effect Model IDs

Each effect type has a unique ID. Examples found:
- `0x09FA` (2554) - 12-String
- `0x01F4` (500) - 70s Chorus
- `0x068D` (1677) - Adriatic Delay
- `0x02F6` (758) - Arbitrator Fuzz

### Parameter Format

Parameters are stored as type-value pairs (8 bytes each):

```
Offset  Size  Type        Description
------  ----  ----------  -----------
0x00    4     uint32_le   Parameter type (0-3)
0x04    4     varies      Parameter value
```

**Parameter Types:**
- `0` - Flag/Boolean (value is uint32)
- `1` - Boolean/Index (value is uint32)
- `2` - Integer (value is uint32)
- `3` - Float (value is IEEE 754 float32, little-endian)

Example from "12-String" preset:
```
Offset 0x18: type=3 (float), value=0.720000
Offset 0x20: type=3 (float), value=0.400000
Offset 0x28: type=3 (float), value=0.620000
Offset 0x30: type=3 (float), value=0.000000
Offset 0x38: type=2 (int),   value=1
```

## File Format: `.hx1b` (Backup)

**File Structure:** Container for multiple presets

### Structure

The backup file contains multiple presets, each prefixed with a magic header:

```
Preset 1:
  0x000000: "F19BinaryPresetHeader" (21 bytes)
  0x000015: null terminator + padding (3 bytes)
  0x000018: Preset data (1437 bytes)

Preset 2:
  0x0005B5: "F19BinaryPresetHeader" (21 bytes)
  ...
```

**Total preset size in backup:** 1461 bytes (0x5B5)
- Header magic: 21 bytes
- Padding: 3 bytes
- Preset data: 1437 bytes

### Backup Header

Magic string: `F19BinaryPresetHeader`
- Always appears at the start of each preset
- Null-terminated
- Followed by 3 bytes of padding to align to 24 bytes

## Tools Provided

### `analyze-preset.ts`
Analyzes the structure of a single `.hx1p` file.

```bash
bun run analyze-preset.ts
```

### `analyze-backup.ts`
Scans a `.hx1b` backup file and finds all presets.

```bash
bun run analyze-backup.ts
```

### `parse-preset.ts`
Detailed parser that extracts parameters and metadata.

```bash
bun run parse-preset.ts
```

### `extract-all-presets.ts`
Extracts all presets from a backup file to individual `.hx1p` files.

```bash
bun run extract-all-presets.ts
```

## Key Findings

1. **Consistent Structure**: All presets follow the same binary structure
2. **Effect Model ID**: Unique identifier for each effect type at offset 0x10
3. **Little-endian**: All multi-byte values use little-endian byte order
4. **Type-Value Pairs**: Parameters stored as 8-byte type-value pairs
5. **Float Parameters**: Common for effect parameters (mix, tone, etc.)
6. **Name Storage**: Preset name stored near end of file (~offset 0x580)
7. **Fixed Size**: All presets are exactly 1440 bytes (individual) or 1461 bytes (in backup)

## Unknown Fields

Several fields remain to be decoded:
- Bytes 0x00-0x0F: Header integers (possibly version, flags)
- Full parameter mapping for each effect type
- Relationship between data size field and actual parameter count
- Purpose of type 0 vs type 1 parameters

## Next Steps for Reverse Engineering

1. Compare multiple presets of the same effect type with different settings
2. Map parameter positions to actual effect controls
3. Test parameter value ranges (0.0-1.0 for floats?)
4. Document all effect model IDs
5. Create a preset editor tool
