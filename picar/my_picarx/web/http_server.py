"""
HTTP server for serving web interface static files.
"""

import asyncio
import logging
import os
from aiohttp import web, WSMsgType
from aiohttp.web import Application, Request, Response, WebSocketResponse
from typing import Optional
from .websocket_server import PicarXWebSocketServer
from .camera_streamer import CameraStreamer

logger = logging.getLogger(__name__)


class PicarXHTTPServer:
    """HTTP server with WebSocket support for Picar-X web interface."""
    
    def __init__(self, picarx_controller, host: str = "0.0.0.0", port: int = 8080):
        """
        Initialize HTTP server.
        
        Args:
            picarx_controller: Picar-X controller instance
            host: Server host
            port: Server port
        """
        self.picarx = picarx_controller
        self.host = host
        self.port = port
        
        # Create WebSocket server and camera streamer
        self.ws_server = PicarXWebSocketServer(picarx_controller)
        self.camera_streamer = CameraStreamer()
        
        # Create aiohttp application
        self.app = self._create_app()
        
        logger.info(f"HTTP server initialized for {host}:{port}")
    
    def _create_app(self) -> Application:
        """Create aiohttp web application."""
        app = web.Application()
        
        # Add routes
        app.router.add_get('/', self._serve_index)
        app.router.add_get('/ws', self._websocket_handler)
        app.router.add_get('/camera', self._camera_websocket_handler)
        app.router.add_static('/', path=os.path.join(os.path.dirname(__file__), 'static'), name='static')
        
        return app
    
    async def _serve_index(self, request: Request) -> Response:
        """Serve main index page."""
        static_dir = os.path.join(os.path.dirname(__file__), 'static')
        index_path = os.path.join(static_dir, 'index.html')
        
        if os.path.exists(index_path):
            with open(index_path, 'r') as f:
                content = f.read()
            return web.Response(text=content, content_type='text/html')
        else:
            return web.Response(text="Index page not found", status=404)
    
    async def _websocket_handler(self, request: Request) -> WebSocketResponse:
        """Handle WebSocket connections for robot control."""
        ws = web.WebSocketResponse()
        await ws.prepare(request)
        
        logger.info(f"WebSocket client connected: {request.remote}")
        
        try:
            # Send welcome message
            await ws.send_str(json.dumps({
                'type': 'welcome',
                'message': 'Connected to Picar-X control WebSocket'
            }))
            
            async for msg in ws:
                if msg.type == WSMsgType.TEXT:
                    await self._process_control_message(ws, msg.data)
                elif msg.type == WSMsgType.ERROR:
                    logger.error(f'WebSocket error: {ws.exception()}')
                    break
                    
        except Exception as e:
            logger.error(f"Error in WebSocket handler: {e}")
        finally:
            logger.info(f"WebSocket client disconnected: {request.remote}")
            # Stop robot when client disconnects
            self.picarx.stop()
        
        return ws
    
    async def _camera_websocket_handler(self, request: Request) -> WebSocketResponse:
        """Handle WebSocket connections for camera streaming."""
        ws = web.WebSocketResponse()
        await ws.prepare(request)
        
        logger.info(f"Camera WebSocket client connected: {request.remote}")
        
        # Add client to camera streamer
        self.camera_streamer.add_client(ws)
        
        try:
            async for msg in ws:
                if msg.type == WSMsgType.TEXT:
                    # Handle camera control messages if needed
                    pass
                elif msg.type == WSMsgType.ERROR:
                    logger.error(f'Camera WebSocket error: {ws.exception()}')
                    break
                    
        except Exception as e:
            logger.error(f"Error in camera WebSocket handler: {e}")
        finally:
            self.camera_streamer.remove_client(ws)
            logger.info(f"Camera WebSocket client disconnected: {request.remote}")
        
        return ws
    
    async def _process_control_message(self, ws: WebSocketResponse, message: str):
        """Process control message from WebSocket client."""
        try:
            data = json.loads(message)
            command = data.get('command')
            
            if command == 'move':
                direction = data.get('direction', 'stop')
                speed = data.get('speed', 50)
                
                if direction == 'forward':
                    self.picarx.forward(speed)
                elif direction == 'backward':
                    self.picarx.backward(speed)
                elif direction == 'stop':
                    self.picarx.stop()
                
                await ws.send_str(json.dumps({
                    'type': 'move_response',
                    'direction': direction,
                    'speed': speed,
                    'success': True
                }))
            
            elif command == 'steering':
                angle = data.get('angle', 0)
                self.picarx.set_steering_angle(angle)
                
                await ws.send_str(json.dumps({
                    'type': 'steering_response',
                    'angle': angle,
                    'success': True
                }))
            
            elif command == 'camera':
                pan = data.get('pan')
                tilt = data.get('tilt')
                
                if pan is not None:
                    self.picarx.set_camera_pan(pan)
                if tilt is not None:
                    self.picarx.set_camera_tilt(tilt)
                
                await ws.send_str(json.dumps({
                    'type': 'camera_response',
                    'pan': pan,
                    'tilt': tilt,
                    'success': True
                }))
            
            elif command == 'status':
                distance = self.picarx.get_distance()
                line_position = self.picarx.get_line_position()
                
                await ws.send_str(json.dumps({
                    'type': 'status_response',
                    'distance': distance,
                    'line_position': line_position,
                    'steering_angle': self.picarx._current_steering_angle
                }))
            
        except json.JSONDecodeError:
            await ws.send_str(json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
        except Exception as e:
            logger.error(f"Error processing control message: {e}")
            await ws.send_str(json.dumps({
                'type': 'error',
                'message': str(e)
            }))
    
    async def start_server(self):
        """Start HTTP server."""
        try:
            # Start camera streaming
            self.camera_streamer.start_streaming()
            
            # Start HTTP server
            runner = web.AppRunner(self.app)
            await runner.setup()
            
            site = web.TCPSite(runner, self.host, self.port)
            await site.start()
            
            logger.info(f"HTTP server started on http://{self.host}:{self.port}")
            
        except Exception as e:
            logger.error(f"Failed to start HTTP server: {e}")
            raise
    
    async def stop_server(self):
        """Stop HTTP server."""
        self.camera_streamer.stop_streaming()
        self.picarx.cleanup()
        logger.info("HTTP server stopped")