/**
 * Dashboard Controller - Haupt-Dashboard-Modul für Navaro
 * Verwendet ES6-Module und Backend-API-Integration
 */

import authController from './authController.js';
import { authUtils } from '../src/services/auth.js';
import { dashboardService } from '../src/services/dashboard.js';
import { apiService } from '../src/services/api.js';
import JoystickController from '../src/services/joystick.js';

// Dashboard-Klasse für bessere Organisation
class Dashboard {
    constructor() {
        this.user = null;
        this.activityTimer = null;
        this.sessionWarningShown = false;
        this.isInitialized = false;
        this.joystickController = null;
    }

    /**
     * Dashboard initialisieren
     */
    async init() {
        if (this.isInitialized) return;

        console.log('🛡️ Navaro Dashboard wird initialisiert...');

        try {
            // Authentifizierung prüfen mit Auth Controller
            if (!authController.requireAuth()) {
                return;
            }

            // Dashboard-Services initialisieren
            await this.initializeDashboardServices();

            // Event-Listener einrichten
            this.setupEventListeners();

            // Joystick-Controller initialisieren
            this.initJoystick();

            // Aktivitäts-Timer starten
            this.resetActivityTimer();

            this.isInitialized = true;
            console.log('✅ Dashboard vollständig geladen');

        } catch (error) {
            console.error('❌ Fehler bei Dashboard-Initialisierung:', error);
            this.handleLogout();
        }
    }

