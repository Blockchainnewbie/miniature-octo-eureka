"""
Servo Interface - defines contract for servo motor operations.
"""

from abc import ABC, abstractmethod


class ServoInterface(ABC):
    """Abstract interface for servo operations."""
    
    @abstractmethod
    def set_angle(self, pin: str, angle: float) -> None:
        """
        Set servo angle.
        
        Args:
            pin: Servo PWM pin
            angle: Target angle in degrees
        """
        pass
    
    @abstractmethod
    def get_angle(self, pin: str) -> float:
        """Get current servo angle."""
        pass
    
    @abstractmethod
    def calibrate(self, pin: str, offset: float) -> None:
        """
        Calibrate servo.
        
        Args:
            pin: Servo PWM pin
            offset: Calibration offset in degrees
        """
        pass
    
    @abstractmethod
    def cleanup(self) -> None:
        """Cleanup servo resources."""
        pass