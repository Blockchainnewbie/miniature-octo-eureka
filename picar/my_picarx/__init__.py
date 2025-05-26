"""
my_picarx - Modern Picar-X Control Library
Built with Clean Code and SOLID principles using my_robothat HAL.

Author: Blockchainnewbie  
Date: 2025-05-24
"""

__version__ = "0.1.0"
__author__ = "Blockchainnewbie"

from .core.picarx_controller import PicarXController
from .motors.dc_motor import DCMotor
from .motors.servo_motor import ServoMotor

__all__ = ['PicarXController', 'DCMotor', 'ServoMotor']