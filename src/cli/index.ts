#!/usr/bin/env bun

/**
 * HX One CLI - Main entry point
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { MidiService } from '../services/midi-service.js';
import {
  DeviceNotFoundError,
  MidiCommunicationError,
  InvalidPresetNumberError,
} from '../types/midi.js';

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
 * hx1 on - Turn effect ON
 */
program
  .command('on')
  .description('Turn the effect ON')
  .action(async () => {
    const midi = new MidiService();

    try {
      const deviceName = MidiService.findHxOneDevice();
      if (!deviceName) {
        console.error(chalk.red('✗'), 'HX One not found');
        process.exit(2);
      }

      midi.connect();
      midi.effectOn();
      console.log(chalk.green('✓'), 'Effect ON');
      midi.disconnect();
      process.exit(0);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * hx1 off - Turn effect OFF
 */
program
  .command('off')
  .description('Turn the effect OFF')
  .action(async () => {
    const midi = new MidiService();

    try {
      const deviceName = MidiService.findHxOneDevice();
      if (!deviceName) {
        console.error(chalk.red('✗'), 'HX One not found');
        process.exit(2);
      }

      midi.connect();
      midi.effectOff();
      console.log(chalk.green('✓'), 'Effect OFF');
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
