"""
GPIO Interface - defines contract for GPIO operations.
"""

from abc import ABC, abstractmethod
from typing import Optional


class GPIOInterface(ABC):
    """Abstract interface for GPIO operations."""
    
    @abstractmethod
    def setup(self, pin: str, mode: str, pull: Optional[str] = None) -> None:
        """
        Setup GPIO pin.
        
        Args:
            pin: Pin identifier (e.g., "18", "BCM18")
            mode: Pin mode ("in", "out")
            pull: Pull resistor ("up", "down", "off", None)
        """
        pass
    
    @abstractmethod
    def write(self, pin: str, value: bool) -> None:
        """Write digital value to output pin."""
        pass
    
    @abstractmethod
    def read(self, pin: str) -> bool:
        """Read digital value from input pin."""
        pass
    
    @abstractmethod
    def cleanup(self) -> None:
        """Cleanup all GPIO resources."""
        pass