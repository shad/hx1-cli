/**
 * Type definitions for MIDI communication
 */

/** MIDI message types */
export type MidiMessage =
  | ProgramChangeMessage
  | ControlChangeMessage
  | SysExMessage
  | NoteOnMessage
  | NoteOffMessage;

/** Program Change message */
export interface ProgramChangeMessage {
  type: 'program_change';
  program: number;
  channel: number;
}

/** Control Change message */
export interface ControlChangeMessage {
  type: 'control_change';
  controller: number;
  value: number;
  channel: number;
}

/** System Exclusive message */
export interface SysExMessage {
  type: 'sysex';
  data: number[];
}

/** Note On message */
export interface NoteOnMessage {
  type: 'note_on';
  note: number;
  velocity: number;
  channel: number;
}

/** Note Off message */
export interface NoteOffMessage {
  type: 'note_off';
  note: number;
  velocity: number;
  channel: number;
}

/** HX One device information */
export interface DeviceInfo {
  /** Device name */
  name: string;
  /** Manufacturer ID (Line 6: 00 01 0C) */
  manufacturerId: number[];
  /** Device family ID (HX One: 0x25) */
  deviceFamily: number;
  /** Firmware version string */
  firmware: string;
  /** MIDI channel */
  midiChannel: number;
}

/** Current device state */
export interface DeviceState {
  /** Current preset number (0-127) */
  preset: number;
  /** Preset name (if known) */
  presetName?: string;
  /** Effect is ON */
  effectOn: boolean;
}

/** MIDI CC numbers for HX One */
export const MIDI_CC = {
  /** ON footswitch */
  ON_SWITCH: 1,
  /** FLUX function */
  FLUX: 2,
  /** Expression pedal */
  EXPRESSION: 3,
  /** Preset navigation: 0=prev, 64=next */
  PRESET_NAV: 72,
} as const;

/** Line 6 manufacturer ID */
export const LINE6_MANUFACTURER_ID = [0x00, 0x01, 0x0c];

/** HX One device family ID */
export const HX_ONE_DEVICE_FAMILY = 0x25;

/** Preset navigation values for CC#72 */
export const PRESET_NAV_VALUES = {
  PREVIOUS: 0,
  NEXT: 64,
} as const;

/** Error thrown when MIDI device is not found */
export class DeviceNotFoundError extends Error {
  constructor(deviceName: string) {
    super(`MIDI device not found: ${deviceName}`);
    this.name = 'DeviceNotFoundError';
  }
}

/** Error thrown when MIDI communication fails */
export class MidiCommunicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MidiCommunicationError';
  }
}

/** Error thrown when preset number is invalid */
export class InvalidPresetNumberError extends Error {
  constructor(preset: number) {
    super(`Invalid preset number: ${preset} (must be 0-127)`);
    this.name = 'InvalidPresetNumberError';
  }
}