    /**
     * Authentifizierung prüfen
     */
    async checkAuthentication() {
        // Session aus localStorage prüfen
        const sessionData = authUtils.getSession();
        
        if (!sessionData.isValid) {
            console.log('🔒 Keine gültige Session - Weiterleitung zum Login');
            window.location.href = 'login.html';
            return false;
        }

        this.user = sessionData.user;

        // Token-Validierung mit Backend
        try {
            const response = await apiService.auth.validateToken();
            if (response.success) {
                console.log('✅ Session gültig für Benutzer:', this.user.username);
                this.updateNavbarWithUser(this.user);
                this.setupSessionWarning();
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Backend-Validierung fehlgeschlagen, verwende lokale Session:', error.message);
            
            // Fallback zu lokaler Session wenn Backend nicht verfügbar
            if (sessionData.isValid) {
                this.updateNavbarWithUser(this.user);
                this.setupSessionWarning();
                return true;
            }
        }

        // Session ungültig
        this.handleLogout();
        return false;
    }

    /**
     * Dashboard-Services initialisieren
     */
    async initializeDashboardServices() {
        try {
            // Sensor-Daten laden
            await dashboardService.loadSensorData();
            
            // Kamera-Status prüfen
            await dashboardService.checkCameraStatus();
            
            // System-Status aktualisieren
            await dashboardService.updateSystemStatus();
            
        } catch (error) {
            console.warn('⚠️ Einige Dashboard-Services nicht verfügbar:', error.message);
        }
    }

    /**
     * Event-Listener einrichten
     */
    setupEventListeners() {
        // Benutzeraktivität überwachen
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        activityEvents.forEach(event => {
            document.addEventListener(event, () => this.resetActivityTimer(), { passive: true });
        });

        // Logout-Button
        const logoutBtn = document.querySelector('[title="Abmelden"]');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Page Visibility API für Tab-Wechsel
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkAuthentication();
            }
        });

        // Stream-Start Button
        const streamBtn = document.getElementById('start-stream-btn');
        if (streamBtn) {
            streamBtn.addEventListener('click', () => this.startVideoStream());
        }

        // Kamera-Verbindung Button
        const cameraBtn = document.getElementById('connect-camera-btn');
        if (cameraBtn) {
            cameraBtn.addEventListener('click', () => this.connectCamera());
        }
    }

    /**
     * Joystick-Controller initialisieren
     */
    initJoystick() {
        try {
            this.joystickController = new JoystickController();
            console.log('🎮 Joystick-Controller erfolgreich initialisiert');
        } catch (error) {
            console.warn('⚠️ Joystick-Controller konnte nicht initialisiert werden:', error.message);
        }
    }

    /**
     * Navbar mit Benutzerdaten aktualisieren
     */
    updateNavbarWithUser(user) {
        const userElement = document.querySelector('.navbar-nav .nav-link[title="Abmelden"]');
        if (userElement) {
            userElement.innerHTML = `<i class="fas fa-user me-1"></i>${user.username}`;
        }
    }

    /**
     * Session-Warnung einrichten
     */
    setupSessionWarning() {
        const sessionData = authUtils.getSession();
        if (!sessionData.isValid) return;

        const timeToExpiry = sessionData.expiresAt - Date.now();
        const warningTime = timeToExpiry - (5 * 60 * 1000); // 5 Minuten vor Ablauf

        if (warningTime > 0) {
            setTimeout(() => {
                this.showSessionWarning();
            }, warningTime);
        }
    }

    /**
     * Session-Warnung anzeigen
     */
    showSessionWarning() {
        if (this.sessionWarningShown) return;
        this.sessionWarningShown = true;

        const warning = document.createElement('div');
        warning.className = 'alert alert-warning alert-dismissible position-fixed';
        warning.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        warning.innerHTML = `
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            <i class="fas fa-clock me-2"></i>
            <strong>Session läuft ab!</strong><br>
            Ihre Session läuft in 5 Minuten ab. Speichern Sie Ihre Arbeit.
        `;

        document.body.appendChild(warning);

        // Warnung nach 10 Sekunden automatisch ausblenden
        setTimeout(() => {
            if (warning.parentNode) {
                warning.remove();
            }
        }, 10000);
    }

    /**
     * Aktivitäts-Timer zurücksetzen
     */
    resetActivityTimer() {
        clearTimeout(this.activityTimer);
        
        this.activityTimer = setTimeout(() => {
            console.log('💤 Keine Benutzeraktivität - Auto-Logout');
            this.handleLogout();
        }, 30 * 60 * 1000); // 30 Minuten Inaktivität
    }

    /**
     * Logout durchführen
     */
    async handleLogout() {
        console.log('🚪 Logout wird durchgeführt...');

        try {
            // Backend-Logout versuchen
            await apiService.auth.logout();
        } catch (error) {
            console.warn('⚠️ Backend-Logout fehlgeschlagen:', error.message);
        }

        // Lokale Session bereinigen
        authUtils.clearSession();

        // Aktivitäts-Timer stoppen
        clearTimeout(this.activityTimer);

        // Weiterleitung zum Login
        window.location.href = 'login.html';
    }

    /**
     * Video-Stream starten
     */
    async startVideoStream() {
        try {
            const response = await apiService.camera.startStream();
            if (response.success) {
                console.log('📹 Video-Stream gestartet');
                this.updateStreamButton(true);
            }
        } catch (error) {
            console.warn('⚠️ Video-Stream konnte nicht gestartet werden:', error.message);
            // Demo-Modus: Simuliere Stream-Start
            this.updateStreamButton(true);
        }
    }

    /**
     * Kamera verbinden
     */
    async connectCamera() {
        try {
            const response = await apiService.camera.connect();
            if (response.success) {
                console.log('📷 Kamera erfolgreich verbunden');
                this.updateCameraStatus(true);
            }
        } catch (error) {
            console.warn('⚠️ Kamera-Verbindung fehlgeschlagen:', error.message);
            // Demo-Modus: Simuliere Kamera-Verbindung
            this.updateCameraStatus(true);
        }
    }

    /**
     * Stream-Button-Status aktualisieren
     */
    updateStreamButton(isStreaming) {
        const btn = document.getElementById('start-stream-btn');
        if (btn) {
            if (isStreaming) {
                btn.innerHTML = '<i class="fas fa-stop me-1"></i>Stream stoppen';
                btn.className = 'btn btn-danger';
                btn.onclick = () => this.stopVideoStream();
            } else {
                btn.innerHTML = '<i class="fas fa-play me-1"></i>Live-Stream starten';
                btn.className = 'btn btn-primary';
                btn.onclick = () => this.startVideoStream();
            }
        }
    }

    /**
     * Kamera-Status aktualisieren
     */
    updateCameraStatus(isConnected) {
        const placeholder = document.getElementById('video-placeholder');
        const connectBtn = document.getElementById('connect-camera-btn');
        
        if (placeholder && connectBtn) {
            if (isConnected) {
                placeholder.innerHTML = `
                    <div class="text-center">
                        <i class="fas fa-video fa-3x mb-3 text-success"></i>
                        <p>Kamera verbunden - Stream bereit</p>
                        <div class="spinner-border text-light" role="status">
                            <span class="visually-hidden">Lädt...</span>
                        </div>
                    </div>
                `;
            }
        }
    }

    /**
     * Video-Stream stoppen
     */
    async stopVideoStream() {
        try {
            await apiService.camera.stopStream();
            console.log('📹 Video-Stream gestoppt');
        } catch (error) {
            console.warn('⚠️ Stream-Stop fehlgeschlagen:', error.message);
        }
        this.updateStreamButton(false);
    }
}

// Dashboard-Instanz erstellen
const dashboard = new Dashboard();

// Dashboard initialisieren wenn DOM bereit ist
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => dashboard.init());
} else {
    dashboard.init();
}

// Globale Funktionen für HTML-Kompatibilität
window.handleLogout = () => dashboard.handleLogout();
window.dashboard = dashboard;

// Export für mögliche Verwendung in anderen Modulen
export default dashboard;
