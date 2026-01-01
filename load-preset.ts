#!/usr/bin/env bun

/**
 * Load a specific preset on HX One via MIDI
 * Usage: bun run load-preset.ts <preset_number>
 */

import easymidi from 'easymidi';

const presetNum = parseInt(process.argv[2] || '0');

if (isNaN(presetNum) || presetNum < 0 || presetNum > 127) {
  console.error('❌ Error: Preset number must be between 0 and 127');
  console.log('Usage: bun run load-preset.ts <preset_number>');
  process.exit(1);
}

try {
  console.log(`🎹 Loading preset ${presetNum.toString().padStart(3, '0')} on HX One...`);

  const output = new easymidi.Output('HX One');

  // Send Program Change message
  output.send('program', { number: presetNum, channel: 0 });

  console.log(`✅ Sent MIDI Program Change: PC ${presetNum}`);

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
