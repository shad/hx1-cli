/**
 * Unit tests for preset comparator
 */

import { describe, it, expect } from 'vitest';
import { comparePresets, getComparisonSummary } from '../../../src/core/preset/comparator';
import type { Preset } from '../../../src/types/preset';
import { ParameterType } from '../../../src/types/preset';

describe('comparePresets', () => {
  const createTestPreset = (
    effectId: number,
    name: string,
    parameterValues: number[]
  ): Preset => ({
    effectId,
    name,
    dataSize: 620,
    parameters: parameterValues.map((value, index) => ({
      type: ParameterType.Float,
      value,
      offset: 0x18 + index * 8,
    })),
    raw: new Uint8Array(1440),
  });

  it('should identify identical presets', () => {
    const preset1 = createTestPreset(500, 'Test', [0.5, 0.6, 0.7]);
    const preset2 = createTestPreset(500, 'Test', [0.5, 0.6, 0.7]);

    const comparison = comparePresets(preset1, preset2);

    expect(comparison.sameEffect).toBe(true);
    expect(comparison.sameName).toBe(true);
    expect(comparison.differentParameters).toHaveLength(0);
    expect(comparison.sameParameters).toHaveLength(3);
  });

  it('should identify different effect IDs', () => {
    const preset1 = createTestPreset(500, 'Test', [0.5]);
    const preset2 = createTestPreset(501, 'Test', [0.5]);

    const comparison = comparePresets(preset1, preset2);

    expect(comparison.sameEffect).toBe(false);
    expect(comparison.sameName).toBe(true);
  });

  it('should identify different names', () => {
    const preset1 = createTestPreset(500, 'Test1', [0.5]);
    const preset2 = createTestPreset(500, 'Test2', [0.5]);

    const comparison = comparePresets(preset1, preset2);

    expect(comparison.sameEffect).toBe(true);
    expect(comparison.sameName).toBe(false);
  });

  it('should identify different parameter values', () => {
    const preset1 = createTestPreset(500, 'Test', [0.5, 0.6, 0.7]);
    const preset2 = createTestPreset(500, 'Test', [0.5, 0.8, 0.7]);

    const comparison = comparePresets(preset1, preset2);

    expect(comparison.differentParameters).toEqual([1]);
    expect(comparison.sameParameters).toEqual([0, 2]);
  });

  it('should identify multiple different parameters', () => {
    const preset1 = createTestPreset(500, 'Test', [0.1, 0.2, 0.3, 0.4]);
    const preset2 = createTestPreset(500, 'Test', [0.5, 0.2, 0.6, 0.4]);

    const comparison = comparePresets(preset1, preset2);

    expect(comparison.differentParameters).toEqual([0, 2]);
    expect(comparison.sameParameters).toEqual([1, 3]);
  });

  it('should handle presets with different parameter counts', () => {
    const preset1 = createTestPreset(500, 'Test', [0.5, 0.6]);
    const preset2 = createTestPreset(500, 'Test', [0.5, 0.6, 0.7]);

    const comparison = comparePresets(preset1, preset2);

    expect(comparison.differentParameters).toContain(2);
    expect(comparison.sameParameters).toEqual([0, 1]);
  });

  it('should use epsilon comparison for floats', () => {
    const preset1 = createTestPreset(500, 'Test', [0.5000001]);
    const preset2 = createTestPreset(500, 'Test', [0.5000002]);

    const comparison = comparePresets(preset1, preset2);

    // These should be considered equal due to epsilon comparison
    expect(comparison.sameParameters).toContain(0);
  });

  it('should detect significant float differences', () => {
    const preset1 = createTestPreset(500, 'Test', [0.5]);
    const preset2 = createTestPreset(500, 'Test', [0.6]);

    const comparison = comparePresets(preset1, preset2);

    expect(comparison.differentParameters).toContain(0);
  });

  it('should compare different parameter types', () => {
    const preset1: Preset = {
      effectId: 500,
      name: 'Test',
      dataSize: 620,
      parameters: [
        { type: ParameterType.Float, value: 0.5, offset: 0x18 },
        { type: ParameterType.Integer, value: 1, offset: 0x20 },
      ],
      raw: new Uint8Array(1440),
    };

    const preset2: Preset = {
      effectId: 500,
      name: 'Test',
      dataSize: 620,
      parameters: [
        { type: ParameterType.Integer, value: 0, offset: 0x18 }, // Different type
        { type: ParameterType.Integer, value: 1, offset: 0x20 },
      ],
      raw: new Uint8Array(1440),
    };

    const comparison = comparePresets(preset1, preset2);

    expect(comparison.differentParameters).toContain(0);
    expect(comparison.sameParameters).toContain(1);
  });

  it('should handle empty parameter lists', () => {
    const preset1 = createTestPreset(500, 'Test', []);
    const preset2 = createTestPreset(500, 'Test', []);

    const comparison = comparePresets(preset1, preset2);

    expect(comparison.differentParameters).toHaveLength(0);
    expect(comparison.sameParameters).toHaveLength(0);
  });

  it('should return references to original presets', () => {
    const preset1 = createTestPreset(500, 'Test1', [0.5]);
    const preset2 = createTestPreset(500, 'Test2', [0.5]);

    const comparison = comparePresets(preset1, preset2);

    expect(comparison.preset1).toBe(preset1);
    expect(comparison.preset2).toBe(preset2);
  });
});

