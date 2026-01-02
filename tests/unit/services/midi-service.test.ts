/**
 * Unit tests for MIDI Service
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Use vi.hoisted to create mocks that can be used in vi.mock factory
const { mockInputInstance, mockOutputInstance, mockInput, mockOutput, mockGetInputs } = vi.hoisted(() => {
  const mockInputInstance = {
    on: vi.fn(),
    removeListener: vi.fn(),
    close: vi.fn(),
  };

  const mockOutputInstance = {
    send: vi.fn(),
    close: vi.fn(),
  };

  const mockInput = vi.fn(() => mockInputInstance);
  const mockOutput = vi.fn(() => mockOutputInstance);
  const mockGetInputs = vi.fn(() => ['HX One', 'Other Device']);

  return { mockInputInstance, mockOutputInstance, mockInput, mockOutput, mockGetInputs };
});

vi.mock('easymidi', () => {
  return {
    default: {
      Input: mockInput,
      Output: mockOutput,
      getInputs: mockGetInputs,
    },
  };
});

// NOW import the service after the mock is set up
import { MidiService } from '../../../src/services/midi-service';
import {
  DeviceNotFoundError,
  MidiCommunicationError,
  InvalidPresetNumberError,
  MIDI_CC,
  PRESET_NAV_VALUES,
} from '../../../src/types/midi';

describe('MidiService', () => {
  let service: MidiService;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Get fresh instances
    service = new MidiService('HX One');
  });

  afterEach(() => {
    if (service.isConnected()) {
      service.disconnect();
    }
  });

  describe('constructor', () => {
    it('should create service with default device name', () => {
      const defaultService = new MidiService();
      expect(defaultService).toBeDefined();
    });

    it('should create service with custom device name', () => {
      const customService = new MidiService('Custom Device');
      expect(customService).toBeDefined();
    });
  });

  describe('connect', () => {
    it('should connect to MIDI device', () => {
      service.connect();

      expect(mockInput).toHaveBeenCalledWith('HX One');
      expect(mockOutput).toHaveBeenCalledWith('HX One');
      expect(service.isConnected()).toBe(true);
    });

    it('should throw DeviceNotFoundError if device not found', () => {
      // Make Input throw on next call
      mockInput.mockImplementationOnce(() => {
        throw new Error('Device not found');
      });

      try {
        service.connect();
        expect.fail('Should have thrown DeviceNotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(DeviceNotFoundError);
        expect((error as Error).message).toContain('HX One');
      }
    });
  });

  describe('disconnect', () => {
    it('should disconnect from MIDI device', () => {
      service.connect();

      service.disconnect();

      expect(mockInputInstance.close).toHaveBeenCalled();
      expect(mockOutputInstance.close).toHaveBeenCalled();
      expect(service.isConnected()).toBe(false);
    });

    it('should handle disconnect when not connected', () => {
      expect(() => service.disconnect()).not.toThrow();
    });
  });

  describe('loadPreset', () => {
    beforeEach(() => {
      service.connect();
    });

    it('should send program change message', () => {
      service.loadPreset(42);

      expect(mockOutputInstance.send).toHaveBeenCalledWith('program', {
        number: 42,
        channel: 0,
      });
    });

    it('should accept preset 0', () => {
      service.loadPreset(0);

      expect(mockOutputInstance.send).toHaveBeenCalledWith('program', {
        number: 0,
        channel: 0,
      });
    });

    it('should accept preset 127', () => {
      service.loadPreset(127);

      expect(mockOutputInstance.send).toHaveBeenCalledWith('program', {
        number: 127,
        channel: 0,
      });
    });

    it('should throw on negative preset number', () => {
      expect(() => service.loadPreset(-1)).toThrow(InvalidPresetNumberError);
    });

    it('should throw on preset number > 127', () => {
      expect(() => service.loadPreset(128)).toThrow(InvalidPresetNumberError);
    });

    it('should throw if not connected', () => {
      service.disconnect();

      expect(() => service.loadPreset(10)).toThrow(MidiCommunicationError);
    });
  });

  describe('nextPreset', () => {
    beforeEach(() => {
      service.connect();
    });

    it('should send CC#72 with value 64', () => {
      service.nextPreset();

      expect(mockOutputInstance.send).toHaveBeenCalledWith('cc', {
        controller: MIDI_CC.PRESET_NAV,
        value: PRESET_NAV_VALUES.NEXT,
        channel: 0,
      });
    });

    it('should throw if not connected', () => {
      service.disconnect();

      expect(() => service.nextPreset()).toThrow(MidiCommunicationError);
    });
  });

  describe('previousPreset', () => {
    beforeEach(() => {
      service.connect();
    });

    it('should send CC#72 with value 0', () => {
      service.previousPreset();

      expect(mockOutputInstance.send).toHaveBeenCalledWith('cc', {
        controller: MIDI_CC.PRESET_NAV,
        value: PRESET_NAV_VALUES.PREVIOUS,
        channel: 0,
      });
    });

    it('should throw if not connected', () => {
      service.disconnect();

      expect(() => service.previousPreset()).toThrow(MidiCommunicationError);
    });
  });

  describe('effectOn', () => {
    beforeEach(() => {
      service.connect();
    });

    it('should send CC#1 with value 127', () => {
      service.effectOn();

      expect(mockOutputInstance.send).toHaveBeenCalledWith('cc', {
        controller: MIDI_CC.ON_SWITCH,
        value: 127,
        channel: 0,
      });
    });

    it('should throw if not connected', () => {
      service.disconnect();

      expect(() => service.effectOn()).toThrow(MidiCommunicationError);
    });
  });

  describe('effectOff', () => {
    beforeEach(() => {
      service.connect();
    });

    it('should send CC#1 with value 0', () => {
      service.effectOff();

      expect(mockOutputInstance.send).toHaveBeenCalledWith('cc', {
        controller: MIDI_CC.ON_SWITCH,
        value: 0,
        channel: 0,
      });
    });

    it('should throw if not connected', () => {
      service.disconnect();

      expect(() => service.effectOff()).toThrow(MidiCommunicationError);
    });
  });

  describe('listDevices', () => {
    it('should return list of MIDI devices', () => {
      const devices = MidiService.listDevices();

      expect(devices).toContain('HX One');
      expect(devices).toContain('Other Device');
    });
  });

  describe('findHxOneDevice', () => {
    it('should find HX One device', () => {
      const deviceName = MidiService.findHxOneDevice();

      expect(deviceName).toBe('HX One');
    });

    it('should return null if HX One not found', () => {
      mockGetInputs.mockReturnValueOnce(['Other Device']);

      const deviceName = MidiService.findHxOneDevice();

      expect(deviceName).toBeNull();
    });
  });

  describe('isConnected', () => {
    it('should return false initially', () => {
      expect(service.isConnected()).toBe(false);
    });

    it('should return true after connect', () => {
      service.connect();

      expect(service.isConnected()).toBe(true);
    });

    it('should return false after disconnect', () => {
      service.connect();
      service.disconnect();

      expect(service.isConnected()).toBe(false);
    });
  });

  describe('multiple operations', () => {
    it('should handle sequence of preset changes', () => {
      service.connect();

      service.loadPreset(10);
      service.nextPreset();
      service.previousPreset();

      expect(mockOutputInstance.send).toHaveBeenCalledTimes(3);
    });

    it('should handle reconnection', () => {
      service.connect();
      service.disconnect();
      service.connect();

      expect(service.isConnected()).toBe(true);
      expect(mockInput).toHaveBeenCalledTimes(2);
      expect(mockOutput).toHaveBeenCalledTimes(2);
    });
  });

  describe('error messages', () => {
    it('should include device name in DeviceNotFoundError', () => {
      mockInput.mockImplementationOnce(() => {
        throw new Error('Device not found');
      });

      try {
        service.connect();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DeviceNotFoundError);
        expect((error as Error).message).toContain('HX One');
      }
    });

    it('should include preset number in InvalidPresetNumberError', () => {
      service.connect();

      try {
        service.loadPreset(200);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InvalidPresetNumberError);
        expect((error as Error).message).toContain('200');
      }
    });

    it('should provide helpful message when not connected', () => {
      try {
        service.loadPreset(10);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MidiCommunicationError);
        expect((error as Error).message).toContain('Not connected');
        expect((error as Error).message).toContain('connect()');
      }
    });
  });
});
