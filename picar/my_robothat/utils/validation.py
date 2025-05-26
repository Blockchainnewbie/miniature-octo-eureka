"""
Validation utility functions.
"""

import re
from typing import Union, Any


def validate_pin(pin: str) -> None:
    """
    Validate pin identifier.
    
    Args:
        pin: Pin identifier to validate
        
    Raises:
        ValueError: If pin format is invalid
    """
    if not isinstance(pin, str):
        raise ValueError("Pin must be a string")
    
    if not re.match(r'^\d+$', pin):
        raise ValueError("Pin must be a numeric string")


def validate_range(value: Union[int, float], 
                  min_val: Union[int, float], 
                  max_val: Union[int, float], 
                  name: str = "Value") -> None:
    """
    Validate value is within specified range.
    
    Args:
        value: Value to validate
        min_val: Minimum allowed value
        max_val: Maximum allowed value
        name: Name of the value for error messages
        
    Raises:
        ValueError: If value is outside valid range
        TypeError: If value is not numeric
    """
    if not isinstance(value, (int, float)):
        raise TypeError(f"{name} must be numeric, got {type(value)}")
    
    if not min_val <= value <= max_val:
        raise ValueError(f"{name} {value} must be between {min_val} and {max_val}")


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