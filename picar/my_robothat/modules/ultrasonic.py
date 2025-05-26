"""
Ultrasonic sensor module implementation.
"""

import time
import logging
from typing import Optional
from ..interfaces.gpio_interface import GPIOInterface

logger = logging.getLogger(__name__)


class UltrasonicModule:
    """Ultrasonic distance sensor module."""
    
    def __init__(self, gpio_controller: GPIOInterface, 
                 trig_pin: str, echo_pin: str, 
                 timeout: float = 0.03):
        """
        Initialize ultrasonic sensor.
        
        Args:
            gpio_controller: GPIO controller instance
            trig_pin: Trigger pin
            echo_pin: Echo pin
            timeout: Maximum time to wait for echo (seconds)
        """
        self.gpio = gpio_controller
        self.trig_pin = trig_pin
        self.echo_pin = echo_pin
        self.timeout = timeout
        
        # Setup pins
        self.gpio.setup(self.trig_pin, 'out')
        self.gpio.setup(self.echo_pin, 'in', pull='down')
        
        # Initialize trigger pin to low
        self.gpio.write(self.trig_pin, False)
        time.sleep(0.1)  # Allow sensor to settle
        
        logger.info(f"Ultrasonic sensor initialized (trig: {trig_pin}, echo: {echo_pin})")
    
    def read_distance(self) -> Optional[float]:
        """
        Read distance from ultrasonic sensor.
        
        Returns:
            Distance in centimeters, or None if measurement failed
        """
        try:
            # Send trigger pulse
            self.gpio.write(self.trig_pin, False)
            time.sleep(0.000002)  # 2µs
            self.gpio.write(self.trig_pin, True)
            time.sleep(0.00001)   # 10µs
            self.gpio.write(self.trig_pin, False)
            
            # Wait for echo start
            start_time = time.time()
            while not self.gpio.read(self.echo_pin):
                if time.time() - start_time > self.timeout:
                    logger.warning("Ultrasonic sensor timeout waiting for echo start")
                    return None
            
            pulse_start = time.time()
            
            # Wait for echo end
            while self.gpio.read(self.echo_pin):
                if time.time() - pulse_start > self.timeout:
                    logger.warning("Ultrasonic sensor timeout waiting for echo end")
                    return None
            
            pulse_end = time.time()
            
            # Calculate distance
            pulse_duration = pulse_end - pulse_start
            # Sound speed: 343 m/s = 34300 cm/s
            # Distance = (pulse_duration * 34300) / 2  (divide by 2 for round trip)
            distance = pulse_duration * 17150
            
            logger.debug(f"Ultrasonic distance: {distance:.2f} cm")
            return round(distance, 2)
            
        except Exception as e:
            logger.error(f"Error reading ultrasonic sensor: {e}")
            return None
    
    def read_distance_average(self, samples: int = 5) -> Optional[float]:
        """
        Read average distance over multiple samples.
        
        Args:
            samples: Number of samples to average
            
        Returns:
            Average distance in centimeters
        """
        distances = []
        for _ in range(samples):
            distance = self.read_distance()
            if distance is not None:
                distances.append(distance)
            time.sleep(0.01)  # Small delay between readings
        
        if not distances:
            return None
        
        average = sum(distances) / len(distances)
        logger.debug(f"Ultrasonic average distance ({len(distances)} samples): {average:.2f} cm")
        return round(average, 2)