"""
ADC Interface - defines contract for Analog-to-Digital conversion.
"""

from abc import ABC, abstractmethod


class ADCInterface(ABC):
    """Abstract interface for ADC operations."""
    
    @abstractmethod
    def read(self, channel: int) -> float:
        """
        Read analog value from ADC channel.
        
        Args:
            channel: ADC channel number (0-7 typically)
            
        Returns:
            Analog value (0.0 - 3.3V or normalized 0-1)
        """
        pass
    
    @abstractmethod
    def read_raw(self, channel: int) -> int:
        """
        Read raw ADC value.
        
        Args:
            channel: ADC channel number
            
        Returns:
            Raw ADC value (0-4095 for 12-bit ADC)
        """
        pass
    
    @abstractmethod
    def cleanup(self) -> None:
        """Cleanup ADC resources."""
        pass