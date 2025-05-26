"""
Constants for Picar-X configuration.
"""


class PicarXConstants:
    """Constants for Picar-X hardware configuration."""
    
    # Motor speed limits
    MIN_SPEED = -100
    MAX_SPEED = 100
    
    # Servo angle limits
    STEERING_MIN_ANGLE = -30
    STEERING_MAX_ANGLE = 30
    
    CAMERA_PAN_MIN_ANGLE = -90
    CAMERA_PAN_MAX_ANGLE = 90
    
    CAMERA_TILT_MIN_ANGLE = -35
    CAMERA_TILT_MAX_ANGLE = 65
    
    # PWM settings
    MOTOR_PWM_FREQUENCY = 1000.0  # Hz
    SERVO_PWM_FREQUENCY = 50.0    # Hz
    
    # Default pin assignments (can be overridden)
    DEFAULT_LEFT_MOTOR_PWM_PIN = "P13"
    DEFAULT_LEFT_MOTOR_DIR_PIN = "D4"
    DEFAULT_RIGHT_MOTOR_PWM_PIN = "P12"
    DEFAULT_RIGHT_MOTOR_DIR_PIN = "D5"
    
    DEFAULT_STEERING_SERVO_PIN = "P2"
    DEFAULT_CAMERA_PAN_SERVO_PIN = "P0"
    DEFAULT_CAMERA_TILT_SERVO_PIN = "P1"
    
    DEFAULT_ULTRASONIC_TRIG_PIN = "D2"
    DEFAULT_ULTRASONIC_ECHO_PIN = "D3"
    
    DEFAULT_GRAYSCALE_PINS = ["A0", "A1", "A2"]
    
    # Configuration file path
    DEFAULT_CONFIG_PATH = "/opt/picar-x/picar-x.conf"