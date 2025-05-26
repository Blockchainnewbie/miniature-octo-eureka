import pytest
from my_picarx.web.camera_streamer import CameraStreamer

def test_camera_streamer_start_and_frame(mock_camera):
    streamer = CameraStreamer()
    assert streamer.start_camera()
    streamer.is_streaming = True
    streamer.current_frame = None
    # Simulate frame capture
    import numpy as np
    frame = np.zeros((480, 640, 3), dtype='uint8')
    streamer.current_frame = frame
    jpeg = streamer.get_current_frame()
    assert jpeg is not None
    streamer.stop_camera()