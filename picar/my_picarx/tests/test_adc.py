import pytest
from my_robothat.adc.adc_controller import RaspberryPiADCController

def test_adc_read_and_cleanup(mock_adc, monkeypatch):
    monkeypatch.setattr('my_robothat.adc.adc_controller.RaspberryPiADCController._setup_adc', lambda self: None)
    controller = RaspberryPiADCController()
    controller._ads = mock_adc
    controller._AnalogIn = lambda ads, ch: mock_adc
    controller._is_setup = True

    v = controller.read(1)
    assert v == 1.23

    raw = controller.read_raw(1)
    assert raw == 2048

    controller.cleanup()
    mock_adc.cleanup.assert_called()