"""
Servo Motor implementation.
"""

from typing import Optional
import logging
from ..interfaces.actuator_interface import ActuatorInterface
from ..hardware.pwm_controller import PWMController
from ..utils.validation import validate_angle_range

logger = logging.getLogger(__name__)


class ServoMotor(ActuatorInterface):
    """Servo motor controller implementation."""
    
    def __init__(self, pwm_pin: str, min_angle: float = -90, 
                 max_angle: float = 90, frequency: float = 50.0):
        """
        Initialize servo motor.
        
        Args:
            pwm_pin: PWM control pin
            min_angle: Minimum servo angle
            max_angle: Maximum servo angle
            frequency: PWM frequency (typically 50Hz for servos)
        """
        self.pwm_controller = PWMController(pwm_pin, frequency)
        self.min_angle = min_angle
        self.max_angle = max_angle
        self._current_position = 0.0
        self._calibration_offset = 0.0
        
        # Servo timing constants (may need adjustment for different servos)
        self.min_pulse_width = 1.0  # ms
        self.max_pulse_width = 2.0  # ms
        self.pulse_period = 20.0    # ms (50Hz)
        
        logger.info(f"Servo initialized on pin {pwm_pin} "
                   f"({min_angle}° to {max_angle}°)")
    
    def set_position(self, angle: float) -> None:
        """
        Set servo position.
        
        Args:
            angle: Target angle in degrees
        """
        validate_angle_range(angle, self.min_angle, self.max_angle)
        
        # Apply calibration
        adjusted_angle = angle + self._calibration_offset
        adjusted_angle = max(self.min_angle, min(self.max_angle, adjusted_angle))
        
        # Convert angle to duty cycle
        duty_cycle = self._angle_to_duty_cycle(adjusted_angle)
        self.pwm_controller.set_duty_cycle(duty_cycle)
        self.pwm_controller.start()
        
        self._current_position = angle
        logger.debug(f"Servo position set to {angle}° (adjusted: {adjusted_angle}°)")
    
    def get_position(self) -> float:
        """Get current servo position."""
        return self._current_position
    
    def calibrate(self, offset: float = 0.0) -> None:
        """
        Calibrate servo position.
        
        Args:
            offset: Angular offset for calibration
        """
        self._calibration_offset = offset
        logger.info(f"Servo calibrated with offset: {offset}°")
    
    def _angle_to_duty_cycle(self, angle: float) -> float:
        """
        Convert angle to PWM duty cycle.
        
        Args:
            angle: Angle in degrees
            
        Returns:
            Duty cycle percentage
        """
        # Normalize angle to 0-1 range
        normalized = (angle - self.min_angle) / (self.max_angle - self.min_angle)
        
        # Calculate pulse width
        pulse_width = self.min_pulse_width + normalized * (
            self.max_pulse_width - self.min_pulse_width)
        
        # Convert to duty cycle percentage
        duty_cycle = (pulse_width / self.pulse_period) * 100
        
        return duty_cycle
    
    def cleanup(self) -> None:
        """Cleanup servo resources."""
        self.pwm_controller.cleanup()
        logger.info("Servo resources cleaned up")