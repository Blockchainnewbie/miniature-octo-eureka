#!/usr/bin/env python3
"""
Alternative GPIO-Servo Test
Versucht verschiedene Methoden für GPIO-Steuerung
"""

import time
import os
import sys
import subprocess

def test_gpio_export_method():
    """Test mit GPIO Export über /sys/class/gpio"""
    print("🔧 TESTING GPIO EXPORT METHOD")
    print("=" * 40)
    
    test_pins = [2, 3, 4, 17, 18, 27]  # Verschiedene GPIO-Pins
    
    for pin in test_pins:
        try:
            print(f"\n🎯 Testing GPIO {pin} export method...")
            
            # Export GPIO
            with open('/sys/class/gpio/export', 'w') as f:
                f.write(str(pin))
            
            gpio_path = f'/sys/class/gpio/gpio{pin}'
            
            # Wait for GPIO to be available
            time.sleep(0.1)
            
            if os.path.exists(gpio_path):
                print(f"  ✅ GPIO {pin} exported successfully")
                
                # Set direction to out
                with open(f'{gpio_path}/direction', 'w') as f:
                    f.write('out')
                
                print(f"  🎬 Simulating servo pulses on GPIO {pin}...")
                
                # Simulate servo pulses with software timing
                for i in range(10):  # 10 servo cycles
                    # High pulse (1-2ms)
                    with open(f'{gpio_path}/value', 'w') as f:
                        f.write('1')
                    time.sleep(0.0015)  # 1.5ms pulse (90 degrees)
                    
                    # Low for rest of 20ms period
                    with open(f'{gpio_path}/value', 'w') as f:
                        f.write('0')
                    time.sleep(0.0185)  # Rest of 20ms period
                
                print(f"  ✅ GPIO {pin} pulse test completed")
                
                # Cleanup
                with open('/sys/class/gpio/unexport', 'w') as f:
                    f.write(str(pin))
                
                # Ask for feedback
                response = input(f"❓ Did you see servo movement on GPIO {pin}? (y/n): ").strip().lower()
                if response in ['y', 'yes']:
                    print(f"🎉 SUCCESS! GPIO {pin} works with export method!")
                    return pin
                    
            else:
                print(f"  ❌ GPIO {pin} path not available")
                
        except Exception as e:
            print(f"  ❌ Error with GPIO {pin}: {e}")
            # Cleanup on error
            try:
                with open('/sys/class/gpio/unexport', 'w') as f:
                    f.write(str(pin))
            except:
                pass
    
    return None

def test_wiringpi_method():
    """Test mit WiringPi falls verfügbar"""
    print("\n🔧 TESTING WIRINGPI METHOD")
    print("=" * 35)
    
    try:
        # Check if gpio command is available
        result = subprocess.run(['which', 'gpio'], capture_output=True)
        if result.returncode != 0:
            print("❌ WiringPi 'gpio' command not available")
            return None
        
        print("✅ WiringPi 'gpio' command found")
        
        # Test with WiringPi pin numbering
        wiringpi_pins = [8, 9, 7]  # WiringPi pins for GPIO 2, 3, 4
        gpio_pins = [2, 3, 4]      # Corresponding GPIO pins
        
        for wpi_pin, gpio_pin in zip(wiringpi_pins, gpio_pins):
            try:
                print(f"\n🎯 Testing WiringPi pin {wpi_pin} (GPIO {gpio_pin})...")
                
                # Set pin mode to PWM output
                subprocess.run(['gpio', 'mode', str(wpi_pin), 'pwm'], check=True)
                
                # Set PWM range (for servo control)
                subprocess.run(['gpio', 'pwm-ms'], check=True)  # Mark-space mode
                subprocess.run(['gpio', 'pwmc', '192'], check=True)  # Clock divisor for 50Hz
                subprocess.run(['gpio', 'pwmr', '2000'], check=True)  # Range for 20ms period
                
                print(f"  🎬 Moving servo on WiringPi pin {wpi_pin}...")
                
                # Servo positions: 100=1ms(0°), 150=1.5ms(90°), 200=2ms(180°)
                positions = [100, 150, 200, 150, 100]
                angles = ["0°", "90°", "180°", "90°", "0°"]
                
                for pos, angle in zip(positions, angles):
                    print(f"    → {angle} (pwm: {pos})")
                    subprocess.run(['gpio', 'pwm', str(wpi_pin), str(pos)], check=True)
                    time.sleep(3)
                
                # Stop PWM
                subprocess.run(['gpio', 'pwm', str(wpi_pin), '0'], check=True)
                
                print(f"  ✅ WiringPi test completed on pin {wpi_pin}")
                
                # Ask for feedback
                response = input(f"❓ Did you see servo movement on GPIO {gpio_pin}? (y/n): ").strip().lower()
                if response in ['y', 'yes']:
                    print(f"🎉 SUCCESS! GPIO {gpio_pin} works with WiringPi!")
                    return gpio_pin
                    
            except subprocess.CalledProcessError as e:
                print(f"  ❌ WiringPi error on pin {wpi_pin}: {e}")
            except Exception as e:
                print(f"  ❌ Error with WiringPi pin {wpi_pin}: {e}")
        
    except Exception as e:
        print(f"❌ WiringPi test failed: {e}")
    
    return None

def main():
    print("🔧 ALTERNATIVE SERVO TEST FOR DEBIAN")
    print("=" * 50)
    print("This test tries alternative methods since pigpio failed.")
    print("Watch and listen for servo movement during each test.")
    print()
    
    # Check if running as root
    if os.geteuid() != 0:
        print("❗ Not running as root. Some tests may fail.")
        print("  Try running with: sudo python3 alternative_servo_test.py")
    else:
        print("✅ Running as root")
    
    working_pin = None
    working_method = None
    
    # Try GPIO export method
    pin = test_gpio_export_method()
    if pin:
        working_pin = pin
        working_method = "gpio_export"
    
    # Try WiringPi method if export didn't work
    if not working_pin:
        pin = test_wiringpi_method()
        if pin:
            working_pin = pin
            working_method = "wiringpi"
    
    print("\n🎯 FINAL RESULTS")
    print("=" * 25)
    
    if working_pin and working_method:
        print(f"🎉 SUCCESS!")
        print(f"  Working method: {working_method}")
        print(f"  Working GPIO pin: {working_pin}")
        
        # Save results
        with open('/tmp/servo_test_results.txt', 'w') as f:
            f.write(f"Working PWM method: {working_method}\n")
            f.write(f"Working GPIO pin: {working_pin}\n")
            f.write(f"Test completed: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        print("📁 Results saved to /tmp/servo_test_results.txt")
        print("\n✅ We can now implement this method in the PWM controller!")
        
    else:
        print("❌ No working servo method found.")
        print("Possible issues:")
        print("  - Servos not connected properly")
        print("  - Power supply issues")  
        print("  - Hardware not compatible")
        print("  - Need to install WiringPi: sudo apt-get install wiringpi")

if __name__ == "__main__":
    main()
