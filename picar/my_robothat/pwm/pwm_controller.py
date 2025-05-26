"""
Raspberry Pi PWM Controller implementation.
"""

import time
import logging
from typing import Dict
from ..interfaces.pwm_interface import PWMInterface

logger = logging.getLogger(__name__)


class RaspberryPiPWMController(PWMInterface):
    """Raspberry Pi PWM implementation using RPi.GPIO library."""
    
    def __init__(self):
        """Initialize PWM controller."""
        self._pwm_instances: Dict[str, object] = {}
        self._is_setup = False
        self._setup_pwm()
    
    def _setup_pwm(self) -> None:
        """Setup PWM library."""
        try:
            import RPi.GPIO as GPIO
            self._GPIO = GPIO
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)
            self._is_setup = True
            logger.info("PWM controller initialized")
        except ImportError:
            logger.warning("RPi.GPIO not available, using mock implementation")
            self._GPIO = self._create_mock_gpio()
            self._is_setup = True
    
    def _create_mock_gpio(self):
        """Create mock GPIO for testing/development."""
        class MockPWM:
            def __init__(self, pin, frequency):
                self.pin = pin
                self.frequency = frequency
                self.duty_cycle = 0
                self.is_started = False
            
            def start(self, duty_cycle):
                self.duty_cycle = duty_cycle
                self.is_started = True
            
            def ChangeDutyCycle(self, duty_cycle):
                self.duty_cycle = duty_cycle
            
            def stop(self):
                self.is_started = False
                self.duty_cycle = 0
        
        class MockGPIO:
            BCM = "BCM"
            OUT = "OUT"
            PWM = MockPWM
            
            @staticmethod
            def setmode(mode): pass
            @staticmethod
            def setwarnings(enabled): pass
            @staticmethod
            def setup(pin, mode): pass
            @staticmethod
            def cleanup(): pass
        
        return MockGPIO()
    
    def start(self, pin: str, frequency: float) -> None:
        """Start PWM on specified pin."""
        if not self._is_setup:
            raise RuntimeError("PWM not properly initialized")
        
        pin_num = int(pin)
        
        # Setup pin for PWM
        self._GPIO.setup(pin_num, self._GPIO.OUT)
        
        # Create PWM instance
        pwm_instance = self._GPIO.PWM(pin_num, frequency)
        pwm_instance.start(0)  # Start with 0% duty cycle
        
        self._pwm_instances[pin] = pwm_instance
        logger.debug(f"PWM started on pin {pin} at {frequency}Hz")
    
    def set_duty_cycle(self, pin: str, duty_cycle: float) -> None:
        """Set PWM duty cycle."""
        if pin not in self._pwm_instances:
            raise RuntimeError(f"PWM not started on pin {pin}")
        
        if not 0 <= duty_cycle <= 100:
            raise ValueError("Duty cycle must be between 0 and 100")
        
        self._pwm_instances[pin].ChangeDutyCycle(duty_cycle)
        logger.debug(f"PWM pin {pin} duty cycle set to {duty_cycle}%")
    
    def stop(self, pin: str) -> None:
        """Stop PWM on specified pin."""
        if pin in self._pwm_instances:
            self._pwm_instances[pin].stop()
            del self._pwm_instances[pin]
            logger.debug(f"PWM stopped on pin {pin}")
    
    def cleanup(self) -> None:
        """Cleanup all PWM resources."""
        for pin in list(self._pwm_instances.keys()):
            self.stop(pin)
        
        if self._is_setup:
            self._GPIO.cleanup()
            logger.info("PWM resources cleaned up")