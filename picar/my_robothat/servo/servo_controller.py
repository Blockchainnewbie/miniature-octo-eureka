"""
Servo Controller implementation.
"""

import logging
from typing import Dict
from ..interfaces.servo_interface import ServoInterface
from ..pwm.pwm_controller import RaspberryPiPWMController

logger = logging.getLogger(__name__)


class ServoController(ServoInterface):
    """Servo controller using PWM."""
    
    def __init__(self, pwm_controller: RaspberryPiPWMController):
        """
        Initialize servo controller.
        
        Args:
            pwm_controller: PWM controller instance
        """
        self.pwm_controller = pwm_controller
        self._servo_angles: Dict[str, float] = {}
        self._servo_offsets: Dict[str, float] = {}
        self._servo_frequency = 50.0  # Standard servo frequency
        
        # Servo timing constants
        self._min_pulse_width = 1.0  # ms
        self._max_pulse_width = 2.0  # ms
        self._pulse_period = 20.0    # ms (50Hz)
        
        logger.info("Servo controller initialized")
    
    def set_angle(self, pin: str, angle: float) -> None:
        """Set servo angle."""
        if not -180 <= angle <= 180:
            raise ValueError("Angle must be between -180 and 180 degrees")
        
        # Apply calibration offset
        offset = self._servo_offsets.get(pin, 0.0)
        adjusted_angle = angle + offset
        
        # Ensure servo is initialized
        if pin not in self._servo_angles:
            self.pwm_controller.start(pin, self._servo_frequency)
        
        # Convert angle to duty cycle
        duty_cycle = self._angle_to_duty_cycle(adjusted_angle)
        self.pwm_controller.set_duty_cycle(pin, duty_cycle)
        
        # Store current angle
        self._servo_angles[pin] = angle
        logger.debug(f"Servo pin {pin} set to {angle}° (adjusted: {adjusted_angle:.1f}°)")
    
    def get_angle(self, pin: str) -> float:
        """Get current servo angle."""
        return self._servo_angles.get(pin, 0.0)
    
    def calibrate(self, pin: str, offset: float) -> None:
        """Calibrate servo."""
        self._servo_offsets[pin] = offset
        logger.info(f"Servo pin {pin} calibrated with offset: {offset}°")
    
    def _angle_to_duty_cycle(self, angle: float) -> float:
        """Convert angle to PWM duty cycle."""
        # Normalize angle to 0-1 range (assuming -90 to +90 degrees)
        normalized = (angle + 90) / 180.0
        normalized = max(0.0, min(1.0, normalized))
        
        # Calculate pulse width
        pulse_width = self._min_pulse_width + normalized * (
            self._max_pulse_width - self._min_pulse_width)
        
        # Convert to duty cycle percentage
        duty_cycle = (pulse_width / self._pulse_period) * 100
        
        return duty_cycle
    
    def cleanup(self) -> None:
        """Cleanup servo resources."""
        for pin in list(self._servo_angles.keys()):
            self.pwm_controller.stop(pin)
        
        self._servo_angles.clear()
        self._servo_offsets.clear()
        logger.info("Servo resources cleaned up")