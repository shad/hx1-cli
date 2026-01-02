/**
 * Preset file parser - pure functions for parsing .hx1p files
 */

import {
  type Preset,
  type Parameter,
  ParameterType,
  InvalidPresetError,
  PRESET_FILE_SIZE,
  PRESET_NAME_OFFSET,
  EFFECT_ID_OFFSET,
  DATA_SIZE_OFFSET,
  FIRST_PARAM_OFFSET,
} from '../../types/preset.js';

/**
 * Parse a preset file from binary data
 * @param data - Binary data from .hx1p file
 * @returns Parsed preset
 * @throws InvalidPresetError if file is invalid
 */
export function parsePreset(data: Uint8Array): Preset {
  // Validate file size
  if (data.length !== PRESET_FILE_SIZE) {
    throw new InvalidPresetError(
      `Invalid file size: ${data.length} bytes (expected ${PRESET_FILE_SIZE})`
    );
  }

  // Create DataView for reading multi-byte values
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  // Read effect ID (little-endian uint32 at offset 0x10)
  const effectId = view.getUint32(EFFECT_ID_OFFSET, true);

  // Read data size (little-endian uint32 at offset 0x14)
  const dataSize = view.getUint32(DATA_SIZE_OFFSET, true);

  // Read preset name (null-terminated string at offset 0x584)
  const name = readPresetName(data, PRESET_NAME_OFFSET);

  // Parse parameters
  const parameters = parseParameters(data, view, FIRST_PARAM_OFFSET, dataSize);

  return {
    effectId,
    name,
    dataSize,
    parameters,
    raw: data,
  };
}

/**
 * Read preset name from binary data
 * @param data - Binary data
 * @param offset - Offset to start reading
 * @returns Preset name (trimmed, null-terminated)
 */
function readPresetName(data: Uint8Array, offset: number): string {
  const nameBytes: number[] = [];

  for (let i = offset; i < data.length; i++) {
    const byte = data[i];

    if (byte === undefined) {
      break;
    }

    if (byte === 0) {
      break; // Null terminator
    }

    nameBytes.push(byte);
  }

  return new TextDecoder('utf-8').decode(new Uint8Array(nameBytes)).trim();
}

/**
 * Parse parameters from binary data
 * @param data - Binary data
 * @param view - DataView for reading
 * @param startOffset - Offset to start reading parameters
 * @param dataSize - Data size from header
 * @returns Array of parameters
 */
function parseParameters(
  data: Uint8Array,
  view: DataView,
  startOffset: number,
  dataSize: number
): Parameter[] {
  const parameters: Parameter[] = [];
  let offset = startOffset;

  // Each parameter is 8 bytes: 4 bytes type + 4 bytes value
  while (offset + 8 <= startOffset + dataSize && offset + 8 <= data.length) {
    const type = view.getUint32(offset, true);
    const rawValue = view.getUint32(offset + 4, true);

    // Interpret value based on type
    let value: number;
    if (type === ParameterType.Float) {
      // Reinterpret bytes as float
      value = view.getFloat32(offset + 4, true);
    } else {
      value = rawValue;
    }

    parameters.push({
      type: type as ParameterType,
      value,
      offset,
    });

    offset += 8;
  }

  return parameters;
}

/**
 * Read a 32-bit unsigned integer (little-endian)
 * @param data - Binary data
 * @param offset - Offset to read from
 * @returns Unsigned 32-bit integer
 */
export function readUInt32LE(data: Uint8Array, offset: number): number {
  const view = new DataView(data.buffer, data.byteOffset + offset, 4);
  return view.getUint32(0, true);
}

/**
 * Read a 32-bit float (little-endian)
 * @param data - Binary data
 * @param offset - Offset to read from
 * @returns 32-bit float
 */
export function readFloat32LE(data: Uint8Array, offset: number): number {
  const view = new DataView(data.buffer, data.byteOffset + offset, 4);
  return view.getFloat32(0, true);
}
