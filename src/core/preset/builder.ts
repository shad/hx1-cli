/**
 * Preset file builder - create .hx1p files from scratch
 */

import {
  type PresetBuilder,
  ParameterType,
  InvalidPresetError,
  PRESET_FILE_SIZE,
  PRESET_NAME_OFFSET,
  PRESET_NAME_MAX_LENGTH,
  EFFECT_ID_OFFSET,
  DATA_SIZE_OFFSET,
  FIRST_PARAM_OFFSET,
} from '../../types/preset.js';

/**
 * Build a preset file from a preset builder
 * @param builder - Preset builder configuration
 * @returns Binary preset data
 * @throws InvalidPresetError if builder is invalid
 */
export function buildPreset(builder: PresetBuilder): Uint8Array {
  // Validate builder
  validateBuilder(builder);

  // Create buffer
  const data = new Uint8Array(PRESET_FILE_SIZE);
  const view = new DataView(data.buffer);

  // Write header (offsets 0x00-0x0F)
  view.setUint32(0x00, 0, true); // Unknown
  view.setUint32(0x04, 1, true); // Unknown
  view.setUint32(0x08, 0, true); // Unknown
  view.setUint32(0x0c, 1, true); // Unknown

  // Write effect ID
  view.setUint32(EFFECT_ID_OFFSET, builder.effectId, true);

  // Calculate and write data size
  const dataSize = builder.parameters.length * 8;
  view.setUint32(DATA_SIZE_OFFSET, dataSize, true);

  // Write parameters
  let offset = FIRST_PARAM_OFFSET;
  for (const param of builder.parameters) {
    // Write type
    view.setUint32(offset, param.type, true);

    // Write value
    if (param.type === ParameterType.Float) {
      view.setFloat32(offset + 4, param.value, true);
    } else {
      view.setUint32(offset + 4, param.value, true);
    }

    offset += 8;
  }

  // Write preset name
  writePresetName(data, PRESET_NAME_OFFSET, builder.name);

  return data;
}

/**
 * Validate preset builder
 * @param builder - Preset builder
 * @throws InvalidPresetError if invalid
 */
function validateBuilder(builder: PresetBuilder): void {
  if (builder.name.length === 0) {
    throw new InvalidPresetError('Preset name cannot be empty');
  }

  if (builder.name.length > PRESET_NAME_MAX_LENGTH) {
    throw new InvalidPresetError(
      `Preset name too long: ${builder.name.length} (max ${PRESET_NAME_MAX_LENGTH})`
    );
  }

  if (builder.effectId < 0 || builder.effectId > 0xffffffff) {
    throw new InvalidPresetError(`Invalid effect ID: ${builder.effectId}`);
  }

  for (const param of builder.parameters) {
    if (!Object.values(ParameterType).includes(param.type)) {
      throw new InvalidPresetError(`Invalid parameter type: ${param.type}`);
    }
  }
}

/**
 * Write preset name to binary data
 * @param data - Binary data buffer
 * @param offset - Offset to write at
 * @param name - Preset name
 */
function writePresetName(
  data: Uint8Array,
  offset: number,
  name: string
): void {
  const encoder = new TextEncoder();
  const nameBytes = encoder.encode(name);

  // Write name bytes
  for (let i = 0; i < nameBytes.length && i < PRESET_NAME_MAX_LENGTH; i++) {
    const byte = nameBytes[i];
    if (byte !== undefined) {
      data[offset + i] = byte;
    }
  }

  // Null terminator
  if (offset + nameBytes.length < data.length) {
    data[offset + nameBytes.length] = 0;
  }
}
