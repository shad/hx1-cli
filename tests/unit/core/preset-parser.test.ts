/**
 * Unit tests for preset parser
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parsePreset, readUInt32LE, readFloat32LE } from '../../../src/core/preset/parser';
import {
  InvalidPresetError,
  ParameterType,
  PRESET_FILE_SIZE,
} from '../../../src/types/preset';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('parsePreset', () => {
  let validPresetData: Uint8Array;

  beforeEach(() => {
    // Load a real preset file for testing
    const fixturePath = join(__dirname, '../../fixtures/presets/70s-chorus.hx1p');
    validPresetData = new Uint8Array(readFileSync(fixturePath));
  });

  it('should parse a valid preset file', () => {
    const preset = parsePreset(validPresetData);

    expect(preset).toBeDefined();
    expect(preset.effectId).toBeTypeOf('number');
    expect(preset.name).toBeTypeOf('string');
    expect(preset.dataSize).toBeTypeOf('number');
    expect(preset.parameters).toBeInstanceOf(Array);
    expect(preset.raw).toBeInstanceOf(Uint8Array);
  });

  it('should extract correct effect ID from 70s Chorus', () => {
    const preset = parsePreset(validPresetData);

    // 70s Chorus has effect ID 500 (0x01F4)
    expect(preset.effectId).toBe(500);
  });

  it('should extract correct preset name', () => {
    const preset = parsePreset(validPresetData);

    expect(preset.name).toBe('70s Chorus');
  });

  it('should parse parameters as array', () => {
    const preset = parsePreset(validPresetData);

    expect(preset.parameters.length).toBeGreaterThan(0);
    expect(preset.parameters[0]).toHaveProperty('type');
    expect(preset.parameters[0]).toHaveProperty('value');
    expect(preset.parameters[0]).toHaveProperty('offset');
  });

  it('should have correct parameter types', () => {
    const preset = parsePreset(validPresetData);

    for (const param of preset.parameters) {
      expect([
        ParameterType.Flag,
        ParameterType.BoolOrIndex,
        ParameterType.Integer,
        ParameterType.Float,
      ]).toContain(param.type);
    }
  });

  it('should store raw data', () => {
    const preset = parsePreset(validPresetData);

    expect(preset.raw).toEqual(validPresetData);
    expect(preset.raw.length).toBe(PRESET_FILE_SIZE);
  });

  it('should throw on invalid file size (too small)', () => {
    const tooSmall = new Uint8Array(100);

    expect(() => parsePreset(tooSmall)).toThrow(InvalidPresetError);
    expect(() => parsePreset(tooSmall)).toThrow(/Invalid file size/);
  });

  it('should throw on invalid file size (too large)', () => {
    const tooLarge = new Uint8Array(2000);

    expect(() => parsePreset(tooLarge)).toThrow(InvalidPresetError);
    expect(() => parsePreset(tooLarge)).toThrow(/Invalid file size/);
  });

  it('should throw with exact file size in error message', () => {
    const invalidData = new Uint8Array(100);

    expect(() => parsePreset(invalidData)).toThrow(`Invalid file size: 100 bytes (expected ${PRESET_FILE_SIZE})`);
  });

  it('should handle preset names with special characters', () => {
    // Create a preset with special characters in name
    const testData = new Uint8Array(validPresetData);
    const nameOffset = 0x584;
    const testName = 'Test-Preset_123';
    const encoder = new TextEncoder();
    const nameBytes = encoder.encode(testName);

    // Write test name
    for (let i = 0; i < nameBytes.length; i++) {
      const byte = nameBytes[i];
      if (byte !== undefined) {
        testData[nameOffset + i] = byte;
      }
    }
    testData[nameOffset + nameBytes.length] = 0; // Null terminator

    const preset = parsePreset(testData);
    expect(preset.name).toBe(testName);
  });

  it('should trim whitespace from preset names', () => {
    const testData = new Uint8Array(validPresetData);
    const nameOffset = 0x584;
    const testName = '  Padded Name  ';
    const encoder = new TextEncoder();
    const nameBytes = encoder.encode(testName);

    for (let i = 0; i < nameBytes.length; i++) {
      const byte = nameBytes[i];
      if (byte !== undefined) {
        testData[nameOffset + i] = byte;
      }
    }
    testData[nameOffset + nameBytes.length] = 0;

    const preset = parsePreset(testData);
    expect(preset.name).toBe('Padded Name');
  });

  it('should handle empty preset name', () => {
    const testData = new Uint8Array(validPresetData);
    const nameOffset = 0x584;

    // Write null terminator at start
    testData[nameOffset] = 0;

    const preset = parsePreset(testData);
    expect(preset.name).toBe('');
  });

  it('should parse float parameters correctly', () => {
    const preset = parsePreset(validPresetData);

    // Find a float parameter
    const floatParam = preset.parameters.find(p => p.type === ParameterType.Float);

    expect(floatParam).toBeDefined();
    expect(floatParam?.value).toBeTypeOf('number');
    expect(Number.isFinite(floatParam?.value)).toBe(true);
  });

  it('should parse integer parameters correctly', () => {
    const preset = parsePreset(validPresetData);

    // Find an integer parameter
    const intParam = preset.parameters.find(p => p.type === ParameterType.Integer);

    if (intParam) {
      expect(intParam.value).toBeTypeOf('number');
      expect(Number.isInteger(intParam.value) || intParam.value === Math.floor(intParam.value)).toBe(true);
    }
  });

  it('should store correct offset for each parameter', () => {
    const preset = parsePreset(validPresetData);

    // First parameter should be at offset 0x18
    expect(preset.parameters[0]?.offset).toBe(0x18);

    // Parameters are 8 bytes apart
    for (let i = 1; i < preset.parameters.length; i++) {
      const prevOffset = preset.parameters[i - 1]?.offset ?? 0;
      const currOffset = preset.parameters[i]?.offset ?? 0;
      expect(currOffset - prevOffset).toBe(8);
    }
  });
});

describe('readUInt32LE', () => {
  it('should read little-endian 32-bit unsigned integer', () => {
    const data = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    const value = readUInt32LE(data, 0);

    // Little-endian: 0x04030201
    expect(value).toBe(0x04030201);
  });

  it('should read from specified offset', () => {
    const data = new Uint8Array([0xFF, 0xFF, 0x01, 0x00, 0x00, 0x00]);
    const value = readUInt32LE(data, 2);

    expect(value).toBe(1);
  });

  it('should handle zero value', () => {
    const data = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
    const value = readUInt32LE(data, 0);

    expect(value).toBe(0);
  });

  it('should handle maximum value', () => {
    const data = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]);
    const value = readUInt32LE(data, 0);

    expect(value).toBe(0xFFFFFFFF);
  });
});

describe('readFloat32LE', () => {
  it('should read little-endian 32-bit float', () => {
    // Create a known float value
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, 3.14159, true); // little-endian

    const data = new Uint8Array(buffer);
    const value = readFloat32LE(data, 0);

    expect(value).toBeCloseTo(3.14159, 5);
  });

  it('should read from specified offset', () => {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setFloat32(4, 2.71828, true);

    const data = new Uint8Array(buffer);
    const value = readFloat32LE(data, 4);

    expect(value).toBeCloseTo(2.71828, 5);
  });

  it('should handle zero', () => {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, 0.0, true);

    const data = new Uint8Array(buffer);
    const value = readFloat32LE(data, 0);

    expect(value).toBe(0);
  });

  it('should handle negative values', () => {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, -1.5, true);

    const data = new Uint8Array(buffer);
    const value = readFloat32LE(data, 0);

    expect(value).toBeCloseTo(-1.5, 5);
  });

  it('should handle very small values', () => {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, 0.000001, true);

    const data = new Uint8Array(buffer);
    const value = readFloat32LE(data, 0);

    expect(value).toBeCloseTo(0.000001, 10);
  });
});
