#!/usr/bin/env python3
"""
Pigpio servo test
"""

import time
import sys

print("🔧 PIGPIO SERVO TEST")
print("=" * 30)

try:
    import pigpio
    print("✅ pigpio library available")
    
    # Connect to pigpio daemon
    pi = pigpio.pi()
    if not pi.connected:
        print("❌ Could not connect to pigpio daemon")
        print("Make sure 'sudo pigpiod' is running")
        sys.exit(1)
    
    print("✅ Connected to pigpio daemon")
    
    # Test servo pins
    test_pins = [2, 3, 4]
    
    for pin in test_pins:
        try:
            print(f"\n🎯 Testing servo on GPIO {pin}")
            print("👀 Watch the servo carefully for movement!")
            print("🔊 Listen for servo sounds!")
            
            # Servo pulse widths in microseconds
            # 1000µs = 0°, 1500µs = 90°, 2000µs = 180°
            pulse_widths = [1000, 1500, 2000, 1500, 1000]
            positions = ["0°", "90°", "180°", "90°", "0°"]
            
            print("\n🎬 Moving servo through positions:")
            
            for i, (pulse, pos) in enumerate(zip(pulse_widths, positions)):
                print(f"  {i+1}/5 → {pos} (pulse: {pulse}µs)")
                pi.set_servo_pulsewidth(pin, pulse)
                time.sleep(4)  # 4 seconds to observe movement
                print("      ⏸️  Pausing...")
            
            # Stop PWM
            pi.set_servo_pulsewidth(pin, 0)
            print(f"  ✅ pigpio PWM test completed on pin {pin}")
            
            # Ask user for feedback
            feedback = input(f"\n❓ Did the servo on GPIO {pin} move? (y/n): ").strip().lower()
            if feedback in ['y', 'yes']:
                print(f"🎉 SUCCESS! Servo on GPIO {pin} is working with pigpio!")
                
                # Save result
                with open('/tmp/servo_test_results.txt', 'w') as f:
                    f.write(f"Working PWM method: pigpio\n")
                    f.write(f"Working GPIO pin: {pin}\n")
                    f.write(f"Test completed: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
                
                pi.stop()
                print("📁 Results saved to /tmp/servo_test_results.txt")
                sys.exit(0)
            else:
                print(f"❌ No movement detected on GPIO {pin}")
                
        except Exception as e:
            print(f"  ❌ Error testing pin {pin}: {e}")
    
    pi.stop()
    print("\n❌ No servo movement detected on any pin.")
    print("Possible issues:")
    print("  - Servos not connected properly")
    print("  - Power supply issues")
    print("  - Wrong GPIO pins")
    
except ImportError:
    print("❌ pigpio library not available")
    print("Installation seems incomplete")
except Exception as e:
    print(f"❌ Error with pigpio: {e}")
    sys.exit(1)
