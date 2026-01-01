#!/usr/bin/env bun

/**
 * Load previous preset on HX One via MIDI CC#72
 * CC#72 value 0 = Previous preset
 * CC#72 value 64 = Next preset
 */

import easymidi from 'easymidi';

try {
  console.log('🎹 Loading previous preset on HX One...');

  const output = new easymidi.Output('HX One');

  // Send CC#72 with value 0 for PREVIOUS preset
  output.send('cc', {
    controller: 72,
    value: 0,
    channel: 0
  });

  console.log('✅ Sent MIDI CC#72 (value 0) - Previous Preset');

  // Close output
  output.close();

} catch (error: any) {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Make sure:');
  console.log('   • HX One is connected via USB');
  console.log('   • No other application has exclusive MIDI access');
  console.log('   • Run "bun run scan-midi.ts" to verify connection');
  process.exit(1);
}
