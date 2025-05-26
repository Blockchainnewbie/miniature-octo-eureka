"""
Actuator interface for servo motors and other position-controlled devices.
"""

from abc import ABC, abstractmethod


class ActuatorInterface(ABC):
    """Abstract base class for all actuator types."""
    
    @abstractmethod
    def set_position(self, position: float) -> None:
        """
        Set actuator position.
        
        Args:
            position: Target position (angle for servos)
        """
        pass
    
    @abstractmethod
    def get_position(self) -> float:
        """Get current actuator position."""
        pass
    
    @abstractmethod
    def calibrate(self, offset: float = 0.0) -> None:
        """
        Calibrate actuator position.
        
        Args:
            offset: Calibration offset value
        """
        pass