#!/usr/bin/env python3
"""
Scan for MIDI devices including HX One

Requires: pip3 install mido python-rtmidi
"""

try:
    import mido

    print("🎹 MIDI Devices Found:\n")

    print("Input ports:")
    for port in mido.get_input_names():
        print(f"  📥 {port}")

    print("\nOutput ports:")
    for port in mido.get_output_names():
        print(f"  📤 {port}")

    # Check for HX One
    hx_ports = [p for p in mido.get_input_names() + mido.get_output_names()
                if 'HX' in p or 'Line' in p or 'line' in p]

    if hx_ports:
        print(f"\n✅ Found HX One or Line 6 device:")
        for port in hx_ports:
            print(f"   {port}")
        print("\n💡 Direct MIDI communication is possible!")
    else:
        print("\n⚠️  No HX One MIDI ports found")
        print("   The device might need to be in a specific mode")
        print("   or use vendor-specific USB communication")

except ImportError:
    print("❌ mido library not installed")
    print("\nTo install:")
    print("  pip3 install mido python-rtmidi")
    print("\nOr use: brew install python@3 && pip3 install mido python-rtmidi")
