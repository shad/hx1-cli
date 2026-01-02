/**
 * Type definitions for configuration
 */

/** User configuration */
export interface Config {
  /** Directory paths */
  directories: DirectoryConfig;
  /** MIDI settings */
  midi: MidiConfig;
  /** Behavior settings */
  behavior: BehaviorConfig;
  /** Output settings */
  output: OutputConfig;
}

/** Directory configuration */
export interface DirectoryConfig {
  /** Local preset directory */
  presets: string;
  /** Backup directory */
  backups: string;
}

/** MIDI configuration */
export interface MidiConfig {
  /** MIDI channel (1-16) */
  channel: number;
  /** MIDI device name ('auto' for auto-detect) */
  device: string;
}

/** Behavior configuration */
export interface BehaviorConfig {
  /** Confirm before overwriting files */
  confirmOverwrites: boolean;
  /** Auto-backup before operations */
  autoBackup: boolean;
}

/** Output configuration */
export interface OutputConfig {
  /** Enable colored output */
  color: boolean;
  /** Output format ('human' or 'json') */
  format: 'human' | 'json';
}

/** Default configuration */
export const DEFAULT_CONFIG: Config = {
  directories: {
    presets: './presets/',
    backups: './backups/',
  },
  midi: {
    channel: 1,
    device: 'auto',
  },
  behavior: {
    confirmOverwrites: true,
    autoBackup: false,
  },
  output: {
    color: true,
    format: 'human',
  },
};

/** Configuration file name */
export const CONFIG_FILE_NAME = '.hx1config';
