#!/usr/bin/env python3
"""
Test servo control using direct sysfs GPIO manipulation with software PWM.
This approach should work on Debian 12 Lite even without /dev/gpiomem.
"""

import time
import threading
import os
import subprocess

class SysfsGPIO:
    """GPIO control using Linux sysfs interface."""
    
    def __init__(self, pin):
        self.pin = pin
        self.gpio_path = f"/sys/class/gpio/gpio{pin}"
        self.exported = False
        self.pwm_thread = None
        self.pwm_running = False
        self.duty_cycle = 0.0
        self.frequency = 50  # 50Hz for servo
        
    def export_gpio(self):
        """Export GPIO pin for use."""
        try:
            # Check if already exported
            if os.path.exists(self.gpio_path):
                print(f"GPIO {self.pin} already exported")
                self.exported = True
                return True
                
            # Export the pin
            with open("/sys/class/gpio/export", "w") as f:
                f.write(str(self.pin))
            
            # Wait for the directory to appear
            for _ in range(10):
                if os.path.exists(self.gpio_path):
                    break
                time.sleep(0.1)
            
            if os.path.exists(self.gpio_path):
                self.exported = True
                print(f"Successfully exported GPIO {self.pin}")
                return True
            else:
                print(f"Failed to export GPIO {self.pin}")
                return False
                
        except Exception as e:
            print(f"Error exporting GPIO {self.pin}: {e}")
            return False
    
    def set_direction(self, direction):
        """Set GPIO direction (in/out)."""
        if not self.exported:
            return False
            
        try:
            with open(f"{self.gpio_path}/direction", "w") as f:
                f.write(direction)
            print(f"Set GPIO {self.pin} direction to {direction}")
            return True
        except Exception as e:
            print(f"Error setting direction for GPIO {self.pin}: {e}")
            return False
    
    def set_value(self, value):
        """Set GPIO value (0/1)."""
        if not self.exported:
            return False
            
        try:
            with open(f"{self.gpio_path}/value", "w") as f:
                f.write(str(value))
            return True
        except Exception as e:
            print(f"Error setting value for GPIO {self.pin}: {e}")
            return False
    
    def start_software_pwm(self, duty_cycle, frequency=50):
        """Start software PWM with given duty cycle (0-100) and frequency."""
        self.duty_cycle = duty_cycle / 100.0  # Convert to 0-1 range
        self.frequency = frequency
        self.pwm_running = True
        
        if self.pwm_thread and self.pwm_thread.is_alive():
            self.stop_software_pwm()
        
        self.pwm_thread = threading.Thread(target=self._pwm_worker, daemon=True)
        self.pwm_thread.start()
        print(f"Started software PWM on GPIO {self.pin}: {duty_cycle}% at {frequency}Hz")
    
    def _pwm_worker(self):
        """Software PWM worker thread."""
        period = 1.0 / self.frequency  # Period in seconds
        
        while self.pwm_running:
            if self.duty_cycle > 0:
                # High time
                self.set_value(1)
                high_time = period * self.duty_cycle
                if high_time > 0:
                    time.sleep(high_time)
                
                # Low time
                self.set_value(0)
                low_time = period * (1 - self.duty_cycle)
                if low_time > 0:
                    time.sleep(low_time)
            else:
                # Always low
                self.set_value(0)
                time.sleep(period)
    
    def stop_software_pwm(self):
        """Stop software PWM."""
        self.pwm_running = False
        if self.pwm_thread:
            self.pwm_thread.join(timeout=1.0)
        self.set_value(0)
        print(f"Stopped software PWM on GPIO {self.pin}")
    
    def cleanup(self):
        """Clean up GPIO resources."""
        self.stop_software_pwm()
        if self.exported:
            try:
                with open("/sys/class/gpio/unexport", "w") as f:
                    f.write(str(self.pin))
                print(f"Unexported GPIO {self.pin}")
            except Exception as e:
                print(f"Error unexporting GPIO {self.pin}: {e}")

