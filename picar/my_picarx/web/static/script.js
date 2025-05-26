/**
 * Picar-X Remote Control Web Interface
 * Modern WebSocket-based control system
 */

class PicarXController {
    constructor() {
        this.ws = null;
        this.cameraWs = null;
        this.isConnected = false;
        this.currentSpeed = 50;
        this.currentSteering = 0;
        this.cameraPan = 0;
        this.cameraTilt = 0;
        
        this.reconnectInterval = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.connect();
        this.connectCamera();
        this.addLog('System initialized', 'info');
    }
    
    setupEventListeners() {
        // Movement controls
        document.getElementById('btn-forward').addEventListener('mousedown', () => this.startMovement('forward'));
        document.getElementById('btn-backward').addEventListener('mousedown', () => this.startMovement('backward'));
        document.getElementById('btn-left').addEventListener('mousedown', () => this.startTurn('left'));
        document.getElementById('btn-right').addEventListener('mousedown', () => this.startTurn('right'));
        document.getElementById('btn-stop').addEventListener('click', () => this.stopMovement());
        
        // Stop movement on mouse up
        ['btn-forward', 'btn-backward', 'btn-left', 'btn-right'].forEach(id => {
            document.getElementById(id).addEventListener('mouseup', () => this.stopMovement());
            document.getElementById(id).addEventListener('mouseleave', () => this.stopMovement());
        });
        
        // Speed control
        document.getElementById('speed-slider').addEventListener('input', (e) => {
            this.currentSpeed = parseInt(e.target.value);
            document.getElementById('speed-value').textContent = this.currentSpeed;
            document.getElementById('status-speed').textContent = this.currentSpeed + '%';
        });
        
        // Steering control
        document.getElementById('steering-slider').addEventListener('input', (e) => {
            this.currentSteering = parseInt(e.target.value);
            document.getElementById('steering-value').textContent = this.currentSteering;
            this.sendSteering(this.currentSteering);
        });
        
        // Camera controls
        this.setupCameraJoystick();
        document.getElementById('camera-center').addEventListener('click', () => this.centerCamera());
        
        // Quick actions
        document.getElementById('btn-reset').addEventListener('click', () => this.resetRobot());
        document.getElementById('btn-emergency-stop').addEventListener('click', () => this.emergencyStop());
        
        // Logs
        document.getElementById('clear-logs').addEventListener('click', () => this.clearLogs());
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Prevent context menu on buttons
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('contextmenu', (e) => e.preventDefault());
        });
    }
    
    setupCameraJoystick() {
        const joystick = document.getElementById('camera-joystick');
        const track = joystick.parentElement;
        let isDragging = false;
        let startX, startY;
        
        const moveJoystick = (clientX, clientY) => {
            const rect = track.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const radius = Math.min(centerX, centerY) - 15; // Account for joystick size
            
            let x = clientX - rect.left - centerX;
            let y = clientY - rect.top - centerY;
            
            // Constrain to circle
            const distance = Math.sqrt(x * x + y * y);
            if (distance > radius) {
                x = (x / distance) * radius;
                y = (y / distance) * radius;
            }
            
            joystick.style.transform = `translate(${x}px, ${y}px)`;
            
            // Convert to camera angles
            const panAngle = (x / radius) * 90; // -90 to 90 degrees
            const tiltAngle = -(y / radius) * 50; // -50 to 50 degrees (inverted)
            
            this.sendCameraMove(panAngle, tiltAngle);
        };
        
        const resetJoystick = () => {
            joystick.style.transform = 'translate(0px, 0px)';
            this.sendCameraMove(0, 0);
        };
        
        // Mouse events
        joystick.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                moveJoystick(e.clientX, e.clientY);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                resetJoystick();
            }
        });
        
        // Touch events for mobile
        joystick.addEventListener('touchstart', (e) => {
            isDragging = true;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            e.preventDefault();
        });
        
        document.addEventListener('touchmove', (e) => {
            if (isDragging) {
                const touch = e.touches[0];
                moveJoystick(touch.clientX, touch.clientY);
                e.preventDefault();
            }
        });
        
        document.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                resetJoystick();
            }
        });
    }
    
    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = window.location.port || '8080';
        
        try {
            this.ws = new WebSocket(`${protocol}//${host}:${port}/ws`);
            
            this.ws.onopen = () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateConnectionStatus(true);
                this.addLog('Connected to robot', 'success');
                
                if (this.reconnectInterval) {
                    clearInterval(this.reconnectInterval);
                    this.reconnectInterval = null;
                }
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (e) {
                    console.error('Failed to parse message:', e);
                }
            };
            
            this.ws.onclose = () => {
                this.isConnected = false;
                this.updateConnectionStatus(false);
                this.addLog('Disconnected from robot', 'warning');
                this.scheduleReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.addLog('Connection error', 'error');
            };
            
        } catch (error) {
            console.error('Failed to connect:', error);
            this.addLog('Failed to connect', 'error');
            this.scheduleReconnect();
        }
    }
    
    connectCamera() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = window.location.port || '8080';
        
        try {
            this.cameraWs = new WebSocket(`${protocol}//${host}:${port}/camera`);
            
            this.cameraWs.onopen = () => {
                this.updateCameraStatus(true);
                this.addLog('Camera connected', 'success');
            };
            
            this.cameraWs.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'video_frame') {
                        this.updateCameraFeed(data.data);
                    }
                } catch (e) {
                    console.error('Failed to parse camera message:', e);
                }
            };
            
            this.cameraWs.onclose = () => {
                this.updateCameraStatus(false);
                this.addLog('Camera disconnected', 'warning');
                
                // Reconnect camera after delay
                setTimeout(() => this.connectCamera(), 3000);
            };
            
            this.cameraWs.onerror = (error) => {
                console.error('Camera WebSocket error:', error);
                this.addLog('Camera error', 'error');
            };
            
        } catch (error) {
            console.error('Failed to connect camera:', error);
            this.addLog('Failed to connect camera', 'error');
        }
    }
    
    scheduleReconnect() {
        if (this.reconnectInterval || this.reconnectAttempts >= this.maxReconnectAttempts) {
            return;
        }
        
        this.reconnectInterval = setTimeout(() => {
            this.reconnectAttempts++;
            this.addLog(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'info');
            this.connect();
            this.reconnectInterval = null;
        }, 3000);
    }
    
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connection-status');
        if (connected) {
            statusElement.textContent = '🟢 Connected';
            statusElement.className = 'status-indicator connected';
        } else {
            statusElement.textContent = '🔴 Disconnected';
            statusElement.className = 'status-indicator disconnected';
        }
    }
    
    updateCameraStatus(connected) {
        const statusElement = document.getElementById('camera-status');
        if (connected) {
            statusElement.textContent = '📷 Camera On';
            statusElement.className = 'status-indicator connected';
        } else {
            statusElement.textContent = '📷 Camera Off';
            statusElement.className = 'status-indicator disconnected';
        }
    }
    
    updateCameraFeed(base64Data) {
        const img = document.getElementById('camera-feed');
        img.src = `data:image/jpeg;base64,${base64Data}`;
    }
    
    handleMessage(data) {
        switch (data.type) {
            case 'welcome':
                this.addLog(data.message, 'info');
                break;
                
            case 'status_broadcast':
                this.updateStatus(data);
                break;
                
            case 'move_response':
            case 'steering_response':
            case 'camera_response':
                // Command acknowledged
                break;
                
            case 'error':
                this.addLog(`Error: ${data.message}`, 'error');
                break;
                
            default:
                console.log('Unknown message type:', data.type);
        }
    }
    
    updateStatus(data) {
        if (data.distance !== null) {
            document.getElementById('distance-value').textContent = data.distance.toFixed(1);
            document.getElementById('status-distance').textContent = data.distance.toFixed(1) + ' cm';
        } else {
            document.getElementById('distance-value').textContent = '--';
            document.getElementById('status-distance').textContent = '-- cm';
        }
        
        if (data.line_position !== null) {
            document.getElementById('line-position').textContent = data.line_position.toFixed(2);
            document.getElementById('status-line').textContent = data.line_position.toFixed(2);
        } else {
            document.getElementById('line-position').textContent = '--';
            document.getElementById('status-line').textContent = '--';
        }
        
        if (data.steering_angle !== undefined) {
            document.getElementById('status-steering').textContent = data.steering_angle + '°';
        }
    }
    
    sendCommand(command, data = {}) {
        if (!this.isConnected || !this.ws) {
            this.addLog('Not connected to robot', 'warning');
            return;
        }
        
        const message = {
            command: command,
            ...data
        };
        
        try {
            this.ws.send(JSON.stringify(message));
        } catch (error) {
            console.error('Failed to send command:', error);
            this.addLog('Failed to send command', 'error');
        }
    }
    
    startMovement(direction) {
        this.sendCommand('move', {
            direction: direction,
            speed: this.currentSpeed
        });
        this.addLog(`Moving ${direction} at ${this.currentSpeed}%`, 'info');
    }
    
    startTurn(direction) {
        const angle = direction === 'left' ? -20 : 20;
        this.sendSteering(angle);
    }
    
    stopMovement() {
        this.sendCommand('move', { direction: 'stop' });
        this.addLog('Movement stopped',