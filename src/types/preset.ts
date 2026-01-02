/**
 * Type definitions for HX One preset files
 */

/** Preset file size in bytes (fixed) */
export const PRESET_FILE_SIZE = 1440;

/** Preset name maximum length */
export const PRESET_NAME_MAX_LENGTH = 32;

/** Preset name offset in file */
export const PRESET_NAME_OFFSET = 0x584;

/** Effect ID offset in file */
export const EFFECT_ID_OFFSET = 0x10;

/** Data size offset in file */
export const DATA_SIZE_OFFSET = 0x14;

/** First parameter offset in file */
export const FIRST_PARAM_OFFSET = 0x18;

/** Parameter types */
export enum ParameterType {
  Flag = 0,
  BoolOrIndex = 1,
  Integer = 2,
  Float = 3,
}

/** Single parameter in a preset */
export interface Parameter {
  /** Parameter type */
  type: ParameterType;
  /** Parameter value (interpretation depends on type) */
  value: number;
  /** Byte offset in file */
  offset: number;
}

/** Parsed preset file */
export interface Preset {
  /** Effect model ID */
  effectId: number;
  /** Preset name */
  name: string;
  /** Data size in bytes */
  dataSize: number;
  /** Array of parameters */
  parameters: Parameter[];
  /** Raw file data */
  raw: Uint8Array;
}

/** Preset builder for creating new presets */
export interface PresetBuilder {
  /** Effect ID */
  effectId: number;
  /** Preset name */
  name: string;
  /** Parameters */
  parameters: Array<{
    type: ParameterType;
    value: number;
  }>;
}

/** Result of comparing two presets */
export interface PresetComparison {
  /** First preset */
  preset1: Preset;
  /** Second preset */
  preset2: Preset;
  /** Whether effect IDs match */
  sameEffect: boolean;
  /** Whether names match */
  sameName: boolean;
  /** Indices of parameters that differ */
  differentParameters: number[];
  /** Indices of parameters that match */
  sameParameters: number[];
}

/** Error thrown when preset file is invalid */
export class InvalidPresetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPresetError';
  }
}
