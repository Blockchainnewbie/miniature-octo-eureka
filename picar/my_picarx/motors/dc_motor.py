"""
DC Motor implementation.
"""

from typing import Optional
import logging
from ..interfaces.motor_interface import MotorInterface
from ..hardware.gpio_controller import GPIOController
from ..hardware.pwm_controller import PWMController
from ..utils.validation import validate_speed_range

logger = logging.getLogger(__name__)


class DCMotor(MotorInterface):
    """DC Motor controller implementation."""
    
    def __init__(self, pwm_pin: str, direction_pin: str, 
                 frequency: float = 1000.0):
        """
        Initialize DC motor.
        
        Args:
            pwm_pin: PWM control pin
            direction_pin: Direction control pin
            frequency: PWM frequency in Hz
        """
        self.pwm_controller = PWMController(pwm_pin, frequency)
        self.direction_controller = GPIOController(direction_pin)
        self._current_speed = 0
        self._calibration_offset = 0
        
        logger.info(f"DC Motor initialized on PWM: {pwm_pin}, DIR: {direction_pin}")
    
    def set_speed(self, speed: int) -> None:
        """
        Set motor speed.
        
        Args:
            speed: Speed value between -100 and 100
        """
        validate_speed_range(speed)
        
        # Apply calibration
        adjusted_speed = speed + self._calibration_offset
        adjusted_speed = max(-100, min(100, adjusted_speed))
        
        # Set direction
        if adjusted_speed >= 0:
            self.direction_controller.set_low()  # Forward
        else:
            self.direction_controller.set_high()  # Backward
        
        # Set PWM duty cycle
        duty_cycle = abs(adjusted_speed)
        self.pwm_controller.set_duty_cycle(duty_cycle)
        
        if duty_cycle > 0:
            self.pwm_controller.start()
        else:
            self.pwm_controller.stop()
        
        self._current_speed = speed
        logger.debug(f"Motor speed set to {speed} (adjusted: {adjusted_speed})")
    
    def stop(self) -> None:
        """Stop the motor immediately."""
        self.pwm_controller.stop()
        self._current_speed = 0
        logger.debug("Motor stopped")
    
    def is_running(self) -> bool:
        """Check if motor is currently running."""
        return self.pwm_controller.is_running
    
    def calibrate(self, offset: int) -> None:
        """
        Calibrate motor speed.
        
        Args:
            offset: Speed offset for calibration (-100 to 100)
        """
        if not -100 <= offset <= 100:
            raise ValueError("Calibration offset must be between -100 and 100")
        
        self._calibration_offset = offset
        logger.info(f"Motor calibrated with offset: {offset}")
    
    @property
    def current_speed(self) -> int:
        """Get current motor speed."""
        return self._current_speed
    
    def cleanup(self) -> None:
        """Cleanup motor resources."""
        self.stop()
        self.pwm_controller.cleanup()
        self.direction_controller.cleanup()
        logger.info("Motor resources cleaned up")