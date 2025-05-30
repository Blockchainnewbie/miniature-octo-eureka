#!/usr/bin/env python3
"""
Test servo control using libgpiod (modern Linux GPIO interface).
This might work better on Debian 12 Lite than RPi.GPIO or pigpio.
"""

import time
import threading

class LibgpiodServo:
    """Servo control using libgpiod interface."""
    
    def __init__(self, chip_name="gpiochip0", pin=18):
        self.chip_name = chip_name
        self.pin = pin
        self.chip = None
        self.line = None
        self.pwm_thread = None
        self.pwm_running = False
        self.duty_cycle = 0.0
        self.frequency = 50
        self.min_pulse = 0.5  # 0.5ms
        self.max_pulse = 2.5  # 2.5ms
        self.period = 20.0    # 20ms (50Hz)
        
    def setup(self):
        """Initialize GPIO using libgpiod."""
        try:
            import gpiod
            
            self.chip = gpiod.Chip(self.chip_name)
            self.line = self.chip.get_line(self.pin)
            
            # Request line for output
            self.line.request(consumer="servo_test", type=gpiod.LINE_REQ_DIR_OUT)
            
            print(f"Successfully initialized GPIO {self.pin} using libgpiod")
            return True
            
        except ImportError:
            print("libgpiod not available. Install with: sudo apt install python3-libgpiod")
            return False
        except Exception as e:
            print(f"Error initializing libgpiod on pin {self.pin}: {e}")
            return False
    
    def set_value(self, value):
        """Set GPIO value."""
        try:
            self.line.set_value(value)
            return True
        except Exception as e:
            print(f"Error setting GPIO value: {e}")
            return False
    
    def start_software_pwm(self, duty_cycle, frequency=50):
        """Start software PWM."""
        self.duty_cycle = duty_cycle / 100.0
        self.frequency = frequency
        self.pwm_running = True
        
        if self.pwm_thread and self.pwm_thread.is_alive():
            self.stop_software_pwm()
        
        self.pwm_thread = threading.Thread(target=self._pwm_worker, daemon=True)
        self.pwm_thread.start()
        print(f"Started libgpiod PWM: {duty_cycle}% at {frequency}Hz")
    
    def _pwm_worker(self):
        """Software PWM worker."""
        period = 1.0 / self.frequency
        
        while self.pwm_running:
            if self.duty_cycle > 0:
                self.set_value(1)
                high_time = period * self.duty_cycle
                if high_time > 0:
                    time.sleep(high_time)
                
                self.set_value(0)
                low_time = period * (1 - self.duty_cycle)
                if low_time > 0:
                    time.sleep(low_time)
            else:
                self.set_value(0)
                time.sleep(period)
    
    def stop_software_pwm(self):
        """Stop software PWM."""
        self.pwm_running = False
        if self.pwm_thread:
            self.pwm_thread.join(timeout=1.0)
        if self.line:
            self.set_value(0)
    
    def set_angle(self, angle):
        """Set servo angle (0-180 degrees)."""
        angle = max(0, min(180, angle))
        pulse_width = self.min_pulse + (angle / 180.0) * (self.max_pulse - self.min_pulse)
        duty_cycle = (pulse_width / self.period) * 100
        
        print(f"Setting servo to {angle}° (pulse: {pulse_width:.2f}ms, duty: {duty_cycle:.2f}%)")
        self.start_software_pwm(duty_cycle, 50)
    
    def cleanup(self):
        """Cleanup resources."""
        self.stop_software_pwm()
        if self.line:
            self.line.release()
        if self.chip:
            self.chip.close()

