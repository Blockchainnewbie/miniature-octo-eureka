import pytest
from unittest.mock import MagicMock

@pytest.fixture
def mock_gpio():
    mock = MagicMock()
    mock.setup = MagicMock()
    mock.write = MagicMock()
    mock.read = MagicMock(return_value=True)
    mock.cleanup = MagicMock()
    return mock

@pytest.fixture
def mock_pwm():
    mock = MagicMock()
    mock.start = MagicMock()
    mock.set_duty_cycle = MagicMock()
    mock.stop = MagicMock()
    mock.cleanup = MagicMock()
    return mock

@pytest.fixture
def mock_adc():
    mock = MagicMock()
    mock.read = MagicMock(return_value=1.23)
    mock.read_raw = MagicMock(return_value=2048)
    mock.cleanup = MagicMock()
    return mock

@pytest.fixture
def mock_servo_controller(mock_pwm):
    from my_robothat.servo.servo_controller import ServoController
    return ServoController(mock_pwm)

@pytest.fixture
def mock_camera(monkeypatch):
    # Patch cv2.VideoCapture to always open and return a dummy frame
    import cv2
    class DummyCapture:
        def isOpened(self): return True
        def read(self): import numpy as np; return True, np.zeros((480,640,3), dtype='uint8')
        def release(self): pass
        def set(self, *args): pass
        def get(self, *args): return 30
    monkeypatch.setattr(cv2, "VideoCapture", lambda *a, **kw: DummyCapture())
    yield