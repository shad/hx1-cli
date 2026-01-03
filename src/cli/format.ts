/**
 * CLI Output Formatting Utilities
 */

import chalk from 'chalk';
import { ParameterType, type Preset, type PresetComparison } from '../types/preset.js';
import { getComparisonSummary } from '../core/preset/comparator.js';

/**
 * Print different parameters in comparison
 */
export function printDifferentParameters(
  preset1: Preset,
  preset2: Preset,
  differentParams: number[]
): void {
  console.log(chalk.bold('Different Parameters:\n'));
  console.log(chalk.gray('  Idx  Type       Value 1        Value 2'));
  console.log(chalk.gray('  ───  ─────────  ─────────────  ─────────────'));

  for (const idx of differentParams) {
    const param1 = preset1.parameters[idx];
    const param2 = preset2.parameters[idx];

    const idxStr = idx.toString().padStart(3);
    const type1 = param1 ? ParameterType[param1.type] : 'Missing';
    const type2 = param2 ? ParameterType[param2.type] : 'Missing';
    const typeName = (param1 ? type1 : type2).padEnd(9);

    const val1 = param1
      ? (param1.type === ParameterType.Float ? param1.value.toFixed(6) : param1.value.toString()).padEnd(13)
      : 'N/A'.padEnd(13);

    const val2 = param2
      ? (param2.type === ParameterType.Float ? param2.value.toFixed(6) : param2.value.toString())
      : 'N/A';

    console.log(`  ${idxStr}  ${typeName}  ${chalk.yellow(val1)}  ${chalk.yellow(val2)}`);
  }
  console.log('');
}

/**
 * Print comparison results
 */
export function printComparison(
  files: { file1: string; file2: string },
  presets: { preset1: Preset; preset2: Preset },
  comparison: PresetComparison
): void {
  const summary = getComparisonSummary(comparison);
  const { file1, file2 } = files;
  const { preset1, preset2 } = presets;

  console.log(chalk.bold('\nPreset Comparison:\n'));
  console.log('  File 1:', chalk.cyan(file1));
  console.log('  File 2:', chalk.cyan(file2));
  console.log('');

  console.log('  Name 1:', preset1.name);
  console.log('  Name 2:', preset2.name);
  console.log('         ', comparison.sameName ? chalk.green('✓ Same name') : chalk.yellow('✗ Different names'));
  console.log('');

  console.log('  Effect 1:', preset1.effectId, chalk.gray(`(0x${preset1.effectId.toString(16).toUpperCase()})`));
  console.log('  Effect 2:', preset2.effectId, chalk.gray(`(0x${preset2.effectId.toString(16).toUpperCase()})`));
  console.log('           ', comparison.sameEffect ? chalk.green('✓ Same effect') : chalk.red('✗ Different effects'));
  console.log('');

  console.log(chalk.bold('Parameter Summary:\n'));
  console.log('  Total:      ', summary.totalParameters);
  console.log('  Same:       ', chalk.green(summary.unchangedParameters));
  console.log('  Different:  ', summary.changedParameters > 0 ? chalk.yellow(summary.changedParameters) : summary.changedParameters);
  console.log('');

  if (comparison.differentParameters.length > 0) {
    printDifferentParameters(preset1, preset2, comparison.differentParameters);
  } else {
    console.log(chalk.green('✓ All parameters are identical\n'));
  }
}
