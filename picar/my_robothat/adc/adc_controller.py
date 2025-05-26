"""
Raspberry Pi ADC Controller implementation using ADS1015/ADS1115.
"""

import logging
from typing import Optional
from ..interfaces.adc_interface import ADCInterface

logger = logging.getLogger(__name__)


class RaspberryPiADCController(ADCInterface):
    """ADC implementation for Raspberry Pi using I2C ADC chip."""
    
    def __init__(self, address: int = 0x48, voltage_ref: float = 3.3):
        """
        Initialize ADC controller.
        
        Args:
            address: I2C address of ADC chip
            voltage_ref: Reference voltage
        """
        self.address = address
        self.voltage_ref = voltage_ref
        self._is_setup = False
        self._setup_adc()
    
    def _setup_adc(self) -> None:
        """Setup ADC chip communication."""
        try:
            # Try to import Adafruit CircuitPython libraries
            import board
            import busio
            import adafruit_ads1x15.ads1015 as ADS
            from adafruit_ads1x15.analog_in import AnalogIn
            
            # Create I2C bus and ADC object
            i2c = busio.I2C(board.SCL, board.SDA)
            self._ads = ADS.ADS1015(i2c, address=self.address)
            self._ADS = ADS
            self._AnalogIn = AnalogIn
            self._is_setup = True
            logger.info(f"ADC initialized at address 0x{self.address:02x}")
            
        except ImportError:
            logger.warning("ADC libraries not available, using mock implementation")
            self._create_mock_adc()
            self._is_setup = True
    
    def _create_mock_adc(self):
        """Create mock ADC for testing/development."""
        class MockAnalogIn:
            def __init__(self, ads, channel):
                self.voltage = 1.65  # Mock voltage
                self.value = 2048    # Mock raw value (12-bit midpoint)
        
        class MockADS:
            P0 = 0
            P1 = 1
            P2 = 2
            P3 = 3
        
        self._ads = MockADS()
        self._ADS = MockADS
        self._AnalogIn = MockAnalogIn
    
    def read(self, channel: int) -> float:
        """Read analog value from ADC channel."""
        if not self._is_setup:
            raise RuntimeError("ADC not properly initialized")
        
        if not 0 <= channel <= 3:
            raise ValueError("Channel must be between 0 and 3")
        
        # Create analog input for the channel
        channel_attr = getattr(self._ads, f'P{channel}')
        analog_in = self._AnalogIn(self._ads, channel_attr)
        
        voltage = analog_in.voltage
        logger.debug(f"ADC channel {channel} read: {voltage:.3f}V")
        return voltage
    
    def read_raw(self, channel: int) -> int:
        """Read raw ADC value."""
        if not self._is_setup:
            raise RuntimeError("ADC not properly initialized")
        
        if not 0 <= channel <= 3:
            raise ValueError("Channel must be between 0 and 3")
        
        # Create analog input for the channel
        channel_attr = getattr(self._ads, f'P{channel}')
        analog_in = self._AnalogIn(self._ads, channel_attr)
        
        raw_value = analog_in.value
        logger.debug(f"ADC channel {channel} raw: {raw_value}")
        return raw_value
    
    def cleanup(self) -> None:
        """Cleanup ADC resources."""
        if self._is_setup:
            # ADC cleanup typically not needed for I2C devices
            logger.info("ADC resources cleaned up")