class SysfsServo:
    """Servo control using sysfs GPIO with software PWM."""
    
    def __init__(self, pin):
        self.pin = pin
        self.gpio = SysfsGPIO(pin)
        self.min_pulse = 0.5  # 0.5ms min pulse width
        self.max_pulse = 2.5  # 2.5ms max pulse width
        self.period = 20.0    # 20ms period (50Hz)
        
    def setup(self):
        """Initialize the servo."""
        if not self.gpio.export_gpio():
            return False
        if not self.gpio.set_direction("out"):
            return False
        return True
    
    def set_angle(self, angle):
        """Set servo angle (0-180 degrees)."""
        # Clamp angle to valid range
        angle = max(0, min(180, angle))
        
        # Calculate pulse width for the angle
        pulse_width = self.min_pulse + (angle / 180.0) * (self.max_pulse - self.min_pulse)
        
        # Calculate duty cycle as percentage
        duty_cycle = (pulse_width / self.period) * 100
        
        print(f"Setting servo to {angle}° (pulse: {pulse_width:.2f}ms, duty: {duty_cycle:.2f}%)")
        self.gpio.start_software_pwm(duty_cycle, 50)
        
    def stop(self):
        """Stop the servo."""
        self.gpio.cleanup()

def test_servo_movement():
    """Test servo movement through different angles."""
    # Test with different GPIO pins to find one that works
    test_pins = [2, 3, 4, 17, 27, 22, 10, 9, 11, 5, 6, 13, 19, 26, 14, 15, 18]
    
    for pin in test_pins:
        print(f"\n=== Testing GPIO pin {pin} ===")
        
        servo = SysfsServo(pin)
        
        if not servo.setup():
            print(f"Failed to setup servo on pin {pin}")
            continue
        
        try:
            # Test servo movement
            test_angles = [0, 45, 90, 135, 180, 90]
            
            for angle in test_angles:
                print(f"Moving to {angle} degrees...")
                servo.set_angle(angle)
                time.sleep(1.5)
            
            print(f"SUCCESS: Servo control working on GPIO {pin}!")
            print("Check if the servo is physically moving.")
            
            # Keep running to observe movement
            input("\nPress Enter to test next pin or Ctrl+C to stop...")
            
        except KeyboardInterrupt:
            print(f"\nStopping test on GPIO {pin}")
            break
        except Exception as e:
            print(f"Error during servo test on pin {pin}: {e}")
        finally:
            servo.stop()
    
    print("\nAll tests completed.")

def test_gpio_availability():
    """Test which GPIO pins are available."""
    print("Testing GPIO pin availability...")
    
    available_pins = []
    test_pins = [2, 3, 4, 17, 27, 22, 10, 9, 11, 5, 6, 13, 19, 26, 14, 15, 18]
    
    for pin in test_pins:
        gpio = SysfsGPIO(pin)
        if gpio.export_gpio():
            if gpio.set_direction("out"):
                available_pins.append(pin)
                print(f"✓ GPIO {pin} is available")
            else:
                print(f"✗ GPIO {pin} cannot be set as output")
        else:
            print(f"✗ GPIO {pin} cannot be exported")
        gpio.cleanup()
    
    print(f"\nAvailable GPIO pins: {available_pins}")
    return available_pins

if __name__ == "__main__":
    print("Sysfs GPIO Servo Test")
    print("====================")
    
    # Check if running as root
    if os.geteuid() != 0:
        print("WARNING: Not running as root. GPIO access might fail.")
        print("Try running with: sudo python3 sysfs_servo_test.py")
    
    # First check GPIO availability
    available_pins = test_gpio_availability()
    
    if not available_pins:
        print("\nNo GPIO pins available. Cannot proceed with servo test.")
        exit(1)
    
    print(f"\nWill test servo on {len(available_pins)} available pins...")
    input("Press Enter to start servo movement test...")
    
    try:
        test_servo_movement()
    except KeyboardInterrupt:
        print("\nTest interrupted by user.")
    except Exception as e:
        print(f"Test failed with error: {e}")
