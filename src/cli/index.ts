#!/usr/bin/env bun

/**
 * HX One CLI - Main entry point
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { MidiService } from '../services/midi-service.js';
import {
  DeviceNotFoundError,
  MidiCommunicationError,
  InvalidPresetNumberError,
} from '../types/midi.js';
import { parsePreset } from '../core/preset/parser.js';
import { comparePresets, getComparisonSummary } from '../core/preset/comparator.js';
import { InvalidPresetError, ParameterType } from '../types/preset.js';

const program = new Command();

program
  .name('hx1')
  .description('Professional CLI tool for Line 6 HX One guitar effects pedal')
  .version('1.0.0');

/**
 * hx1 next - Load next preset
 */
program
  .command('next')
  .description('Load the next preset')
  .action(async () => {
    const midi = new MidiService();

    try {
      // Auto-detect device if needed
      const deviceName = MidiService.findHxOneDevice();
      if (!deviceName) {
        console.error(chalk.red('✗'), 'HX One not found');
        console.log('\n💡 Make sure:');
        console.log('   • HX One is connected via USB');
        console.log('   • No other application has exclusive MIDI access');
        console.log('   • Try: hx1 status');
        process.exit(2);
      }

      midi.connect();
      midi.nextPreset();
      console.log(chalk.green('✓'), 'Next preset loaded');
      midi.disconnect();
      process.exit(0);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * hx1 prev - Load previous preset
 */
program
  .command('prev')
  .description('Load the previous preset')
  .action(async () => {
    const midi = new MidiService();

    try {
      const deviceName = MidiService.findHxOneDevice();
      if (!deviceName) {
        console.error(chalk.red('✗'), 'HX One not found');
        process.exit(2);
      }

      midi.connect();
      midi.previousPreset();
      console.log(chalk.green('✓'), 'Previous preset loaded');
      midi.disconnect();
      process.exit(0);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * hx1 load <preset> - Load specific preset
 */
program
  .command('load')
  .description('Load a specific preset by number')
  .argument('<preset>', 'Preset number (0-127)')
  .action(async (presetArg: string) => {
    const preset = parseInt(presetArg, 10);

    if (isNaN(preset)) {
      console.error(chalk.red('✗'), `Invalid preset number: ${presetArg}`);
      process.exit(1);
    }

    const midi = new MidiService();

    try {
      const deviceName = MidiService.findHxOneDevice();
      if (!deviceName) {
        console.error(chalk.red('✗'), 'HX One not found');
        process.exit(2);
      }

      midi.connect();
      midi.loadPreset(preset);
      console.log(
        chalk.green('✓'),
        `Loaded preset ${preset.toString().padStart(3, '0')}`
      );
      midi.disconnect();
      process.exit(0);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * hx1 toggle - Toggle effect on/off
 */
program
  .command('toggle')
  .description('Toggle the effect on/off (emulates footswitch press)')
  .action(async () => {
    const midi = new MidiService();

    try {
      const deviceName = MidiService.findHxOneDevice();
      if (!deviceName) {
        console.error(chalk.red('✗'), 'HX One not found');
        process.exit(2);
      }

      midi.connect();
      midi.toggleEffect();
      console.log(chalk.green('✓'), 'Effect toggled');
      midi.disconnect();
      process.exit(0);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * hx1 flux - Activate FLUX function
 */
program
  .command('flux')
  .description('Activate FLUX function (momentary effect variation)')
  .action(async () => {
    const midi = new MidiService();

    try {
      const deviceName = MidiService.findHxOneDevice();
      if (!deviceName) {
        console.error(chalk.red('✗'), 'HX One not found');
        process.exit(2);
      }

      midi.connect();
      midi.activateFlux();
      console.log(chalk.green('✓'), 'FLUX activated');
      midi.disconnect();
      process.exit(0);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * hx1 status - Show device status
 */
program
  .command('status')
  .description('Show current device and preset status')
  .option('-j, --json', 'Output JSON')
  .action(async (options: { json?: boolean }) => {
    const midi = new MidiService();

    try {
      // Check for device
      const deviceName = MidiService.findHxOneDevice();

      if (!deviceName) {
        if (options.json) {
          console.log(JSON.stringify({ connected: false }, null, 2));
        } else {
          console.error(chalk.red('✗'), 'HX One not found');
          console.log('\n💡 Make sure:');
          console.log('   • HX One is connected via USB');
          console.log('   • Device is powered on');
          console.log('   • USB cable is working');
        }
        process.exit(2);
      }

      // Connect
      midi.connect();

      if (options.json) {
        console.log(
          JSON.stringify(
            {
              connected: true,
              device: {
                name: deviceName,
                connection: 'USB MIDI',
              },
            },
            null,
            2
          )
        );
      } else {
        console.log(chalk.bold('HX One Status:\n'));
        console.log('  Device:       ', deviceName);
        console.log('  Connection:   ', chalk.green('USB MIDI'));
        console.log('  MIDI Channel: ', 1);
        console.log('\n' + chalk.green('✓'), 'Device connected and ready');
      }

      midi.disconnect();
      process.exit(0);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * hx1 info <file> - Display preset file information
 */
program
  .command('info <file>')
  .description('Display preset file information')
  .action((file: string) => {
    try {
      const filePath = resolve(file);
      const data = new Uint8Array(readFileSync(filePath));
      const preset = parsePreset(data);

      console.log(chalk.bold('\nPreset Information:\n'));
      console.log('  File:       ', chalk.cyan(file));
      console.log('  Name:       ', chalk.green(preset.name));
      console.log('  Effect ID:  ', preset.effectId, chalk.gray(`(0x${preset.effectId.toString(16).toUpperCase()})`));
      console.log('  Data Size:  ', preset.dataSize, 'bytes');
      console.log('  Parameters: ', preset.parameters.length);

      // Show parameter details
      console.log(chalk.bold('\nParameters:\n'));
      console.log(chalk.gray('  Idx  Type       Value'));
      console.log(chalk.gray('  ───  ─────────  ──────────────'));

      for (let i = 0; i < preset.parameters.length; i++) {
        const param = preset.parameters[i];
        if (!param) continue;

        const idx = i.toString().padStart(3);
        const typeName = ParameterType[param.type].padEnd(9);
        const value = param.type === ParameterType.Float
          ? param.value.toFixed(6)
          : param.value.toString();

        console.log(`  ${idx}  ${typeName}  ${value}`);
      }

      console.log('');
      process.exit(0);
    } catch (error) {
      if (error instanceof InvalidPresetError) {
        console.error(chalk.red('✗'), 'Invalid preset file:', error.message);
        process.exit(6);
      }
      handleError(error);
    }
  });

/**
 * hx1 compare <file1> <file2> - Compare two preset files
 */
program
  .command('compare <file1> <file2>')
  .description('Compare two preset files')
  .action((file1: string, file2: string) => {
    try {
      const path1 = resolve(file1);
      const path2 = resolve(file2);

      const data1 = new Uint8Array(readFileSync(path1));
      const data2 = new Uint8Array(readFileSync(path2));

      const preset1 = parsePreset(data1);
      const preset2 = parsePreset(data2);

      const comparison = comparePresets(preset1, preset2);
      const summary = getComparisonSummary(comparison);

      console.log(chalk.bold('\nPreset Comparison:\n'));

      // File names
      console.log('  File 1:', chalk.cyan(file1));
      console.log('  File 2:', chalk.cyan(file2));
      console.log('');

      // Names
      console.log('  Name 1:', preset1.name);
      console.log('  Name 2:', preset2.name);
      if (comparison.sameName) {
        console.log('         ', chalk.green('✓ Same name'));
      } else {
        console.log('         ', chalk.yellow('✗ Different names'));
      }
      console.log('');

      // Effect IDs
      console.log('  Effect 1:', preset1.effectId, chalk.gray(`(0x${preset1.effectId.toString(16).toUpperCase()})`));
      console.log('  Effect 2:', preset2.effectId, chalk.gray(`(0x${preset2.effectId.toString(16).toUpperCase()})`));
      if (comparison.sameEffect) {
        console.log('           ', chalk.green('✓ Same effect'));
      } else {
        console.log('           ', chalk.red('✗ Different effects'));
      }
      console.log('');

      // Parameter summary
      console.log(chalk.bold('Parameter Summary:\n'));
      console.log('  Total:      ', summary.totalParameters);
      console.log('  Same:       ', chalk.green(summary.unchangedParameters));
      console.log('  Different:  ', summary.changedParameters > 0 ? chalk.yellow(summary.changedParameters) : summary.changedParameters);
      console.log('');

      // Show different parameters
      if (comparison.differentParameters.length > 0) {
        console.log(chalk.bold('Different Parameters:\n'));
        console.log(chalk.gray('  Idx  Type       Value 1        Value 2'));
        console.log(chalk.gray('  ───  ─────────  ─────────────  ─────────────'));

        for (const idx of comparison.differentParameters) {
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
      } else {
        console.log(chalk.green('✓ All parameters are identical\n'));
      }

      process.exit(0);
    } catch (error) {
      if (error instanceof InvalidPresetError) {
        console.error(chalk.red('✗'), 'Invalid preset file:', error.message);
        process.exit(6);
      }
      handleError(error);
    }
  });

/**
 * Handle errors and exit appropriately
 */
function handleError(error: unknown): never {
  if (error instanceof DeviceNotFoundError) {
    console.error(chalk.red('✗'), error.message);
    console.log('\n💡 Try: hx1 status');
    process.exit(2);
  } else if (error instanceof MidiCommunicationError) {
    console.error(chalk.red('✗'), error.message);
    process.exit(5);
  } else if (error instanceof InvalidPresetNumberError) {
    console.error(chalk.red('✗'), error.message);
    process.exit(4);
  } else if (error instanceof Error) {
    console.error(chalk.red('✗'), 'Error:', error.message);
    process.exit(1);
  } else {
    console.error(chalk.red('✗'), 'Unknown error');
    process.exit(1);
  }
}

// Parse arguments
program.parse();
