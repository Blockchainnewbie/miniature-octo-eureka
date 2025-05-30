/**
 * Authentication Service - JWT-basierte Authentifizierung
 * Verwaltet Login, Logout und Token-Erneuerung über das Backend
 */

// API-Basis-URL konfigurieren
const API_BASE_URL = 'http://localhost:5000'; // Backend läuft im Docker auf Port 5000
const API_PREFIX = '/api';

/**
 * Auth Service für JWT-Authentifizierung
 */
export const authService = {
    /**
     * Benutzer anmelden
     * @param {string} username - Benutzername
     * @param {string} password - Passwort
     * @returns {Promise<{success: boolean, data?: any, message?: string}>}
     */
    async login(username, password) {
        try {
            const response = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Wichtig für Cookies
                body: JSON.stringify({
                    username,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    data: {
                        access_token: data.access_token,
                        refresh_token: null, // Refresh-Token ist im Cookie
                        user: data.user
                    }
                };
            } else {
                return {
                    success: false,
                    message: data.error || 'Login fehlgeschlagen'
                };
            }
        } catch (error) {
            console.error('Login-Fehler:', error);
            return {
                success: false,
                message: 'Verbindungsfehler zum Server'
            };
        }
    },

    /**
     * Access-Token mit Refresh-Token erneuern
     * @param {string} refreshToken - Refresh-Token (wird aber als Cookie übertragen)
     * @returns {Promise<{success: boolean, data?: any, message?: string}>}
     */
    async refreshToken(refreshToken) {
        try {
            const response = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Wichtig für Cookies
            });

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    data: {
                        access_token: data.access_token,
                        refresh_token: refreshToken // Behält den alten Refresh-Token bei
                    }
                };
            } else {
                return {
                    success: false,
                    message: data.error || 'Token-Erneuerung fehlgeschlagen'
                };
            }
        } catch (error) {
            console.error('Token-Refresh-Fehler:', error);
            return {
                success: false,
                message: 'Verbindungsfehler beim Token-Refresh'
            };
        }
    },

    /**
     * Benutzer abmelden
     * @returns {Promise<{success: boolean, message?: string}>}
     */
    async logout() {
        try {
            const response = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Wichtig für Cookies
            });

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    message: data.message || 'Abmeldung erfolgreich'
                };
            } else {
                return {
                    success: false,
                    message: data.error || 'Abmeldung fehlgeschlagen'
                };
            }
        } catch (error) {
            console.error('Logout-Fehler:', error);
            return {
                success: false,
                message: 'Verbindungsfehler beim Logout'
            };
        }
    },

    /**
     * Geschützte Route testen
     * @param {string} token - Access-Token
     * @returns {Promise<{success: boolean, data?: any, message?: string}>}
     */
    async testProtectedRoute(token) {
        try {
            const response = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/protected`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    data: data
                };
            } else {
                return {
                    success: false,
                    message: data.error || 'Zugriff verweigert'
                };
            }
        } catch (error) {
            console.error('Protected Route Test-Fehler:', error);
            return {
                success: false,
                message: 'Verbindungsfehler'
            };
        }
    }
};

export default authService;
