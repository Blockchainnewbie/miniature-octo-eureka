"""
Motor interface defining the contract for all motor implementations.
"""

from abc import ABC, abstractmethod
from typing import Union


class MotorInterface(ABC):
    """Abstract base class for all motor types."""
    
    @abstractmethod
    def set_speed(self, speed: int) -> None:
        """
        Set motor speed.
        
        Args:
            speed: Speed value between -100 and 100
        """
        pass
    
    @abstractmethod
    def stop(self) -> None:
        """Stop the motor immediately."""
        pass
    
    @abstractmethod
    def is_running(self) -> bool:
        """Check if motor is currently running."""
        pass