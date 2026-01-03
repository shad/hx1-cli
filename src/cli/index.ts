#!/usr/bin/env node

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
import { comparePresets } from '../core/preset/comparator.js';
import { InvalidPresetError, ParameterType } from '../types/preset.js';
import { printComparison } from './format.js';

const program = new Command();

program
  .name('hx1')
  .description('Professional CLI tool for Line 6 HX One guitar effects pedal')
  .version('1.0.0');

program
  .command('next')
  .description('Load the next preset')
  .action(() => {
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

program
  .command('prev')
  .description('Load the previous preset')
  .action(() => {
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

program
  .command('load')
  .description('Load a specific preset by number')
  .argument('<preset>', 'Preset number (0-127)')
  .action((presetArg: string) => {
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

program
  .command('toggle')
  .description('Toggle the effect on/off (emulates footswitch press)')
  .action(() => {
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

program
  .command('flux')
  .description('Activate FLUX function (momentary effect variation)')
  .action(() => {
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

program
  .command('status')
  .description('Show current device and preset status')
  .option('-j, --json', 'Output JSON')
  .action((options: { json?: boolean }) => {
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
        if (!param) {
          continue;
        }

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

      printComparison(
        { file1, file2 },
        { preset1, preset2 },
        comparison
      );

      process.exit(0);
    } catch (error) {
      if (error instanceof InvalidPresetError) {
        console.error(chalk.red('✗'), 'Invalid preset file:', error.message);
        process.exit(6);
      }
      handleError(error);
    }
  });

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
