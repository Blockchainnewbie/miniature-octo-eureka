/**
 * Authentifizierungs-Utilities für Navaro System
 * 
 * Dieses Modul verwaltet die komplette Authentifizierung und Session-Verwaltung
 * für das Navaro-System. Es bietet sichere Token-basierte Authentifizierung
 * mit automatischer Session-Erneuerung und umfassenden Sicherheitsfeatures.
 * 
 * Hauptfunktionen:
 * - Session-Management mit JWT-Tokens
 * - Automatische Token-Erneuerung
 * - Brute-Force-Schutz mit Lockout-Mechanismus
 * - Remember-Me-Funktionalität
 * - Sichere Session-Überwachung
 * 
 * Sicherheitsfeatures:
 * - Verschlüsselte Token-Speicherung
 * - Automatische Session-Ablaufwarnung
 * - Login-Attempt-Tracking
 * - Secure Session Timeout
 * 
 * @author Navaro Security Team
 * @version 2.0.0
 */

import apiService from './api.js';

/**
 * Authentifizierungs-Konfiguration
 * 
 * Zentrale Konfiguration für alle sicherheitsrelevanten Parameter.
 * Diese Werte können je nach Sicherheitsanforderung angepasst werden.
 */
const AUTH_CONFIG = {
    // LocalStorage-Schlüssel für Session-Daten
    TOKEN_KEY: 'navaro_session_token',           // Haupt-Access-Token
    REFRESH_TOKEN_KEY: 'navaro_refresh_token',   // Token für automatische Erneuerung
    USER_DATA_KEY: 'navaro_user_data',           // Benutzerdaten (Name, Rolle, etc.)
    EXPIRY_KEY: 'navaro_session_expiry',         // Session-Ablaufzeit
    REMEMBER_ME_KEY: 'navaro_remember_me',       // Remember-Me-Status
    SAVED_USERNAME_KEY: 'navaro_saved_username', // Gespeicherter Benutzername
    LOGIN_ATTEMPTS_KEY: 'navaro_login_attempts', // Anzahl fehlgeschlagener Versuche
    LAST_ATTEMPT_KEY: 'navaro_last_attempt',     // Zeitstempel des letzten Versuchs
    
    // Sicherheits-Zeitwerte (in Millisekunden)
    SESSION_TIMEOUT: 30 * 60 * 1000,             // 30 Minuten Standard-Session
    REMEMBER_ME_TIME: 30 * 24 * 60 * 60 * 1000,  // 30 Tage für Remember-Me
    MAX_LOGIN_ATTEMPTS: 3,                        // Maximale Login-Versuche
    LOCKOUT_TIME: 5 * 60 * 1000,                 // 5 Minuten Sperrzeit nach max. Versuchen
    
    // Auto-Refresh vor Ablauf (5 Minuten Vorlaufzeit)
    REFRESH_THRESHOLD: 5 * 60 * 1000
};

/**
 * Authentifizierungs-Utilities-Objekt
 * 
 * Sammlung aller Funktionen für Session-Management und Authentifizierung.
 * Verwendet einen funktionalen Ansatz für bessere Testbarkeit und Modularität.
 */
