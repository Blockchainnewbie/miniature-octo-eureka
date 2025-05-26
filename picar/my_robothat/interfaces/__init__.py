"""
Hardware interfaces package - defines contracts for all hardware components.
"""

from .gpio_interface import GPIOInterface
from .pwm_interface import PWMInterface
from .adc_interface import ADCInterface
from .servo_interface import ServoInterface

__all__ = ['GPIOInterface', 'PWMInterface', 'ADCInterface', 'ServoInterface']