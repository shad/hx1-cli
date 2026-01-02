/**
 * Preset comparison functions
 */

import type { Preset, PresetComparison } from '../../types/preset.js';

/**
 * Compare two presets and return differences
 * @param preset1 - First preset
 * @param preset2 - Second preset
 * @returns Comparison result
 */
export function comparePresets(
  preset1: Preset,
  preset2: Preset
): PresetComparison {
  const sameEffect = preset1.effectId === preset2.effectId;
  const sameName = preset1.name === preset2.name;

  const differentParameters: number[] = [];
  const sameParameters: number[] = [];

  // Compare parameters
  const maxParams = Math.max(
    preset1.parameters.length,
    preset2.parameters.length
  );

  for (let i = 0; i < maxParams; i++) {
    const param1 = preset1.parameters[i];
    const param2 = preset2.parameters[i];

    // If one preset has fewer parameters
    if (param1 === undefined || param2 === undefined) {
      differentParameters.push(i);
      continue;
    }

    // Compare type and value
    if (param1.type !== param2.type || !valuesEqual(param1.value, param2.value)) {
      differentParameters.push(i);
    } else {
      sameParameters.push(i);
    }
  }

  return {
    preset1,
    preset2,
    sameEffect,
    sameName,
    differentParameters,
    sameParameters,
  };
}

/**
 * Check if two parameter values are equal (with tolerance for floats)
 * @param value1 - First value
 * @param value2 - Second value
 * @returns True if values are equal
 */
function valuesEqual(value1: number, value2: number): boolean {
  // For floats, use epsilon comparison
  const epsilon = 0.000001;
  return Math.abs(value1 - value2) < epsilon;
}

/**
 * Get human-readable summary of preset comparison
 * @param comparison - Comparison result
 * @returns Summary object
 */
export function getComparisonSummary(comparison: PresetComparison): {
  totalParameters: number;
  changedParameters: number;
  unchangedParameters: number;
  effectChanged: boolean;
  nameChanged: boolean;
} {
  return {
    totalParameters: Math.max(
      comparison.preset1.parameters.length,
      comparison.preset2.parameters.length
    ),
    changedParameters: comparison.differentParameters.length,
    unchangedParameters: comparison.sameParameters.length,
    effectChanged: !comparison.sameEffect,
    nameChanged: !comparison.sameName,
  };
}
