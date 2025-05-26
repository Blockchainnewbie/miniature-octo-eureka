import pytest
from my_robothat.gpio.gpio_controller import RaspberryPiGPIOController

def test_gpio_setup_and_write_read(mock_gpio, monkeypatch):
    monkeypatch.setattr('my_robothat.gpio.gpio_controller.RaspberryPiGPIOController._setup_gpio', lambda self: None)
    controller = RaspberryPiGPIOController()
    controller._GPIO = mock_gpio
    controller._is_setup = True

    controller.setup("17", "out")
    controller.write("17", True)
    controller.read("17")
    controller.cleanup()

    mock_gpio.setup.assert_called_with(17, mock_gpio.OUT)
    mock_gpio.write.assert_called()
    mock_gpio.read.assert_called()
    mock_gpio.cleanup.assert_called_once()