"""
Camera streaming module for live video feed.
"""

import asyncio
import cv2
import base64
import json
import logging
from typing import Optional, Set
import threading
import time
from websockets.server import WebSocketServerProtocol

logger = logging.getLogger(__name__)


class CameraStreamer:
    """Camera streamer for live video feed via WebSocket."""
    
    def __init__(self, camera_index: int = 0, width: int = 640, height: int = 480, fps: int = 30):
        """
        Initialize camera streamer.
        
        Args:
            camera_index: Camera device index
            width: Video width
            height: Video height
            fps: Frames per second
        """
        self.camera_index = camera_index
        self.width = width
        self.height = height
        self.fps = fps
        
        self.camera = None
        self.is_streaming = False
        self.clients: Set[WebSocketServerProtocol] = set()
        self.frame_thread = None
        self.current_frame = None
        self.frame_lock = threading.Lock()
        
        logger.info(f"Camera streamer initialized: {width}x{height} @ {fps}fps")
    
    def start_camera(self) -> bool:
        """
        Start camera capture.
        
        Returns:
            True if camera started successfully
        """
        try:
            # Try different camera backends
            backends_to_try = [
                cv2.CAP_V4L2,  # Video4Linux (Raspberry Pi)
                cv2.CAP_GSTREAMER,  # GStreamer
                cv2.CAP_ANY  # Default
            ]
            
            for backend in backends_to_try:
                self.camera = cv2.VideoCapture(self.camera_index, backend)
                if self.camera.isOpened():
                    logger.info(f"Camera opened with backend: {backend}")
                    break
                self.camera.release()
            
            if not self.camera.isOpened():
                # Try with different camera indices
                for i in range(3):
                    self.camera = cv2.VideoCapture(i)
                    if self.camera.isOpened():
                        logger.info(f"Camera opened on index: {i}")
                        self.camera_index = i
                        break
                    self.camera.release()
            
            if not self.camera.isOpened():
                logger.error("Could not open camera")
                return False
            
            # Set camera properties
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
            self.camera.set(cv2.CAP_PROP_FPS, self.fps)
            
            # Verify settings
            actual_width = int(self.camera.get(cv2.CAP_PROP_FRAME_WIDTH))
            actual_height = int(self.camera.get(cv2.CAP_PROP_FRAME_HEIGHT))
            actual_fps = self.camera.get(cv2.CAP_PROP_FPS)
            
            logger.info(f"Camera settings: {actual_width}x{actual_height} @ {actual_fps}fps")
            
            return True
            
        except Exception as e:
            logger.error(f"Error starting camera: {e}")
            return False
    
    def stop_camera(self):
        """Stop camera capture."""
        if self.camera:
            self.camera.release()
            self.camera = None
            logger.info("Camera stopped")
    
    def start_streaming(self):
        """Start video streaming."""
        if not self.start_camera():
            raise RuntimeError("Could not start camera")
        
        self.is_streaming = True
        self.frame_thread = threading.Thread(target=self._capture_frames, daemon=True)
        self.frame_thread.start()
        
        logger.info("Camera streaming started")
    
    def stop_streaming(self):
        """Stop video streaming."""
        self.is_streaming = False
        if self.frame_thread:
            self.frame_thread.join(timeout=2)
        self.stop_camera()
        logger.info("Camera streaming stopped")
    
    def add_client(self, websocket: WebSocketServerProtocol):
        """Add WebSocket client for streaming."""
        self.clients.add(websocket)
        logger.debug(f"Camera client added: {len(self.clients)} total clients")
    
    def remove_client(self, websocket: WebSocketServerProtocol):
        """Remove WebSocket client."""
        self.clients.discard(websocket)
        logger.debug(f"Camera client removed: {len(self.clients)} total clients")
    
    def _capture_frames(self):
        """Capture frames in separate thread."""
        frame_time = 1.0 / self.fps
        last_frame_time = 0
        
        while self.is_streaming and self.camera:
            current_time = time.time()
            
            # Maintain frame rate
            if current_time - last_frame_time < frame_time:
                time.sleep(0.001)
                continue
            
            ret, frame = self.camera.read()
            if not ret:
                logger.warning("Failed to capture frame")
                continue
            
            # Store current frame thread-safely
            with self.frame_lock:
                self.current_frame = frame.copy()
            
            # Broadcast to clients if any are connected
            if self.clients:
                asyncio.create_task(self._broadcast_frame(frame))
            
            last_frame_time = current_time
    
    async def _broadcast_frame(self, frame):
        """Broadcast frame to all WebSocket clients."""
        try:
            # Encode frame as JPEG
            encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 80]
            result, encoded_img = cv2.imencode('.jpg', frame, encode_param)
            
            if not result:
                logger.warning("Failed to encode frame")
                return
            
            # Convert to base64
            img_base64 = base64.b64encode(encoded_img).decode('utf-8')
            
            # Create message
            message = json.dumps({
                'type': 'video_frame',
                'data': img_base64,
                'timestamp': time.time()
            })
            
            # Send to all clients
            disconnected = set()
            for client in self.clients:
                try:
                    await client.send(message)
                except Exception as e:
                    logger.error(f"Error sending frame to client: {e}")
                    disconnected.add(client)
            
            # Remove disconnected clients
            self.clients -= disconnected
            
        except Exception as e:
            logger.error(f"Error broadcasting frame: {e}")
    
    def get_current_frame(self) -> Optional[bytes]:
        """Get current frame as JPEG bytes."""
        with self.frame_lock:
            if self.current_frame is not None:
                encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 80]
                result, encoded_img = cv2.imencode('.jpg', self.current_frame, encode_param)
                if result:
                    return encoded_img.tobytes()
        return None