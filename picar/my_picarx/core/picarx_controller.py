"""
Main Picar-X controller implementation.
"""

import logging
import time
from typing import Optional, List
from my_robothat import (
    RaspberryPiGPIOController,
    RaspberryPiPWMController,
    RaspberryPiADCController,
    ServoController,
    UltrasonicModule,
    GrayscaleModule
)
from ..motors.dc_motor import DCMotor
from ..motors.servo_motor import ServoMotor

logger = logging.getLogger(__name__)


class PicarXController:
    """Main controller for Picar-X robot."""
    
    # Hardware configuration constants
    DEFAULT_LEFT_MOTOR_PWM_PIN = "13"
    DEFAULT_LEFT_MOTOR_DIR_PIN = "4"
    DEFAULT_RIGHT_MOTOR_PWM_PIN = "12"
    DEFAULT_RIGHT_MOTOR_DIR_PIN = "5"
    
    DEFAULT_STEERING_SERVO_PIN = "2"
    DEFAULT_CAMERA_PAN_SERVO_PIN = "0"
    DEFAULT_CAMERA_TILT_SERVO_PIN = "1"
    
    DEFAULT_ULTRASONIC_TRIG_PIN = "23"
    DEFAULT_ULTRASONIC_ECHO_PIN = "24"
    
    DEFAULT_GRAYSCALE_CHANNELS = [0, 1, 2]
    
    def __init__(self, 
                 left_motor_pins: Optional[List[str]] = None,
                 right_motor_pins: Optional[List[str]] = None,
                 servo_pins: Optional[List[str]] = None,
                 ultrasonic_pins: Optional[List[str]] = None,
                 grayscale_channels: Optional[List[int]] = None):
        """
        Initialize Picar-X controller.
        
        Args:
            left_motor_pins: [PWM pin, direction pin] for left motor
            right_motor_pins: [PWM pin, direction pin] for right motor
            servo_pins: [steering, camera_pan, camera_tilt] pins
            ultrasonic_pins: [trigger pin, echo pin]
            grayscale_channels: ADC channels for grayscale sensors
        """
        logger.info("Initializing Picar-X controller...")
        
        # Initialize hardware controllers
        self.gpio = RaspberryPiGPIOController()
        self.pwm = RaspberryPiPWMController()
        self.adc = RaspberryPiADCController()
        self.servo_controller = ServoController(self.pwm)
        
        # Set default pin configurations
        left_pins = left_motor_pins or [self.DEFAULT_LEFT_MOTOR_PWM_PIN, 
                                       self.DEFAULT_LEFT_MOTOR_DIR_PIN]
        right_pins = right_motor_pins or [self.DEFAULT_RIGHT_MOTOR_PWM_PIN, 
                                         self.DEFAULT_RIGHT_MOTOR_DIR_PIN]
        servo_pins = servo_pins or [self.DEFAULT_STEERING_SERVO_PIN,
                                   self.DEFAULT_CAMERA_PAN_SERVO_PIN,
                                   self.DEFAULT_CAMERA_TILT_SERVO_PIN]
        ultrasonic_pins = ultrasonic_pins or [self.DEFAULT_ULTRASONIC_TRIG_PIN,
                                             self.DEFAULT_ULTRASONIC_ECHO_PIN]
        grayscale_channels = grayscale_channels or self.DEFAULT_GRAYSCALE_CHANNELS
        
        # Initialize motors
        self.left_motor = DCMotor(self.pwm, self.gpio, left_pins[0], left_pins[1])
        self.right_motor = DCMotor(self.pwm, self.gpio, right_pins[0], right_pins[1])
        
        # Initialize servos
        self.steering_servo = ServoMotor(self.servo_controller, servo_pins[0], 
                                        min_angle=-30, max_angle=30)
        self.camera_pan_servo = ServoMotor(self.servo_controller, servo_pins[1],
                                          min_angle=-90, max_angle=90)
        self.camera_tilt_servo = ServoMotor(self.servo_controller, servo_pins[2],
                                           min_angle=-35, max_angle=65)
        
        # Initialize sensors
        self.ultrasonic = UltrasonicModule(self.gpio, ultrasonic_pins[0], ultrasonic_pins[1])
        self.grayscale = GrayscaleModule(self.adc, grayscale_channels)
        
        # State variables
        self._current_steering_angle = 0.0
        
        logger.info("Picar-X controller initialized successfully")
    
    def forward(self, speed: int) -> None:
        """
        Move forward with differential steering compensation.
        
        Args:
            speed: Speed percentage (0-100)
        """
        if self._current_steering_angle != 0:
            # Apply differential steering
            abs_angle = abs(self._current_steering_angle)
            power_scale = (100 - abs_angle) / 100.0
            
            if self._current_steering_angle > 0:  # Right turn
                self.left_motor.set_speed(speed * power_scale)
                self.right_motor.set_speed(-speed)
            else:  # Left turn
                self.left_motor.set_speed(speed)
                self.right_motor.set_speed(-speed * power_scale)
        else:
            # Straight forward
            self.left_motor.set_speed(speed)
            self.right_motor.set_speed(-speed)
        
        logger.debug(f"Moving forward at speed {speed} with steering {self._current_steering_angle}")
    
    def backward(self, speed: int) -> None:
        """
        Move backward with differential steering compensation.
        
        Args:
            speed: Speed percentage (0-100)
        """
        if self._current_steering_angle != 0:
            # Apply differential steering (reversed)
            abs_angle = abs(self._current_steering_angle)
            power_scale = (100 - abs_angle) / 100.0
            
            if self._current_steering_angle > 0:  # Right turn
                self.left_motor.set_speed(-speed)
                self.right_motor.set_speed(speed * power_scale)
            else:  # Left turn
                self.left_motor.set_speed(-speed * power_scale)
                self.right_motor.set_speed(speed)
        else:
            # Straight backward
            self.left_motor.set_speed(-speed)
            self.right_motor.set_speed(speed)
        
        logger.debug(f"Moving backward at speed {speed} with steering {self._current_steering_angle}")
    
    def stop(self) -> None:
        """Stop all motors."""
        self.left_motor.stop()
        self.right_motor.stop()
        logger.debug("Robot stopped")
    
    def set_steering_angle(self, angle: float) -> None:
        """
        Set steering angle.
        
        Args:
            angle: Steering angle in degrees (-30 to 30)
        """
        self.steering_servo.set_angle(angle)
        self._current_steering_angle = angle
        logger.debug(f"Steering angle set to {angle}°")
    
    def set_camera_pan(self, angle: float) -> None:
        """Set camera pan angle."""
        self.camera_pan_servo.set_angle(angle)
        logger.debug(f"Camera pan set to {angle}°")
    
    def set_camera_tilt(self, angle: float) -> None:
        """Set camera tilt angle."""
        self.camera_tilt_servo.set_angle(angle)
        logger.debug(f"Camera tilt set to {angle}°")
    
    def get_distance(self) -> Optional[float]:
        """Get distance from ultrasonic sensor."""
        return self.ultrasonic.read_distance()
    
    def get_line_position(self) -> Optional[float]:
        """Get line position from grayscale sensors."""
        return self.grayscale.get_line_position()
    
    def reset(self) -> None:
        """Reset robot to default state."""
        self.stop()
        self.set_steering_angle(0)
        self.set_camera_pan(0)
        self.set_camera_tilt(0)
        logger.info("Robot reset to default state")
    
    def cleanup(self) -> None:
        """Cleanup all resources."""
        self.reset()
        self.servo_controller.cleanup()
        self.pwm.cleanup()
        self.gpio.cleanup()
        self.adc.cleanup()
        logger.info("All resources cleaned up")