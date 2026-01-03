/**
 * Tests for CLI formatting utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { printComparison, printDifferentParameters } from '../../../src/cli/format.js';
import { ParameterType } from '../../../src/types/preset.js';
import type { Preset, PresetComparison } from '../../../src/types/preset.js';

describe('printDifferentParameters', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should print different float parameters', () => {
    const preset1: Preset = {
      effectId: 500,
      name: 'Test',
      dataSize: 8,
      parameters: [
        { type: ParameterType.Float, value: 0.5 },
      ],
      rawData: new Uint8Array(),
    };

    const preset2: Preset = {
      effectId: 500,
      name: 'Test',
      dataSize: 8,
      parameters: [
        { type: ParameterType.Float, value: 0.75 },
      ],
      rawData: new Uint8Array(),
    };

    printDifferentParameters(preset1, preset2, [0]);

    expect(consoleLogSpy).toHaveBeenCalled();
    const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
    const hasHeader = calls.some((call) => call.includes('Different Parameters'));
    expect(hasHeader).toBe(true);
  });

  it('should print different integer parameters', () => {
    const preset1: Preset = {
      effectId: 500,
      name: 'Test',
      dataSize: 8,
      parameters: [
        { type: ParameterType.Integer, value: 10 },
      ],
      rawData: new Uint8Array(),
    };

    const preset2: Preset = {
      effectId: 500,
      name: 'Test',
      dataSize: 8,
      parameters: [
        { type: ParameterType.Integer, value: 20 },
      ],
      rawData: new Uint8Array(),
    };

    printDifferentParameters(preset1, preset2, [0]);

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should handle missing parameters', () => {
    const preset1: Preset = {
      effectId: 500,
      name: 'Test',
      dataSize: 8,
      parameters: [
        { type: ParameterType.Float, value: 0.5 },
      ],
      rawData: new Uint8Array(),
    };

    const preset2: Preset = {
      effectId: 500,
      name: 'Test',
      dataSize: 0,
      parameters: [],
      rawData: new Uint8Array(),
    };

    printDifferentParameters(preset1, preset2, [0]);

    expect(consoleLogSpy).toHaveBeenCalled();
    const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
    const hasNA = calls.some((call) => call.includes('N/A'));
    expect(hasNA).toBe(true);
  });
});

describe('printComparison', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should print file names', () => {
    const preset1: Preset = {
      effectId: 500,
      name: 'Test1',
      dataSize: 0,
      parameters: [],
      rawData: new Uint8Array(),
    };

    const preset2: Preset = {
      effectId: 500,
      name: 'Test2',
      dataSize: 0,
      parameters: [],
      rawData: new Uint8Array(),
    };

    const comparison: PresetComparison = {
      preset1,
      preset2,
      sameName: false,
      sameEffect: true,
      differentParameters: [],
      sameParameters: [],
    };

    printComparison(
      { file1: 'test1.hx1p', file2: 'test2.hx1p' },
      { preset1, preset2 },
      comparison
    );

    expect(consoleLogSpy).toHaveBeenCalled();
    const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
    const hasFile1 = calls.some((call) => call.includes('test1.hx1p'));
    const hasFile2 = calls.some((call) => call.includes('test2.hx1p'));
    expect(hasFile1).toBe(true);
    expect(hasFile2).toBe(true);
  });

  it('should indicate same name', () => {
    const preset1: Preset = {
      effectId: 500,
      name: 'Test',
      dataSize: 0,
      parameters: [],
      rawData: new Uint8Array(),
    };

    const preset2: Preset = {
      effectId: 500,
      name: 'Test',
      dataSize: 0,
      parameters: [],
      rawData: new Uint8Array(),
    };

    const comparison: PresetComparison = {
      preset1,
      preset2,
      sameName: true,
      sameEffect: true,
      differentParameters: [],
      sameParameters: [],
    };

    printComparison(
      { file1: 'test1.hx1p', file2: 'test2.hx1p' },
      { preset1, preset2 },
      comparison
    );

    const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
    const hasSameName = calls.some((call) => call.includes('Same name'));
    expect(hasSameName).toBe(true);
  });

  it('should indicate different names', () => {
    const preset1: Preset = {
      effectId: 500,
      name: 'Test1',
      dataSize: 0,
      parameters: [],
      rawData: new Uint8Array(),
    };

    const preset2: Preset = {
      effectId: 500,
      name: 'Test2',
      dataSize: 0,
      parameters: [],
      rawData: new Uint8Array(),
    };

    const comparison: PresetComparison = {
      preset1,
      preset2,
      sameName: false,
      sameEffect: true,
      differentParameters: [],
      sameParameters: [],
    };

    printComparison(
      { file1: 'test1.hx1p', file2: 'test2.hx1p' },
      { preset1, preset2 },
      comparison
    );

    const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
    const hasDifferentNames = calls.some((call) => call.includes('Different names'));
    expect(hasDifferentNames).toBe(true);
  });

  it('should indicate same effect', () => {
    const preset1: Preset = {
      effectId: 500,
      name: 'Test',
      dataSize: 0,
      parameters: [],
      rawData: new Uint8Array(),
    };

    const preset2: Preset = {
      effectId: 500,
      name: 'Test',
      dataSize: 0,
      parameters: [],
      rawData: new Uint8Array(),
    };

    const comparison: PresetComparison = {
      preset1,
      preset2,
      sameName: true,
      sameEffect: true,
      differentParameters: [],
      sameParameters: [],
    };

    printComparison(
      { file1: 'test1.hx1p', file2: 'test2.hx1p' },
      { preset1, preset2 },
      comparison
    );

    const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
    const hasSameEffect = calls.some((call) => call.includes('Same effect'));
    expect(hasSameEffect).toBe(true);
  });

  it('should indicate different effects', () => {
    const preset1: Preset = {
      effectId: 500,
      name: 'Test',
      dataSize: 0,
      parameters: [],
      rawData: new Uint8Array(),
    };

    const preset2: Preset = {
      effectId: 600,
      name: 'Test',
      dataSize: 0,
      parameters: [],
      rawData: new Uint8Array(),
    };

    const comparison: PresetComparison = {
      preset1,
      preset2,
      sameName: true,
      sameEffect: false,
      differentParameters: [],
      sameParameters: [],
    };

    printComparison(
      { file1: 'test1.hx1p', file2: 'test2.hx1p' },
      { preset1, preset2 },
      comparison
    );

    const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
    const hasDifferentEffects = calls.some((call) => call.includes('Different effects'));
    expect(hasDifferentEffects).toBe(true);
  });

  it('should print different parameters section when there are differences', () => {
    const preset1: Preset = {
      effectId: 500,
      name: 'Test',
      dataSize: 8,
      parameters: [
        { type: ParameterType.Float, value: 0.5 },
      ],
      rawData: new Uint8Array(),
    };

    const preset2: Preset = {
      effectId: 500,
      name: 'Test',
      dataSize: 8,
      parameters: [
        { type: ParameterType.Float, value: 0.75 },
      ],
      rawData: new Uint8Array(),
    };

    const comparison: PresetComparison = {
      preset1,
      preset2,
      sameName: true,
      sameEffect: true,
      differentParameters: [0],
      sameParameters: [],
    };

    printComparison(
      { file1: 'test1.hx1p', file2: 'test2.hx1p' },
      { preset1, preset2 },
      comparison
    );

    const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
    const hasDifferentParams = calls.some((call) => call.includes('Different Parameters'));
    expect(hasDifferentParams).toBe(true);
  });

  it('should print identical message when no differences', () => {
    const preset1: Preset = {
      effectId: 500,
      name: 'Test',
      dataSize: 0,
      parameters: [],
      rawData: new Uint8Array(),
    };

    const preset2: Preset = {
      effectId: 500,
      name: 'Test',
      dataSize: 0,
      parameters: [],
      rawData: new Uint8Array(),
    };

    const comparison: PresetComparison = {
      preset1,
      preset2,
      sameName: true,
      sameEffect: true,
      differentParameters: [],
      sameParameters: [],
    };

    printComparison(
      { file1: 'test1.hx1p', file2: 'test2.hx1p' },
      { preset1, preset2 },
      comparison
    );

    const calls = consoleLogSpy.mock.calls.map((call) => call.join(' '));
    const hasIdentical = calls.some((call) => call.includes('identical'));
    expect(hasIdentical).toBe(true);
  });
});
