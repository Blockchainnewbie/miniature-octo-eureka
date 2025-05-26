"""
PWM Interface - defines contract for PWM operations.
"""

from abc import ABC, abstractmethod


class PWMInterface(ABC):
    """Abstract interface for PWM operations."""
    
    @abstractmethod
    def start(self, pin: str, frequency: float) -> None:
        """
        Start PWM on specified pin.
        
        Args:
            pin: PWM pin identifier
            frequency: PWM frequency in Hz
        """
        pass
    
    @abstractmethod
    def set_duty_cycle(self, pin: str, duty_cycle: float) -> None:
        """
        Set PWM duty cycle.
        
        Args:
            pin: PWM pin identifier
            duty_cycle: Duty cycle percentage (0-100)
        """
        pass
    
    @abstractmethod
    def stop(self, pin: str) -> None:
        """Stop PWM on specified pin."""
        pass
    
    @abstractmethod
    def cleanup(self) -> None:
        """Cleanup all PWM resources."""
        pass