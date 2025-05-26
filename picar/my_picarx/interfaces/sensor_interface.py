"""
Sensor interface defining the contract for all sensor implementations.
"""

from abc import ABC, abstractmethod
from typing import Union, List, Any


class SensorInterface(ABC):
    """Abstract base class for all sensor types."""
    
    @abstractmethod
    def read(self) -> Union[float, int, List[Union[float, int]]]:
        """
        Read sensor data.
        
        Returns:
            Sensor reading(s)
        """
        pass
    
    @abstractmethod
    def calibrate(self, reference_values: Any = None) -> None:
        """
        Calibrate the sensor.
        
        Args:
            reference_values: Reference values for calibration
        """
        pass
    
    @abstractmethod
    def is_ready(self) -> bool:
        """Check if sensor is ready for reading."""
        pass