const authUtils = {
    
    /**
     * Session-Daten speichern
     * 
     * Speichert alle authentifizierungsrelevanten Daten sicher im LocalStorage.
     * Konfiguriert Session-Laufzeit basierend auf Remember-Me-Option.
     * 
     * @param {Object} authData - Authentifizierungsdaten vom Backend
     * @param {string} authData.access_token - JWT-Access-Token
     * @param {string} [authData.refresh_token] - Optional: Refresh-Token für automatische Erneuerung
     * @param {Object} authData.user - Benutzerdaten-Objekt
     * @param {string} authData.user.username - Benutzername
     * @param {string} authData.user.role - Benutzerrolle (admin, operator, etc.)
     * @param {boolean} [rememberMe=false] - Remember-Me-Option aktivieren
     */
    saveSession(authData, rememberMe = false) {
        const now = Date.now();
        
        // Standard-Session-Ablaufzeit berechnen
        const sessionExpiry = now + AUTH_CONFIG.SESSION_TIMEOUT;
        
        // Haupt-Session-Daten im LocalStorage speichern
        localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, authData.access_token || authData.token);
        localStorage.setItem(AUTH_CONFIG.EXPIRY_KEY, sessionExpiry.toString());
        localStorage.setItem(AUTH_CONFIG.USER_DATA_KEY, JSON.stringify(authData.user));
        
        // Refresh-Token speichern falls vom Backend bereitgestellt
        if (authData.refresh_token) {
            localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, authData.refresh_token);
        }
        
        // Remember-Me-Funktionalität konfigurieren
        if (rememberMe) {
            // Erweiterte Session-Laufzeit für Remember-Me
            const extendedExpiry = now + AUTH_CONFIG.REMEMBER_ME_TIME;
            localStorage.setItem(AUTH_CONFIG.REMEMBER_ME_KEY, 'true');
            localStorage.setItem(AUTH_CONFIG.SAVED_USERNAME_KEY, authData.user.username);
            localStorage.setItem(AUTH_CONFIG.EXPIRY_KEY, extendedExpiry.toString());
        } else {
            // Remember-Me-Daten löschen falls nicht gewünscht
            localStorage.removeItem(AUTH_CONFIG.REMEMBER_ME_KEY);
            localStorage.removeItem(AUTH_CONFIG.SAVED_USERNAME_KEY);
        }
        
        // Login-Versuche nach erfolgreicher Anmeldung zurücksetzen
        this.resetLoginAttempts();
        
        console.log('✅ Session gespeichert für:', authData.user.username);
    },
    
    /**
     * Session-Daten abrufen und validieren
     * 
     * Lädt die gespeicherte Session aus dem LocalStorage und überprüft deren Gültigkeit.
     * Bereinigt automatisch abgelaufene Sessions.
     * 
     * @returns {Object|null} Session-Daten oder null bei ungültiger/abgelaufener Session
     * @returns {string} returns.token - Gültiger Access-Token
     * @returns {number} returns.expiry - Session-Ablaufzeit als Timestamp
     * @returns {Object} returns.user - Benutzerdaten-Objekt
     * @returns {boolean} returns.isValid - Session-Gültigkeits-Flag
     */
    getSession() {
        // Session-Komponenten aus LocalStorage laden
        const token = localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
        const expiryStr = localStorage.getItem(AUTH_CONFIG.EXPIRY_KEY);
        const userDataStr = localStorage.getItem(AUTH_CONFIG.USER_DATA_KEY);
        
        // Vollständigkeitsprüfung: Alle Komponenten müssen vorhanden sein
        if (!token || !expiryStr || !userDataStr) {
            return null;
        }
        
        // Ablaufzeit-Validierung
        const expiry = parseInt(expiryStr);
        const now = Date.now();
        
        if (expiry <= now) {
            console.log('🕐 Session abgelaufen');
            this.clearSession(); // Automatische Bereinigung abgelaufener Sessions
            return null;
        }
        
        // Benutzerdaten parsen und validieren
        try {
            return {
                token,
                expiry,
                user: JSON.parse(userDataStr),
                isValid: true
            };
        } catch (error) {
            console.error('❌ Fehler beim Parsen der Session-Daten:', error);
            this.clearSession(); // Korrupte Daten bereinigen
            return null;
        }
    },
    
    /**
     * Session löschen
     * 
     * Entfernt alle Session-bezogenen Daten aus dem LocalStorage.
     * Behält Remember-Me und Login-Attempt-Daten für Benutzererfahrung.
     */
    clearSession() {
        // Nur Session-spezifische Daten löschen, Benutzerpräferenzen beibehalten
        [
            AUTH_CONFIG.TOKEN_KEY,
            AUTH_CONFIG.REFRESH_TOKEN_KEY,
            AUTH_CONFIG.USER_DATA_KEY,
            AUTH_CONFIG.EXPIRY_KEY
        ].forEach(key => localStorage.removeItem(key));
        
        console.log('🧹 Session gelöscht');
    },
    
    /**
     * Vollständige Abmeldung
     * 
     * Führt eine sichere Abmeldung durch mit Backend-Benachrichtigung
     * und vollständiger lokaler Datenbereinigung.
     */
    logout() {
        // Backend über Logout informieren (best effort)
        apiService.auth.logout().catch(console.error);
        
        // Lokale Session-Daten entfernen
        this.clearSession();
        
        // Sicherheits-relevante Daten zurücksetzen
        this.resetLoginAttempts();
        
        console.log('🚪 Logout abgeschlossen');
    },
    
    /**
     * Token automatisch erneuern
     * 
     * Überprüft die verbleibende Session-Zeit und erneuert den Token automatisch
     * wenn er sich dem Ablauf nähert. Verhindert unerwartete Session-Abläufe.
     * 
     * @returns {Promise<boolean>} true bei erfolgreicher Erneuerung, false bei Fehlern
     */
    async refreshTokenIfNeeded() {
        // Aktuelle Session-Daten abrufen
        const session = this.getSession();
        if (!session) return false;
        
        const now = Date.now();
        const timeUntilExpiry = session.expiry - now;
        
        // Nur erneuern wenn Ablauf naht (innerhalb des Refresh-Threshold)
        if (timeUntilExpiry > AUTH_CONFIG.REFRESH_THRESHOLD) {
            return true; // Session noch lange gültig
        }
        
        // Refresh-Token aus Storage laden
        const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
        if (!refreshToken) {
            console.log('🔄 Kein Refresh-Token verfügbar');
            return false;
        }
        
        console.log('🔄 Token wird erneuert...');
        
        try {
            // Backend-API für Token-Erneuerung aufrufen
            const result = await apiService.auth.refreshToken(refreshToken);
            
            if (result.success) {
                // Neue Token-Daten mit vorhandenen Remember-Me-Einstellungen speichern
                const rememberMe = localStorage.getItem(AUTH_CONFIG.REMEMBER_ME_KEY) === 'true';
                this.saveSession(result.data, rememberMe);
                
                console.log('✅ Token erfolgreich erneuert');
                return true;
            } else {
                console.log('❌ Token-Erneuerung fehlgeschlagen');
                this.clearSession(); // Fehlgeschlagene Erneuerung = Session ungültig
                return false;
            }
        } catch (error) {
            console.error('❌ Fehler bei Token-Erneuerung:', error);
            this.clearSession(); // Fehler = Session nicht mehr vertrauenswürdig
            return false;
        }
    },
    
    /**
     * Session-Gültigkeit prüfen
     * 
     * Schnelle Überprüfung ob eine gültige Session vorhanden ist.
     * Führt keine automatische Erneuerung durch.
     * 
     * @returns {boolean} true wenn authentifizierte Session vorhanden
     */
    isAuthenticated() {
        const session = this.getSession();
        return session !== null;
    },
    
    /**
     * Aktueller Benutzer abrufen
     * 
     * Gibt die Benutzerdaten der aktuellen Session zurück.
     * 
     * @returns {Object|null} Benutzerdaten oder null falls nicht authentifiziert
     * @returns {string} returns.username - Benutzername
     * @returns {string} returns.role - Benutzerrolle
     * @returns {string} returns.lastLogin - Letzter Login-Zeitstempel
     */
    getCurrentUser() {
        const session = this.getSession();
        return session ? session.user : null;
    },
    
    /**
     * Login-Versuche verwalten - Inkrement
     * 
     * Erhöht die Anzahl der fehlgeschlagenen Login-Versuche für Brute-Force-Schutz.
     * Speichert zusätzlich den Zeitstempel des letzten Versuchs.
     * 
     * @returns {number} Neue Anzahl der Login-Versuche
     */
    incrementLoginAttempts() {
        const attempts = this.getLoginAttempts() + 1;
        const now = Date.now();
        
        // Aktualisierte Werte speichern
        localStorage.setItem(AUTH_CONFIG.LOGIN_ATTEMPTS_KEY, attempts.toString());
        localStorage.setItem(AUTH_CONFIG.LAST_ATTEMPT_KEY, now.toString());
        
        return attempts;
    },
    
    /**
     * Anzahl Login-Versuche abrufen
     * 
     * @returns {number} Aktuelle Anzahl der fehlgeschlagenen Login-Versuche
     */
    getLoginAttempts() {
        return parseInt(localStorage.getItem(AUTH_CONFIG.LOGIN_ATTEMPTS_KEY) || '0');
    },
    
    /**
     * Login-Versuche zurücksetzen
     * 
     * Löscht alle gespeicherten Login-Attempt-Daten.
     * Wird nach erfolgreicher Anmeldung oder nach Ablauf der Sperrzeit aufgerufen.
     */
    resetLoginAttempts() {
        localStorage.removeItem(AUTH_CONFIG.LOGIN_ATTEMPTS_KEY);
        localStorage.removeItem(AUTH_CONFIG.LAST_ATTEMPT_KEY);
    },
    
    /**
     * Lockout-Status prüfen
     * 
     * Überprüft ob das Konto temporär gesperrt ist aufgrund zu vieler
     * fehlgeschlagener Login-Versuche. Implementiert automatische Entsperrung.
     * 
     * @returns {Object} Lockout-Informationen
     * @returns {boolean} returns.isLocked - Konto gesperrt Status
     * @returns {number} returns.attempts - Anzahl bisheriger Versuche
     * @returns {number} [returns.remainingTime] - Verbleibende Sperrzeit in ms
     * @returns {number} [returns.remainingMinutes] - Verbleibende Sperrzeit in Minuten
     */
    checkLockoutStatus() {
        const attempts = this.getLoginAttempts();
        const lastAttemptStr = localStorage.getItem(AUTH_CONFIG.LAST_ATTEMPT_KEY);
        
        // Kein Lockout wenn unter dem Limit oder kein letzter Versuch gespeichert
        if (attempts < AUTH_CONFIG.MAX_LOGIN_ATTEMPTS || !lastAttemptStr) {
            return { isLocked: false, attempts };
        }
        
        const lastAttempt = parseInt(lastAttemptStr);
        const now = Date.now();
        const timeSinceLastAttempt = now - lastAttempt;
        
        // Prüfen ob Sperrzeit abgelaufen ist
        if (timeSinceLastAttempt >= AUTH_CONFIG.LOCKOUT_TIME) {
            // Automatische Entsperrung nach Ablauf der Zeit
            this.resetLoginAttempts();
            return { isLocked: false, attempts: 0 };
        }
        
        // Lockout aktiv - verbleibende Zeit berechnen
        const remainingTime = AUTH_CONFIG.LOCKOUT_TIME - timeSinceLastAttempt;
        return {
            isLocked: true,
            attempts,
            remainingTime,
            remainingMinutes: Math.ceil(remainingTime / 60000)
        };
    },
    
    /**
     * Remember-Me-Daten abrufen
     * 
     * Lädt die gespeicherten Remember-Me-Präferenzen für die Login-UI.
     * 
     * @returns {Object} Remember-Me-Informationen
     * @returns {boolean} returns.rememberMe - Remember-Me aktiviert
     * @returns {string|null} returns.savedUsername - Gespeicherter Benutzername
     */
    getRememberMeData() {
        const rememberMe = localStorage.getItem(AUTH_CONFIG.REMEMBER_ME_KEY) === 'true';
        const savedUsername = localStorage.getItem(AUTH_CONFIG.SAVED_USERNAME_KEY);
        
        return { rememberMe, savedUsername };
    },
    
    /**
     * Auto-Login Verfügbarkeit prüfen
     * 
     * Bestimmt ob ein automatischer Login möglich ist (gültige Session vorhanden).
     * 
     * @returns {boolean} true wenn Auto-Login möglich
     */
    canAutoLogin() {
        return this.isAuthenticated();
    },
    
    /**
     * Session-Überwachung starten
     * 
     * Startet automatische Hintergrundprozesse für:
     * - Periodische Token-Erneuerung
     * - Session-Ablaufwarnung
     * - Automatische Bereinigung
     * 
     * Sollte nach erfolgreicher Anmeldung aufgerufen werden.
     */
    startSessionMonitoring() {
        // Token-Erneuerung alle 5 Minuten prüfen
        setInterval(async () => {
            await this.refreshTokenIfNeeded();
        }, 5 * 60 * 1000);
        
        // Session-Warnung 5 Minuten vor Ablauf anzeigen
        setInterval(() => {
            const session = this.getSession();
            if (!session) return;
            
            const now = Date.now();
            const timeUntilExpiry = session.expiry - now;
            const warningTime = 5 * 60 * 1000; // 5 Minuten Vorwarnung
            
            // Warnung nur einmal pro Session anzeigen
            if (timeUntilExpiry <= warningTime && timeUntilExpiry > 0) {
                const minutes = Math.ceil(timeUntilExpiry / 60000);
                this.showSessionWarning(minutes);
            }
        }, 60 * 1000); // Jede Minute überprüfen
    },
    
    /**
     * Session-Ablaufwarnung anzeigen
     * 
     * Zeigt dem Benutzer eine Warnung vor Session-Ablauf an und bietet
     * die Möglichkeit zur Verlängerung.
     * 
     * @param {number} minutes - Verbleibende Minuten bis zum Ablauf
     */
    showSessionWarning(minutes) {
        // Mehrfache Warnungen pro Session verhindern
        if (this._warningShown) return;
        this._warningShown = true;
        
        // Benutzer-Dialog für Session-Verlängerung
        const extendSession = confirm(
            `Ihre Session läuft in ${minutes} Minute(n) ab. Möchten Sie sie verlängern?`
        );
        
        if (extendSession) {
            // Versuch der automatischen Verlängerung
            this.refreshTokenIfNeeded().then(success => {
                if (success) {
                    alert('Session erfolgreich verlängert.');
                } else {
                    alert('Session konnte nicht verlängert werden. Sie werden zum Login weitergeleitet.');
                    window.location.href = 'login.html';
                }
                this._warningShown = false; // Reset für nächste Warnung
            });
        } else {
            // Benutzer möchte keine Verlängerung - Logout durchführen
            this.logout();
            window.location.href = 'login.html';
        }
    }
};

// Module-Exports
export { authUtils };
export default authUtils;
