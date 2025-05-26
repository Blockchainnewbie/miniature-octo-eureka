"""
WebSocket server for real-time Picar-X control.
"""

import asyncio
import json
import logging
import websockets
from typing import Set, Dict, Any, Optional
from websockets.server import WebSocketServerProtocol
from ..core.picarx_controller import PicarXController

logger = logging.getLogger(__name__)


class PicarXWebSocketServer:
    """WebSocket server for Picar-X remote control."""
    
    def __init__(self, picarx_controller: PicarXController, host: str = "0.0.0.0", port: int = 8765):
        """
        Initialize WebSocket server.
        
        Args:
            picarx_controller: Picar-X controller instance
            host: Server host address
            port: Server port
        """
        self.picarx = picarx_controller
        self.host = host
        self.port = port
        self.clients: Set[WebSocketServerProtocol] = set()
        self.server = None
        
        # Command handlers
        self.command_handlers = {
            'move': self._handle_move_command,
            'steering': self._handle_steering_command,
            'camera': self._handle_camera_command,
            'stop': self._handle_stop_command,
            'status': self._handle_status_command,
            'reset': self._handle_reset_command,
        }
        
        logger.info(f"WebSocket server initialized for {host}:{port}")
    
    async def start_server(self):
        """Start the WebSocket server."""
        try:
            self.server = await websockets.serve(
                self._handle_client,
                self.host,
                self.port,
                ping_interval=20,
                ping_timeout=10
            )
            logger.info(f"WebSocket server started on ws://{self.host}:{self.port}")
            
            # Start status broadcast task
            asyncio.create_task(self._broadcast_status_loop())
            
        except Exception as e:
            logger.error(f"Failed to start WebSocket server: {e}")
            raise
    
    async def stop_server(self):
        """Stop the WebSocket server."""
        if self.server:
            self.server.close()
            await self.server.wait_closed()
            self.picarx.cleanup()
            logger.info("WebSocket server stopped")
    
    async def _handle_client(self, websocket: WebSocketServerProtocol, path: str):
        """Handle new WebSocket client connection."""
        self.clients.add(websocket)
        client_address = websocket.remote_address
        logger.info(f"Client connected: {client_address}")
        
        try:
            # Send welcome message
            await self._send_to_client(websocket, {
                'type': 'welcome',
                'message': 'Connected to Picar-X WebSocket server',
                'timestamp': asyncio.get_event_loop().time()
            })
            
            async for message in websocket:
                await self._process_message(websocket, message)
                
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"Client disconnected: {client_address}")
        except Exception as e:
            logger.error(f"Error handling client {client_address}: {e}")
        finally:
            self.clients.discard(websocket)
            # Stop robot when client disconnects
            self.picarx.stop()
    
    async def _process_message(self, websocket: WebSocketServerProtocol, message: str):
        """Process incoming WebSocket message."""
        try:
            data = json.loads(message)
            command = data.get('command')
            
            if command in self.command_handlers:
                response = await self.command_handlers[command](data)
                await self._send_to_client(websocket, response)
            else:
                await self._send_to_client(websocket, {
                    'type': 'error',
                    'message': f'Unknown command: {command}'
                })
                
        except json.JSONDecodeError:
            await self._send_to_client(websocket, {
                'type': 'error',
                'message': 'Invalid JSON format'
            })
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            await self._send_to_client(websocket, {
                'type': 'error',
                'message': str(e)
            })
    
    async def _handle_move_command(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle movement command."""
        direction = data.get('direction', 'stop')
        speed = data.get('speed', 50)
        
        try:
            if direction == 'forward':
                self.picarx.forward(speed)
            elif direction == 'backward':
                self.picarx.backward(speed)
            elif direction == 'stop':
                self.picarx.stop()
            else:
                return {
                    'type': 'error',
                    'message': f'Invalid direction: {direction}'
                }
            
            return {
                'type': 'move_response',
                'direction': direction,
                'speed': speed,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"Error in move command: {e}")
            return {
                'type': 'error',
                'message': str(e)
            }
    
    async def _handle_steering_command(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle steering command."""
        angle = data.get('angle', 0)
        
        try:
            self.picarx.set_steering_angle(angle)
            
            return {
                'type': 'steering_response',
                'angle': angle,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"Error in steering command: {e}")
            return {
                'type': 'error',
                'message': str(e)
            }
    
    async def _handle_camera_command(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle camera movement command."""
        pan = data.get('pan')
        tilt = data.get('tilt')
        
        try:
            if pan is not None:
                self.picarx.set_camera_pan(pan)
            if tilt is not None:
                self.picarx.set_camera_tilt(tilt)
            
            return {
                'type': 'camera_response',
                'pan': pan,
                'tilt': tilt,
                'success': True
            }
            
        except Exception as e:
            logger.error(f"Error in camera command: {e}")
            return {
                'type': 'error',
                'message': str(e)
            }
    
    async def _handle_stop_command(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle stop command."""
        try:
            self.picarx.stop()
            return {
                'type': 'stop_response',
                'success': True
            }
        except Exception as e:
            logger.error(f"Error in stop command: {e}")
            return {
                'type': 'error',
                'message': str(e)
            }
    
    async def _handle_status_command(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle status request command."""
        try:
            distance = self.picarx.get_distance()
            line_position = self.picarx.get_line_position()
            
            return {
                'type': 'status_response',
                'distance': distance,
                'line_position': line_position,
                'steering_angle': self.picarx._current_steering_angle,
                'timestamp': asyncio.get_event_loop().time()
            }
        except Exception as e:
            logger.error(f"Error getting status: {e}")
            return {
                'type': 'error',
                'message': str(e)
            }
    
    async def _handle_reset_command(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle reset command."""
        try:
            self.picarx.reset()
            return {
                'type': 'reset_response',
                'success': True
            }
        except Exception as e:
            logger.error(f"Error in reset command: {e}")
            return {
                'type': 'error',
                'message': str(e)
            }
    
    async def _send_to_client(self, websocket: WebSocketServerProtocol, data: Dict[str, Any]):
        """Send data to specific client."""
        try:
            message = json.dumps(data)
            await websocket.send(message)
        except Exception as e:
            logger.error(f"Error sending message to client: {e}")
    
    async def _broadcast_to_all(self, data: Dict[str, Any]):
        """Broadcast data to all connected clients."""
        if self.clients:
            message = json.dumps(data)
            disconnected = set()
            
            for client in self.clients:
                try:
                    await client.send(message)
                except websockets.exceptions.ConnectionClosed:
                    disconnected.add(client)
                except Exception as e:
                    logger.error(f"Error broadcasting to client: {e}")
                    disconnected.add(client)
            
            # Remove disconnected clients
            self.clients -= disconnected
    
    async def _broadcast_status_loop(self):
        """Continuously broadcast robot status to all clients."""
        while True:
            try:
                if self.clients:
                    status_data = {
                        'type': 'status_broadcast',
                        'distance': self.picarx.get_distance(),
                        'line_position': self.picarx.get_line_position(),
                        'steering_angle': self.picarx._current_steering_angle,
                        'timestamp': asyncio.get_event_loop().time()
                    }
                    await self._broadcast_to_all(status_data)
                
                await asyncio.sleep(0.1)  # 10Hz update rate
                
            except Exception as e:
                logger.error(f"Error in status broadcast loop: {e}")
                await asyncio.sleep(1)