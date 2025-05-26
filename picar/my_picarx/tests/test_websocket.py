import pytest
from unittest.mock import MagicMock, AsyncMock
import asyncio
from my_picarx.web.websocket_server import PicarXWebSocketServer

@pytest.mark.asyncio
async def test_websocket_move_command(monkeypatch):
    mock_picarx = MagicMock()
    ws_server = PicarXWebSocketServer(mock_picarx)
    ws = AsyncMock()
    data = {'command': 'move', 'direction': 'forward', 'speed': 42}
    await ws_server._process_message(ws, '{"command":"move","direction":"forward","speed":42}')
    mock_picarx.forward.assert_called_with(42)
    ws.send.assert_called()