describe('getComparisonSummary', () => {
  const createTestPreset = (
    effectId: number,
    name: string,
    parameterValues: number[]
  ): Preset => ({
    effectId,
    name,
    dataSize: 620,
    parameters: parameterValues.map((value, index) => ({
      type: ParameterType.Float,
      value,
      offset: 0x18 + index * 8,
    })),
    raw: new Uint8Array(1440),
  });

  it('should count total parameters correctly', () => {
    const preset1 = createTestPreset(500, 'Test', [0.1, 0.2, 0.3]);
    const preset2 = createTestPreset(500, 'Test', [0.1, 0.2, 0.3]);

    const comparison = comparePresets(preset1, preset2);
    const summary = getComparisonSummary(comparison);

    expect(summary.totalParameters).toBe(3);
  });

  it('should count changed parameters', () => {
    const preset1 = createTestPreset(500, 'Test', [0.1, 0.2, 0.3]);
    const preset2 = createTestPreset(500, 'Test', [0.1, 0.5, 0.3]);

    const comparison = comparePresets(preset1, preset2);
    const summary = getComparisonSummary(comparison);

    expect(summary.changedParameters).toBe(1);
    expect(summary.unchangedParameters).toBe(2);
  });

  it('should detect effect changes', () => {
    const preset1 = createTestPreset(500, 'Test', [0.5]);
    const preset2 = createTestPreset(501, 'Test', [0.5]);

    const comparison = comparePresets(preset1, preset2);
    const summary = getComparisonSummary(comparison);

    expect(summary.effectChanged).toBe(true);
  });

  it('should detect name changes', () => {
    const preset1 = createTestPreset(500, 'Test1', [0.5]);
    const preset2 = createTestPreset(500, 'Test2', [0.5]);

    const comparison = comparePresets(preset1, preset2);
    const summary = getComparisonSummary(comparison);

    expect(summary.nameChanged).toBe(true);
  });

  it('should handle no changes', () => {
    const preset1 = createTestPreset(500, 'Test', [0.5]);
    const preset2 = createTestPreset(500, 'Test', [0.5]);

    const comparison = comparePresets(preset1, preset2);
    const summary = getComparisonSummary(comparison);

    expect(summary.effectChanged).toBe(false);
    expect(summary.nameChanged).toBe(false);
    expect(summary.changedParameters).toBe(0);
    expect(summary.unchangedParameters).toBe(1);
  });

  it('should handle all parameters changed', () => {
    const preset1 = createTestPreset(500, 'Test', [0.1, 0.2, 0.3]);
    const preset2 = createTestPreset(500, 'Test', [0.4, 0.5, 0.6]);

    const comparison = comparePresets(preset1, preset2);
    const summary = getComparisonSummary(comparison);

    expect(summary.changedParameters).toBe(3);
    expect(summary.unchangedParameters).toBe(0);
  });

  it('should use max parameter count for total', () => {
    const preset1 = createTestPreset(500, 'Test', [0.1, 0.2]);
    const preset2 = createTestPreset(500, 'Test', [0.1, 0.2, 0.3, 0.4]);

    const comparison = comparePresets(preset1, preset2);
    const summary = getComparisonSummary(comparison);

    expect(summary.totalParameters).toBe(4);
  });
});
