"""
Raspberry Pi GPIO Controller implementation.
"""

import logging
from typing import Optional, Set
from ..interfaces.gpio_interface import GPIOInterface

logger = logging.getLogger(__name__)


class RaspberryPiGPIOController(GPIOInterface):
    """Raspberry Pi GPIO implementation using RPi.GPIO library."""
    
    def __init__(self):
        """Initialize GPIO controller."""
        self._initialized_pins: Set[int] = set()
        self._pin_modes: dict = {}
        self._is_setup = False
        self._setup_gpio()
    
    def _setup_gpio(self) -> None:
        """Setup GPIO library."""
        try:
            import RPi.GPIO as GPIO
            self._GPIO = GPIO
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)
            self._is_setup = True
            logger.info("GPIO controller initialized")
        except ImportError:
            logger.warning("RPi.GPIO not available, using mock implementation")
            self._GPIO = self._create_mock_gpio()
            self._is_setup = True
    
    def _create_mock_gpio(self):
        """Create mock GPIO for testing/development without hardware."""
        class MockGPIO:
            BCM = "BCM"
            OUT = "OUT"
            IN = "IN"
            HIGH = True
            LOW = False
            PUD_UP = "PUD_UP"
            PUD_DOWN = "PUD_DOWN"
            PUD_OFF = "PUD_OFF"
            
            @staticmethod
            def setmode(mode): pass
            @staticmethod
            def setwarnings(enabled): pass
            @staticmethod
            def setup(pin, mode, pull_up_down=None): pass
            @staticmethod
            def output(pin, value): pass
            @staticmethod
            def input(pin): return False
            @staticmethod
            def cleanup(): pass
        
        return MockGPIO()
    
    def setup(self, pin: str, mode: str, pull: Optional[str] = None) -> None:
        """Setup GPIO pin."""
        if not self._is_setup:
            raise RuntimeError("GPIO not properly initialized")
        
        pin_num = int(pin)
        gpio_mode = self._GPIO.OUT if mode.lower() == 'out' else self._GPIO.IN
        
        if pull:
            pull_resistor = {
                'up': self._GPIO.PUD_UP,
                'down': self._GPIO.PUD_DOWN,
                'off': self._GPIO.PUD_OFF
            }.get(pull.lower(), self._GPIO.PUD_OFF)
            
            self._GPIO.setup(pin_num, gpio_mode, pull_up_down=pull_resistor)
        else:
            self._GPIO.setup(pin_num, gpio_mode)
        
        self._initialized_pins.add(pin_num)
        self._pin_modes[pin_num] = mode.lower()
        logger.debug(f"GPIO pin {pin} setup as {mode} with pull {pull}")
    
    def write(self, pin: str, value: bool) -> None:
        """Write digital value to output pin."""
        pin_num = int(pin)
        if pin_num not in self._initialized_pins:
            raise RuntimeError(f"Pin {pin} not initialized")
        
        if self._pin_modes.get(pin_num) != 'out':
            raise RuntimeError(f"Pin {pin} not configured as output")
        
        self._GPIO.output(pin_num, self._GPIO.HIGH if value else self._GPIO.LOW)
        logger.debug(f"GPIO pin {pin} set to {value}")
    
    def read(self, pin: str) -> bool:
        """Read digital value from input pin."""
        pin_num = int(pin)
        if pin_num not in self._initialized_pins:
            raise RuntimeError(f"Pin {pin} not initialized")
        
        value = self._GPIO.input(pin_num)
        logger.debug(f"GPIO pin {pin} read: {value}")
        return bool(value)
    
    def cleanup(self) -> None:
        """Cleanup all GPIO resources."""
        if self._is_setup:
            self._GPIO.cleanup()
            self._initialized_pins.clear()
            self._pin_modes.clear()
            logger.info("GPIO resources cleaned up")