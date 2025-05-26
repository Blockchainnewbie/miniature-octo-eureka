"""
Input validation utilities.
"""

from typing import Union


def validate_speed_range(speed: Union[int, float], 
                        min_speed: int = -100, 
                        max_speed: int = 100) -> None:
    """
    Validate speed is within acceptable range.
    
    Args:
        speed: Speed value to validate
        min_speed: Minimum allowed speed
        max_speed: Maximum allowed speed
        
    Raises:
        ValueError: If speed is outside valid range
        TypeError: If speed is not numeric
    """
    if not isinstance(speed, (int, float)):
        raise TypeError(f"Speed must be numeric, got {type(speed)}")
    
    if not min_speed <= speed <= max_speed:
        raise ValueError(f"Speed {speed} must be between {min_speed} and {max_speed}")


def validate_angle_range(angle: Union[int, float], 
                        min_angle: float = -180, 
                        max_angle: float = 180) -> None:
    """
    Validate angle is within acceptable range.
    
    Args:
        angle: Angle value to validate
        min_angle: Minimum allowed angle
        max_angle: Maximum allowed angle
        
    Raises:
        ValueError: If angle is outside valid range
        TypeError: If angle is not numeric
    """
    if not isinstance(angle, (int, float)):
        raise TypeError(f"Angle must be numeric, got {type(angle)}")
    
    if not min_angle <= angle <= max_angle:
        raise ValueError(f"Angle {angle} must be between {min_angle} and {max_angle}")


def constrain(value: Union[int, float], 
              min_val: Union[int, float], 
              max_val: Union[int, float]) -> Union[int, float]:
    """
    Constrain value to be within a range.
    
    Args:
        value: Value to constrain
        min_val: Minimum value
        max_val: Maximum value
        
    Returns:
        Constrained value
    """
    return max(min_val, min(max_val, value))