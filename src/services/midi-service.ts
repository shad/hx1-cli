/**
 * MIDI Service - handles all MIDI communication with HX One
 */

import easymidi from 'easymidi';
import {
  type DeviceInfo,
  type DeviceState,
  DeviceNotFoundError,
  MidiCommunicationError,
  InvalidPresetNumberError,
  MIDI_CC,
  PRESET_NAV_VALUES,
  LINE6_MANUFACTURER_ID,
  HX_ONE_DEVICE_FAMILY,
} from '../types/midi.js';

/**
 * MIDI Service for HX One communication
 */
export class MidiService {
  private input: easymidi.Input | null = null;
  private output: easymidi.Output | null = null;
  private readonly deviceName: string;

  constructor(deviceName: string = 'HX One') {
    this.deviceName = deviceName;
  }

  /**
   * Connect to the MIDI device
   * @throws DeviceNotFoundError if device not found
   */
  connect(): void {
    try {
      this.input = new easymidi.Input(this.deviceName);
      this.output = new easymidi.Output(this.deviceName);
    } catch (error) {
      throw new DeviceNotFoundError(this.deviceName);
    }
  }

  /**
   * Disconnect from the MIDI device
   */
  disconnect(): void {
    if (this.input) {
      this.input.close();
      this.input = null;
    }

    if (this.output) {
      this.output.close();
      this.output = null;
    }
  }

  /**
   * Check if connected to device
   * @returns True if connected
   */
  isConnected(): boolean {
    return this.input !== null && this.output !== null;
  }

  /**
   * Load a specific preset by number
   * @param preset - Preset number (0-127)
   * @throws InvalidPresetNumberError if preset out of range
   * @throws MidiCommunicationError if not connected
   */
  loadPreset(preset: number): void {
    this.validatePresetNumber(preset);
    this.ensureConnected();

    if (this.output === null) {
      throw new MidiCommunicationError('Not connected to device');
    }

    this.output.send('program', {
      number: preset,
      channel: 0,
    });
  }

  /**
   * Load next preset
   * @throws MidiCommunicationError if not connected
   */
  nextPreset(): void {
    this.ensureConnected();

    if (this.output === null) {
      throw new MidiCommunicationError('Not connected to device');
    }

    this.output.send('cc', {
      controller: MIDI_CC.PRESET_NAV,
      value: PRESET_NAV_VALUES.NEXT,
      channel: 0,
    });
  }

  /**
   * Load previous preset
   * @throws MidiCommunicationError if not connected
   */
  previousPreset(): void {
    this.ensureConnected();

    if (this.output === null) {
      throw new MidiCommunicationError('Not connected to device');
    }

    this.output.send('cc', {
      controller: MIDI_CC.PRESET_NAV,
      value: PRESET_NAV_VALUES.PREVIOUS,
      channel: 0,
    });
  }

  /**
   * Toggle effect on/off
   * Emulates pressing the ON footswitch - toggles between on and off states
   * @throws MidiCommunicationError if not connected
   */
  toggleEffect(): void {
    this.ensureConnected();

    if (this.output === null) {
      throw new MidiCommunicationError('Not connected to device');
    }

    // CC#1 toggles the effect (any value works, using 127 by convention)
    this.output.send('cc', {
      controller: MIDI_CC.ON_SWITCH,
      value: 127,
      channel: 0,
    });
  }

  /**
   * Activate FLUX function
   * Emulates pressing the FLUX footswitch (typically held for momentary effect)
   * @throws MidiCommunicationError if not connected
   */
  activateFlux(): void {
    this.ensureConnected();

    if (this.output === null) {
      throw new MidiCommunicationError('Not connected to device');
    }

    // CC#2 activates FLUX (using 127 by convention)
    this.output.send('cc', {
      controller: MIDI_CC.FLUX,
      value: 127,
      channel: 0,
    });
  }

  /**
   * Query device information
   * @returns Device info
   * @throws MidiCommunicationError if not connected or timeout
   */
  async queryDeviceInfo(): Promise<DeviceInfo> {
    this.ensureConnected();

    if (this.input === null || this.output === null) {
      throw new MidiCommunicationError('Not connected to device');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new MidiCommunicationError('Device query timeout'));
      }, 5000);

      // Listen for device identity response
      const handler = (msg: { bytes?: number[] }): void => {
        clearTimeout(timeout);

        if (this.input === null) {
          reject(new MidiCommunicationError('Disconnected during query'));
          return;
        }

        // Remove listener
        this.input.removeListener('sysex', handler);

        // Parse response
        const bytes = msg.bytes ?? [];

        // Check for Line 6 firmware version response
        if (bytes.length > 10 && bytes[5] === 0x05 && bytes[6] === 0x06) {
          // Parse firmware string
          const firmwareBytes = bytes.slice(8, -1);
          const firmwareText = String.fromCharCode(...firmwareBytes);
          const versionMatch = firmwareText.match(/L6ImageVersion:([^\0]+)/);
          const firmware = versionMatch ? versionMatch[1] : 'Unknown';

          resolve({
            name: this.deviceName,
            manufacturerId: LINE6_MANUFACTURER_ID,
            deviceFamily: HX_ONE_DEVICE_FAMILY,
            firmware,
            midiChannel: 1,
          });
        } else {
          reject(new MidiCommunicationError('Invalid device response'));
        }
      };

      this.input.on('sysex', handler);

      // Send device identity request
      this.output.send('sysex', [
        0xf0,
        0x7e,
        0x00,
        0x06,
        0x01,
        0xf7,
      ]);
    });
  }

  /**
   * Query current device state
   * @returns Current state (if available)
   * @throws MidiCommunicationError if not connected
   */
  async queryDeviceState(): Promise<DeviceState | null> {
    this.ensureConnected();

    if (this.input === null) {
      throw new MidiCommunicationError('Not connected to device');
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(null); // No state available
      }, 2000);

      // Listen for SysEx messages that contain preset info
      const handler = (msg: { bytes?: number[] }): void => {
        const bytes = msg.bytes ?? [];

        // Check if this is a state message (command 0x05, length 45)
        if (bytes.length === 45 && bytes[5] === 0x05) {
          clearTimeout(timeout);

          if (this.input === null) {
            resolve(null);
            return;
          }

          this.input.removeListener('sysex', handler);

          // Extract preset number from bytes[26]
          const preset = bytes[26] ?? 0;

          resolve({
            preset,
            effectOn: true, // We don't have ON/OFF state from MIDI yet
          });
        }
      };

      this.input.on('sysex', handler);
    });
  }

  /**
   * List all available MIDI devices
   * @returns Array of device names
   */
  static listDevices(): string[] {
    return easymidi.getInputs();
  }

  /**
   * Find HX One device
   * @returns Device name if found, null otherwise
   */
  static findHxOneDevice(): string | null {
    const devices = MidiService.listDevices();
    const hxOneDevice = devices.find((d) => d.includes('HX One'));
    return hxOneDevice ?? null;
  }

  /**
   * Validate preset number
   * @param preset - Preset number
   * @throws InvalidPresetNumberError if invalid
   */
  private validatePresetNumber(preset: number): void {
    if (preset < 0 || preset > 127) {
      throw new InvalidPresetNumberError(preset);
    }
  }

  /**
   * Ensure connected to device
   * @throws MidiCommunicationError if not connected
   */
  private ensureConnected(): void {
    if (!this.isConnected()) {
      throw new MidiCommunicationError(
        'Not connected to device. Call connect() first.'
      );
    }
  }
}
