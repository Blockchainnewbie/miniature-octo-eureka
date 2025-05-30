/**
 * Auth Store - Zustandsverwaltung für JWT-Authentifizierung
 * Verwaltet den Authentifizierungsstatus und Token-Handling
 */

class AuthStore {
  constructor() {
    this.isAuthenticated = false;
    this.user = null;
    this.token = null;
    this.refreshToken = null;
    
    // Beim Laden der Anwendung prüfen, ob ein Token im localStorage vorhanden ist
    this.loadTokenFromStorage();
  }

  /**
   * Lädt den Token aus dem localStorage
   */
  loadTokenFromStorage() {
    const token = localStorage.getItem('auth_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const user = localStorage.getItem('user_data');

    if (token && this.isTokenValid(token)) {
      this.token = token;
      this.refreshToken = refreshToken;
      this.user = user ? JSON.parse(user) : null;
      this.isAuthenticated = true;
    } else {
      this.clearAuth();
    }
  }

  /**
   * Speichert die Authentifizierungsdaten
   * @param {string} token - JWT Access Token
   * @param {string} refreshToken - JWT Refresh Token
   * @param {Object} user - Benutzerdaten
   */
  setAuth(token, refreshToken, user) {
    this.token = token;
    this.refreshToken = refreshToken;
    this.user = user;
    this.isAuthenticated = true;

    // Im localStorage speichern
    localStorage.setItem('auth_token', token);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user_data', JSON.stringify(user));
  }

  /**
   * Löscht alle Authentifizierungsdaten
   */
  clearAuth() {
    this.token = null;
    this.refreshToken = null;
    this.user = null;
    this.isAuthenticated = false;

    // Aus localStorage entfernen
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  }

  /**
   * Prüft, ob ein Token gültig ist (vereinfachte Prüfung)
   * @param {string} token - JWT Token
   * @returns {boolean} - True wenn gültig
   */
  isTokenValid(token) {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gibt den aktuellen Token zurück
   * @returns {string|null} - JWT Token oder null
   */
  getToken() {
    return this.token;
  }

  /**
   * Gibt die Benutzerdaten zurück
   * @returns {Object|null} - Benutzerdaten oder null
   */
  getUser() {
    return this.user;
  }

  /**
   * Prüft den Authentifizierungsstatus
   * @returns {boolean} - True wenn authentifiziert
   */
  getIsAuthenticated() {
    return this.isAuthenticated && this.isTokenValid(this.token);
  }
}

// Singleton-Instanz erstellen
const authStore = new AuthStore();

export default authStore;
