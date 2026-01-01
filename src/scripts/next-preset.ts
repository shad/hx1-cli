#!/usr/bin/env bun

/**
 * Load next preset on HX One via MIDI CC#72
 * CC#72 value 64 = Next preset
 * CC#72 value 0 = Previous preset
 */

import easymidi from 'easymidi';

try {
  console.log('🎹 Loading next preset on HX One...');

  const output = new easymidi.Output('HX One');

  // Send CC#72 with value 64 for NEXT preset
  output.send('cc', {
    controller: 72,
    value: 64,
    channel: 0
  });

  console.log('✅ Sent MIDI CC#72 (value 64) - Next Preset');

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
