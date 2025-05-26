import pytest

def test_servo_set_angle_and_cleanup(mock_servo_controller):
    pin = "2"
    angle = 30
    mock_servo_controller.set_angle(pin, angle)
    assert mock_servo_controller.get_angle(pin) == angle
    mock_servo_controller.calibrate(pin, 5)
    assert mock_servo_controller._servo_offsets[pin] == 5
    mock_servo_controller.cleanup()