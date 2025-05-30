/**
 * Auth Controller - Verbindet Views mit Auth-Service und Auth-Store
 * Behandelt die Authentifizierungslogik zwischen UI und Backend
 */

import authStore from '../src/stores/auth/authStore.js';
import { authService } from '../src/services/authService.js';

class AuthController {
  constructor() {
    this.authStore = authStore;
    this.authService = authService;
  }

  /**
   * Behandelt den Login-Prozess
   * @param {string} username - Benutzername
   * @param {string} password - Passwort
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async login(username, password) {
    try {
      const response = await this.authService.login(username, password);
      
      if (response.success) {
        // Authentifizierung in Store speichern
        this.authStore.setAuth(
          response.data.access_token,
          response.data.refresh_token,
          response.data.user
        );
        
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Login fehlgeschlagen' };
      }
    } catch (error) {
      console.error('Login-Fehler:', error);
      return { success: false, message: 'Verbindungsfehler beim Login' };
    }
  }

  /**
   * Behandelt den Logout-Prozess
   */
  async logout() {
    try {
      // Backend über Logout informieren (optional)
      if (this.authStore.getToken()) {
        await this.authService.logout();
      }
    } catch (error) {
      console.error('Logout-Fehler:', error);
    } finally {
      // Lokale Authentifizierung löschen
      this.authStore.clearAuth();
      
      // Zur Login-Seite weiterleiten
      window.location.href = '/src/views/auth/login.html';
    }
  }

  /**
   * Prüft den aktuellen Authentifizierungsstatus
   * @returns {boolean}
   */
  isAuthenticated() {
    return this.authStore.getIsAuthenticated();
  }

  /**
   * Gibt die aktuellen Benutzerdaten zurück
   * @returns {Object|null}
   */
  getCurrentUser() {
    return this.authStore.getUser();
  }

  /**
   * Behandelt die automatische Token-Erneuerung
   * @returns {Promise<boolean>}
   */
  async refreshTokenIfNeeded() {
    if (!this.authStore.getToken() || this.authStore.isTokenValid(this.authStore.getToken())) {
      return true; // Token ist gültig oder nicht vorhanden
    }

    try {
      const refreshToken = this.authStore.refreshToken;
      if (!refreshToken) {
        this.logout();
        return false;
      }

      const response = await this.authService.refreshToken(refreshToken);
      
      if (response.success) {
        this.authStore.setAuth(
          response.data.access_token,
          response.data.refresh_token || refreshToken,
          this.authStore.getUser()
        );
        return true;
      } else {
        this.logout();
        return false;
      }
    } catch (error) {
      console.error('Token-Erneuerung fehlgeschlagen:', error);
      this.logout();
      return false;
    }
  }

  /**
   * Initialisiert den Auth-Controller und prüft den Authentifizierungsstatus
   */
  async initialize() {
    // Token-Gültigkeit prüfen und ggf. erneuern
    await this.refreshTokenIfNeeded();
    
    // Wenn nicht authentifiziert und nicht auf Login-Seite, weiterleiten
    if (!this.isAuthenticated() && !window.location.pathname.includes('login.html')) {
      window.location.href = '/src/views/auth/login.html';
    }
  }

  /**
   * Hilfsfunktion für geschützte Routen
   * Leitet zur Login-Seite weiter, wenn nicht authentifiziert
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = '/src/views/auth/login.html';
      return false;
    }
    return true;
  }
}

// Singleton-Instanz erstellen
const authController = new AuthController();

export default authController;
