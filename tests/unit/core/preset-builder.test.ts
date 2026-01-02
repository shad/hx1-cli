/**
 * Unit tests for preset builder
 */

import { describe, it, expect } from 'vitest';
import { buildPreset } from '../../../src/core/preset/builder';
import { parsePreset } from '../../../src/core/preset/parser';
import {
  InvalidPresetError,
  ParameterType,
  PRESET_FILE_SIZE,
  PRESET_NAME_MAX_LENGTH,
} from '../../../src/types/preset';
import type { PresetBuilder } from '../../../src/types/preset';

describe('buildPreset', () => {
  const createValidBuilder = (): PresetBuilder => ({
    effectId: 500,
    name: 'Test Preset',
    parameters: [
      { type: ParameterType.Float, value: 0.5 },
      { type: ParameterType.Integer, value: 1 },
      { type: ParameterType.BoolOrIndex, value: 0 },
    ],
  });

  it('should create a preset file of correct size', () => {
    const builder = createValidBuilder();
    const data = buildPreset(builder);

    expect(data.length).toBe(PRESET_FILE_SIZE);
  });

  it('should create parseable preset', () => {
    const builder = createValidBuilder();
    const data = buildPreset(builder);

    // Should be parseable without throwing
    const preset = parsePreset(data);

    expect(preset.effectId).toBe(builder.effectId);
    expect(preset.name).toBe(builder.name);
    expect(preset.parameters.length).toBe(builder.parameters.length);
  });

  it('should write correct effect ID', () => {
    const builder: PresetBuilder = {
      effectId: 12345,
      name: 'Test',
      parameters: [],
    };

    const data = buildPreset(builder);
    const preset = parsePreset(data);

    expect(preset.effectId).toBe(12345);
  });

  it('should write correct preset name', () => {
    const builder: PresetBuilder = {
      effectId: 500,
      name: 'My Custom Preset',
      parameters: [],
    };

    const data = buildPreset(builder);
    const preset = parsePreset(data);

    expect(preset.name).toBe('My Custom Preset');
  });

  it('should write float parameters correctly', () => {
    const builder: PresetBuilder = {
      effectId: 500,
      name: 'Test',
      parameters: [
        { type: ParameterType.Float, value: 0.123456 },
      ],
    };

    const data = buildPreset(builder);
    const preset = parsePreset(data);

    expect(preset.parameters[0]?.type).toBe(ParameterType.Float);
    expect(preset.parameters[0]?.value).toBeCloseTo(0.123456, 5);
  });

  it('should write integer parameters correctly', () => {
    const builder: PresetBuilder = {
      effectId: 500,
      name: 'Test',
      parameters: [
        { type: ParameterType.Integer, value: 42 },
      ],
    };

    const data = buildPreset(builder);
    const preset = parsePreset(data);

    expect(preset.parameters[0]?.type).toBe(ParameterType.Integer);
    expect(preset.parameters[0]?.value).toBe(42);
  });

  it('should write multiple parameters correctly', () => {
    const builder: PresetBuilder = {
      effectId: 500,
      name: 'Test',
      parameters: [
        { type: ParameterType.Float, value: 0.5 },
        { type: ParameterType.Integer, value: 10 },
        { type: ParameterType.BoolOrIndex, value: 1 },
        { type: ParameterType.Flag, value: 0 },
      ],
    };

    const data = buildPreset(builder);
    const preset = parsePreset(data);

    expect(preset.parameters.length).toBe(4);
    expect(preset.parameters[0]?.value).toBeCloseTo(0.5, 5);
    expect(preset.parameters[1]?.value).toBe(10);
    expect(preset.parameters[2]?.value).toBe(1);
    expect(preset.parameters[3]?.value).toBe(0);
  });

  it('should handle empty parameter list', () => {
    const builder: PresetBuilder = {
      effectId: 500,
      name: 'Empty',
      parameters: [],
    };

    const data = buildPreset(builder);
    const preset = parsePreset(data);

    expect(preset.parameters.length).toBe(0);
  });

  it('should handle special characters in name', () => {
    const builder: PresetBuilder = {
      effectId: 500,
      name: 'Test-Preset_123',
      parameters: [],
    };

    const data = buildPreset(builder);
    const preset = parsePreset(data);

    expect(preset.name).toBe('Test-Preset_123');
  });

  it('should throw on empty name', () => {
    const builder: PresetBuilder = {
      effectId: 500,
      name: '',
      parameters: [],
    };

    expect(() => buildPreset(builder)).toThrow(InvalidPresetError);
    expect(() => buildPreset(builder)).toThrow(/Preset name cannot be empty/);
  });

  it('should throw on name too long', () => {
    const builder: PresetBuilder = {
      effectId: 500,
      name: 'A'.repeat(PRESET_NAME_MAX_LENGTH + 1),
      parameters: [],
    };

    expect(() => buildPreset(builder)).toThrow(InvalidPresetError);
    expect(() => buildPreset(builder)).toThrow(/Preset name too long/);
  });

  it('should accept maximum length name', () => {
    const builder: PresetBuilder = {
      effectId: 500,
      name: 'A'.repeat(PRESET_NAME_MAX_LENGTH),
      parameters: [],
    };

    // Should not throw
    const data = buildPreset(builder);
    const preset = parsePreset(data);

    // Name should be preserved (though may be truncated if bytes exceed limit)
    expect(preset.name.length).toBeGreaterThan(0);
    expect(preset.name.length).toBeLessThanOrEqual(PRESET_NAME_MAX_LENGTH);
  });

  it('should throw on invalid effect ID (negative)', () => {
    const builder: PresetBuilder = {
      effectId: -1,
      name: 'Test',
      parameters: [],
    };

    expect(() => buildPreset(builder)).toThrow(InvalidPresetError);
    expect(() => buildPreset(builder)).toThrow(/Invalid effect ID/);
  });

  it('should throw on invalid effect ID (too large)', () => {
    const builder: PresetBuilder = {
      effectId: 0x100000000, // > 32-bit max
      name: 'Test',
      parameters: [],
    };

    expect(() => buildPreset(builder)).toThrow(InvalidPresetError);
    expect(() => buildPreset(builder)).toThrow(/Invalid effect ID/);
  });

  it('should throw on invalid parameter type', () => {
    const builder: PresetBuilder = {
      effectId: 500,
      name: 'Test',
      parameters: [
        { type: 999 as ParameterType, value: 0 }, // Invalid type
      ],
    };

    expect(() => buildPreset(builder)).toThrow(InvalidPresetError);
    expect(() => buildPreset(builder)).toThrow(/Invalid parameter type/);
  });

  it('should create identical output for identical input', () => {
    const builder = createValidBuilder();

    const data1 = buildPreset(builder);
    const data2 = buildPreset(builder);

    expect(data1).toEqual(data2);
  });

  it('should write correct data size', () => {
    const builder: PresetBuilder = {
      effectId: 500,
      name: 'Test',
      parameters: [
        { type: ParameterType.Float, value: 0.5 },
        { type: ParameterType.Float, value: 0.6 },
        { type: ParameterType.Float, value: 0.7 },
      ],
    };

    const data = buildPreset(builder);
    const preset = parsePreset(data);

    // Each parameter is 8 bytes
    expect(preset.dataSize).toBe(3 * 8);
  });

  it('should handle zero values correctly', () => {
    const builder: PresetBuilder = {
      effectId: 500,
      name: 'Test',
      parameters: [
        { type: ParameterType.Float, value: 0.0 },
        { type: ParameterType.Integer, value: 0 },
      ],
    };

    const data = buildPreset(builder);
    const preset = parsePreset(data);

    expect(preset.parameters[0]?.value).toBe(0);
    expect(preset.parameters[1]?.value).toBe(0);
  });

  it('should handle negative float values', () => {
    const builder: PresetBuilder = {
      effectId: 500,
      name: 'Test',
      parameters: [
        { type: ParameterType.Float, value: -0.5 },
      ],
    };

    const data = buildPreset(builder);
    const preset = parsePreset(data);

    expect(preset.parameters[0]?.value).toBeCloseTo(-0.5, 5);
  });

  it('should handle very small float values', () => {
    const builder: PresetBuilder = {
      effectId: 500,
      name: 'Test',
      parameters: [
        { type: ParameterType.Float, value: 0.000001 },
      ],
    };

    const data = buildPreset(builder);
    const preset = parsePreset(data);

    expect(preset.parameters[0]?.value).toBeCloseTo(0.000001, 10);
  });

  it('should handle large integer values', () => {
    const builder: PresetBuilder = {
      effectId: 500,
      name: 'Test',
      parameters: [
        { type: ParameterType.Integer, value: 999999 },
      ],
    };

    const data = buildPreset(builder);
    const preset = parsePreset(data);

    expect(preset.parameters[0]?.value).toBe(999999);
  });

  it('should round-trip: build then parse', () => {
    const original: PresetBuilder = {
      effectId: 12345,
      name: 'Round Trip Test',
      parameters: [
        { type: ParameterType.Float, value: 0.123 },
        { type: ParameterType.Integer, value: 456 },
        { type: ParameterType.BoolOrIndex, value: 1 },
        { type: ParameterType.Flag, value: 0 },
      ],
    };

    const data = buildPreset(original);
    const parsed = parsePreset(data);

    expect(parsed.effectId).toBe(original.effectId);
    expect(parsed.name).toBe(original.name);
    expect(parsed.parameters.length).toBe(original.parameters.length);

    for (let i = 0; i < original.parameters.length; i++) {
      const origParam = original.parameters[i];
      const parsedParam = parsed.parameters[i];

      expect(parsedParam?.type).toBe(origParam?.type);

      if (origParam?.type === ParameterType.Float) {
        expect(parsedParam?.value).toBeCloseTo(origParam.value, 5);
      } else {
        expect(parsedParam?.value).toBe(origParam?.value);
      }
    }
  });
});
