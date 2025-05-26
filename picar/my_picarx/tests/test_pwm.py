import pytest
from my_robothat.pwm.pwm_controller import RaspberryPiPWMController

def test_pwm_start_set_stop_cleanup(mock_pwm, monkeypatch):
    monkeypatch.setattr('my_robothat.pwm.pwm_controller.RaspberryPiPWMController._setup_pwm', lambda self: None)
    controller = RaspberryPiPWMController()
    controller._GPIO = mock_pwm
    controller._is_setup = True

    pin = "18"
    freq = 50
    controller.start(pin, freq)
    controller._pwm_instances[pin] = mock_pwm
    controller.set_duty_cycle(pin, 10)
    controller.stop(pin)
    controller.cleanup()

    mock_pwm.setup.assert_called_with(int(pin), mock_pwm.OUT)
    mock_pwm.PWM.assert_called_with(int(pin), freq)
    mock_pwm.set_duty_cycle.assert_called()
    mock_pwm.stop.assert_called()
    mock_pwm.cleanup.assert_called_once()