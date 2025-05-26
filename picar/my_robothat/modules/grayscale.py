"""
Grayscale sensor module implementation.
"""

import logging
from typing import List, Optional
from ..interfaces.adc_interface import ADCInterface

logger = logging.getLogger(__name__)


class GrayscaleModule:
    """Grayscale sensor array module."""
    
    def __init__(self, adc_controller: ADCInterface, 
                 channels: List[int], 
                 reference_values: Optional[List[float]] = None):
        """
        Initialize grayscale sensor module.
        
        Args:
            adc_controller: ADC controller instance
            channels: List of ADC channels for sensors
            reference_values: Reference values for calibration
        """
        self.adc = adc_controller
        self.channels = channels
        self.reference_values = reference_values or [1.65] * len(channels)
        
        if len(self.reference_values) != len(channels):
            raise ValueError("Reference values must match number of channels")
        
        logger.info(f"Grayscale module initialized with {len(channels)} sensors")
    
    def read_raw(self) -> List[float]:
        """
        Read raw voltage values from all sensors.
        
        Returns:
            List of voltage values
        """
        values = []
        for channel in self.channels:
            value = self.adc.read(channel)
            values.append(value)
        
        logger.debug(f"Grayscale raw values: {values}")
        return values
    
    def read_normalized(self) -> List[float]:
        """
        Read normalized values (0-1) from all sensors.
        
        Returns:
            List of normalized values
        """
        raw_values = self.read_raw()
        normalized = []
        
        for i, value in enumerate(raw_values):
            # Normalize to 0-1 range based on reference
            normalized_value = value / 3.3  # Assuming 3.3V max
            normalized_value = max(0.0, min(1.0, normalized_value))
            normalized.append(normalized_value)
        
        logger.debug(f"Grayscale normalized values: {normalized}")
        return normalized
    
    def read_digital(self, threshold: float = 0.5) -> List[bool]:
        """
        Read digital values based on threshold.
        
        Args:
            threshold: Threshold for digital conversion (0-1)
            
        Returns:
            List of boolean values
        """
        normalized = self.read_normalized()
        digital = [value > threshold for value in normalized]
        
        logger.debug(f"Grayscale digital values: {digital}")
        return digital
    
    def get_line_position(self) -> Optional[float]:
        """
        Calculate line position from sensor readings.
        
        Returns:
            Line position (-1 to 1, 0 = center), or None if no line detected
        """
        normalized = self.read_normalized()
        
        # Invert values (assuming dark line on light surface)
        inverted = [1.0 - value for value in normalized]
        
        # Calculate weighted average
        total_weight = sum(inverted)
        if total_weight == 0:
            return None
        
        weighted_sum = sum(i * weight for i, weight in enumerate(inverted))
        center_position = weighted_sum / total_weight
        
        # Convert to -1 to 1 range
        num_sensors = len(self.channels)
        position = (center_position - (num_sensors - 1) / 2) / ((num_sensors - 1) / 2)
        
        logger.debug(f"Line position: {position:.3f}")
        return position
    
    def calibrate(self, reference_values: List[float]) -> None:
        """
        Calibrate sensor with new reference values.
        
        Args:
            reference_values: New reference values
        """
        if len(reference_values) != len(self.channels):
            raise ValueError("Reference values must match number of channels")
        
        self.reference_values = reference_values.copy()
        logger.info(f"Grayscale sensors calibrated: {self.reference_values}")