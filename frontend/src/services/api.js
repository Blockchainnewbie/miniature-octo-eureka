/**
 * API Service - Backend-Kommunikation für Navaro System
 * Verwaltet alle HTTP-Anfragen an das Flask-Backend
 */

import axios from 'axios';

// API-Basis-Konfiguration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const API_PREFIX = '/api';

// Axios-Instanz erstellen
const apiClient = axios.create({
    baseURL: `${API_BASE_URL}${API_PREFIX}`,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request-Interceptor für JWT-Token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('navaro_session_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response-Interceptor für Fehlerbehandlung
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - Session abgelaufen
            localStorage.removeItem('navaro_session_token');
            localStorage.removeItem('navaro_session_expiry');
            localStorage.removeItem('navaro_user_data');
            
            // Weiterleitung zum Login nur wenn nicht bereits auf Login-Seite
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        }
        return Promise.reject(error);
    }
);

// API-Service-Objekt
const apiService = {
    
    /**
     * Authentifizierung
     */
    auth: {
        /**
         * Benutzeranmeldung
         * @param {string} username - Benutzername
         * @param {string} password - Passwort
         * @returns {Promise} API-Antwort mit Token und Benutzerdaten
         */
        async login(username, password) {
            try {
                const response = await apiClient.post('/auth/login', {
                    username: username.trim(),
                    password: password
                });
                
                return {
                    success: true,
                    data: response.data
                };
            } catch (error) {
                console.error('❌ Login-Fehler:', error);
                
                let message = 'Verbindungsfehler. Bitte versuchen Sie es erneut.';
                
                if (error.response?.data?.message) {
                    message = error.response.data.message;
                } else if (error.response?.status === 401) {
                    message = 'Ungültige Anmeldedaten. Bitte überprüfen Sie Benutzername und Passwort.';
                } else if (error.response?.status === 429) {
                    message = 'Zu viele Anmeldeversuche. Bitte warten Sie einen Moment.';
                }
                
                return {
                    success: false,
                    message: message
                };
            }
        },

        /**
         * Token erneuern
         * @param {string} refreshToken - Refresh-Token
         * @returns {Promise} Neue Token-Daten
         */
        async refreshToken(refreshToken) {
            try {
                const response = await apiClient.post('/auth/refresh', {
                    refresh_token: refreshToken
                });
                
                return {
                    success: true,
                    data: response.data
                };
            } catch (error) {
                console.error('❌ Token-Refresh-Fehler:', error);
                return {
                    success: false,
                    message: 'Token konnte nicht erneuert werden.'
                };
            }
        },

        /**
         * Benutzer abmelden
         * @returns {Promise} Logout-Bestätigung
         */
        async logout() {
            try {
                await apiClient.post('/auth/logout');
                return { success: true };
            } catch (error) {
                console.error('❌ Logout-Fehler:', error);
                // Auch bei Fehler lokale Session löschen
                return { success: true };
            }
        }
    },

    /**
     * Sensordaten
     */
    sensors: {
        /**
         * Aktuelle Sensordaten abrufen
         * @returns {Promise} Sensordaten
         */
        async getCurrentData() {
            try {
                const response = await apiClient.get('/sensors/data');
                return {
                    success: true,
                    data: response.data
                };
            } catch (error) {
                console.error('❌ Sensordaten-Fehler:', error);
                return {
                    success: false,
                    message: 'Sensordaten konnten nicht geladen werden.'
                };
            }
        },

        /**
         * Historische Sensordaten abrufen
         * @param {string} timeRange - Zeitbereich (z.B. '1h', '24h', '7d')
         * @returns {Promise} Historische Daten
         */
        async getHistoricalData(timeRange = '1h') {
            try {
                const response = await apiClient.get(`/sensors/history?range=${timeRange}`);
                return {
                    success: true,
                    data: response.data
                };
            } catch (error) {
                console.error('❌ Historische Daten-Fehler:', error);
                return {
                    success: false,
                    message: 'Historische Daten konnten nicht geladen werden.'
                };
            }
        }
    },

    /**
     * Kamera-Stream
     */
    camera: {
        /**
         * Stream-URL für Kamera abrufen
         * @returns {string} Stream-URL
         */
        getStreamUrl() {
            return `${API_BASE_URL}${API_PREFIX}/camera/stream`;
        },

        /**
         * Kamera-Status überprüfen
         * @returns {Promise} Kamera-Status
         */
        async getStatus() {
            try {
                const response = await apiClient.get('/camera/status');
                return {
                    success: true,
                    data: response.data
                };
            } catch (error) {
                console.error('❌ Kamera-Status-Fehler:', error);
                return {
                    success: false,
                    message: 'Kamera-Status konnte nicht abgerufen werden.'
                };
            }
        },

        /**
         * Stream starten
         * @returns {Promise} Stream-Start-Bestätigung
         */
        async startStream() {
            try {
                const response = await apiClient.post('/camera/start');
                return {
                    success: true,
                    data: response.data
                };
            } catch (error) {
                console.error('❌ Stream-Start-Fehler:', error);
                return {
                    success: false,
                    message: 'Stream konnte nicht gestartet werden.'
                };
            }
        },

        /**
         * Stream stoppen
         * @returns {Promise} Stream-Stop-Bestätigung
         */
        async stopStream() {
            try {
                const response = await apiClient.post('/camera/stop');
                return {
                    success: true,
                    data: response.data
                };
            } catch (error) {
                console.error('❌ Stream-Stop-Fehler:', error);
                return {
                    success: false,
                    message: 'Stream konnte nicht gestoppt werden.'
                };
            }
        },

        /**
         * Kamera verbinden
         * @returns {Promise} Verbindungsbestätigung
         */
        async connect() {
            try {
                const response = await apiClient.post('/camera/connect');
                return {
                    success: true,
                    data: response.data
                };
            } catch (error) {
                console.error('❌ Kamera-Verbindungs-Fehler:', error);
                return {
                    success: false,
                    message: 'Kamera konnte nicht verbunden werden.'
                };
            }
        }
    },

    /**
     * Bewegungssteuerung
     */
    movement: {
        /**
         * Bewegungsbefehl senden
         * @param {Object} command - Bewegungsbefehl {x, y, speed, timestamp}
         * @returns {Promise} Befehlsbestätigung
         */
        async sendCommand(command) {
            try {
                const response = await apiClient.post('/movement/command', command);
                return {
                    success: true,
                    data: response.data
                };
            } catch (error) {
                console.error('❌ Bewegungsbefehl-Fehler:', error);
                return {
                    success: false,
                    message: 'Bewegungsbefehl konnte nicht gesendet werden.'
                };
            }
        },

        /**
         * Fahrzeug stoppen
         * @returns {Promise} Stop-Bestätigung
         */
        async stop() {
            try {
                const response = await apiClient.post('/movement/stop');
                return {
                    success: true,
                    data: response.data
                };
            } catch (error) {
                console.error('❌ Stop-Befehl-Fehler:', error);
                return {
                    success: false,
                    message: 'Stop-Befehl konnte nicht gesendet werden.'
                };
            }
        }
    },

    /**
     * Benutzer-Management
     */
    user: {
        /**
         * Benutzerprofil abrufen
         * @returns {Promise} Benutzerdaten
         */
        async getProfile() {
            try {
                const response = await apiClient.get('/user/profile');
                return {
                    success: true,
                    data: response.data
                };
            } catch (error) {
                console.error('❌ Profil-Fehler:', error);
                return {
                    success: false,
                    message: 'Benutzerprofil konnte nicht geladen werden.'
                };
            }
        }
    },

    /**
     * Hilfsfunktionen
     */
    utils: {
        /**
         * Backend-Gesundheitsstatus prüfen
         * @returns {Promise} Health-Check-Ergebnis
         */
        async healthCheck() {
            try {
                const response = await apiClient.get('/health');
                return {
                    success: true,
                    data: response.data
                };
            } catch (error) {
                console.error('❌ Health-Check-Fehler:', error);
                return {
                    success: false,
                    message: 'Backend nicht erreichbar.'
                };
            }
        },

        /**
         * Manuelle Token-Validierung
         * @param {string} token - Zu validierender Token
         * @returns {Promise} Validierungsergebnis
         */
        async validateToken(token) {
            try {
                const response = await apiClient.post('/auth/validate', { token });
                return {
                    success: true,
                    data: response.data
                };
            } catch (error) {
                return {
                    success: false,
                    message: 'Token ungültig.'
                };
            }
        }
    }
};

export default apiService;
export { apiService };

// Zusätzliche Exports für spezifische Funktionen
export const { auth, sensors, camera, user, utils, movement } = apiService;

// Kurze API-Funktionen für direkten Zugriff
export const sendMovementCommand = apiService.movement.sendCommand;