class HardwarePWMServo:
    """Try to use hardware PWM if available."""
    
    def __init__(self, chip=0, channel=0):
        self.chip = chip
        self.channel = channel
        self.pwm_path = f"/sys/class/pwm/pwmchip{chip}/pwm{channel}"
        self.chip_path = f"/sys/class/pwm/pwmchip{chip}"
        self.exported = False
        self.period_ns = 20000000  # 20ms in nanoseconds (50Hz)
        
    def export_pwm(self):
        """Export PWM channel."""
        try:
            if os.path.exists(self.pwm_path):
                print(f"PWM {self.chip}:{self.channel} already exported")
                self.exported = True
                return True
            
            with open(f"{self.chip_path}/export", "w") as f:
                f.write(str(self.channel))
            
            # Wait for export
            for _ in range(10):
                if os.path.exists(self.pwm_path):
                    break
                time.sleep(0.1)
            
            if os.path.exists(self.pwm_path):
                self.exported = True
                print(f"Successfully exported PWM {self.chip}:{self.channel}")
                return True
            else:
                print(f"Failed to export PWM {self.chip}:{self.channel}")
                return False
                
        except Exception as e:
            print(f"Error exporting PWM {self.chip}:{self.channel}: {e}")
            return False
    
    def configure_pwm(self):
        """Configure PWM period and enable."""
        if not self.exported:
            return False
        
        try:
            # Set period (20ms = 20,000,000 ns)
            with open(f"{self.pwm_path}/period", "w") as f:
                f.write(str(self.period_ns))
            
            # Enable PWM
            with open(f"{self.pwm_path}/enable", "w") as f:
                f.write("1")
            
            print(f"Configured PWM {self.chip}:{self.channel} with {self.period_ns}ns period")
            return True
            
        except Exception as e:
            print(f"Error configuring PWM {self.chip}:{self.channel}: {e}")
            return False
    
    def set_angle(self, angle):
        """Set servo angle using hardware PWM."""
        if not self.exported:
            return False
        
        angle = max(0, min(180, angle))
        
        # Calculate duty cycle in nanoseconds
        min_pulse_ns = 500000   # 0.5ms
        max_pulse_ns = 2500000  # 2.5ms
        duty_ns = int(min_pulse_ns + (angle / 180.0) * (max_pulse_ns - min_pulse_ns))
        
        try:
            with open(f"{self.pwm_path}/duty_cycle", "w") as f:
                f.write(str(duty_ns))
            
            print(f"Set servo to {angle}° (duty: {duty_ns}ns)")
            return True
            
        except Exception as e:
            print(f"Error setting PWM duty cycle: {e}")
            return False
    
    def cleanup(self):
        """Cleanup PWM resources."""
        if self.exported:
            try:
                # Disable PWM
                with open(f"{self.pwm_path}/enable", "w") as f:
                    f.write("0")
                
                # Unexport
                with open(f"{self.chip_path}/unexport", "w") as f:
                    f.write(str(self.channel))
                
                print(f"Cleaned up PWM {self.chip}:{self.channel}")
            except Exception as e:
                print(f"Error cleaning up PWM: {e}")

def test_libgpiod_servo():
    """Test servo using libgpiod."""
    print("\n=== Testing libgpiod servo control ===")
    
    test_pins = [18, 2, 3, 4, 17, 27]
    
    for pin in test_pins:
        print(f"\nTesting libgpiod on GPIO {pin}...")
        
        servo = LibgpiodServo("gpiochip0", pin)
        
        if not servo.setup():
            print(f"Failed to setup libgpiod on pin {pin}")
            continue
        
        try:
            test_angles = [0, 45, 90, 135, 180, 90]
            
            for angle in test_angles:
                print(f"Moving to {angle}°...")
                servo.set_angle(angle)
                time.sleep(1.5)
            
            print(f"SUCCESS: libgpiod servo working on GPIO {pin}!")
            servo.cleanup()
            return pin
            
        except Exception as e:
            print(f"Error testing libgpiod on pin {pin}: {e}")
            servo.cleanup()
    
    print("libgpiod servo test failed on all pins")
    return None

def test_hardware_pwm():
    """Test hardware PWM servo control."""
    print("\n=== Testing hardware PWM servo control ===")
    
    import os
    
    # Check available PWM chips
    pwm_chips = []
    if os.path.exists("/sys/class/pwm"):
        for item in os.listdir("/sys/class/pwm"):
            if item.startswith("pwmchip"):
                chip_num = int(item.replace("pwmchip", ""))
                pwm_chips.append(chip_num)
    
    print(f"Available PWM chips: {pwm_chips}")
    
    for chip in pwm_chips:
        print(f"\nTesting PWM chip {chip}...")
        
        servo = HardwarePWMServo(chip, 0)
        
        if not servo.export_pwm():
            continue
        
        if not servo.configure_pwm():
            servo.cleanup()
            continue
        
        try:
            test_angles = [0, 45, 90, 135, 180, 90]
            
            for angle in test_angles:
                print(f"Moving to {angle}°...")
                servo.set_angle(angle)
                time.sleep(1.5)
            
            print(f"SUCCESS: Hardware PWM working on chip {chip}!")
            servo.cleanup()
            return chip
            
        except Exception as e:
            print(f"Error testing hardware PWM on chip {chip}: {e}")
            servo.cleanup()
    
    print("Hardware PWM test failed on all available chips")
    return None

if __name__ == "__main__":
    import os
    
    print("Modern GPIO Servo Test for Debian 12")
    print("====================================")
    
    if os.geteuid() != 0:
        print("WARNING: Not running as root. Some features might not work.")
        print("Try: sudo python3 modern_servo_test.py")
    
    try:
        # Test 1: libgpiod
        working_pin = test_libgpiod_servo()
        if working_pin:
            print(f"\n✓ Found working solution: libgpiod on GPIO {working_pin}")
        
        # Test 2: Hardware PWM
        working_pwm = test_hardware_pwm()
        if working_pwm:
            print(f"\n✓ Found working solution: Hardware PWM chip {working_pwm}")
        
        if not working_pin and not working_pwm:
            print("\n✗ No working servo control method found")
            print("System may need additional GPIO drivers or permissions")
        
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Test failed with error: {e}")
