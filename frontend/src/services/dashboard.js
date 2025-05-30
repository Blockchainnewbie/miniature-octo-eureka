/**
 * Dashboard Authentication Handler und Service-Modul für Navaro
 * 
 * Dieses Modul ist verantwortlich für die Verwaltung der Benutzerauthentifizierung
 * auf dem Dashboard, die Aktualisierung der Benutzeroberfläche basierend auf dem Benutzerstatus
 * und die Koordination von Datenabrufen und -anzeigen.
 * 
 * Hauptfunktionen:
 * - Überprüfung der Benutzerauthentifizierung beim Laden des Dashboards.
 * - Aktualisierung der Navigationsleiste und anderer UI-Elemente mit Benutzerinformationen.
 * - Rollenbasierte Anzeige von UI-Elementen.
 * - Durchführung eines Backend-Health-Checks zur Überprüfung der Serververfügbarkeit.
 * - Anzeige des Verbindungsstatus zum Backend.
 * - Abwicklung des Benutzer-Logouts.
 * - Ermöglichung der manuellen Session-Verlängerung.
 * - Starten und Verwalten der automatischen Aktualisierung von Sensordaten.
 * - Initialisierung und Verwaltung des Kamera-Streams.
 * 
 * @module dashboardService
 * @author Navaro Development Team
 * @version 1.1.0
 */

import authUtils from './auth.js';
import apiService from './api.js';

/**
 * Überprüft die Benutzerauthentifizierung beim Laden des Dashboards.
 * Leitet den Benutzer zum Login weiter, falls keine gültige Session vorhanden ist.
 * Aktualisiert die UI mit Benutzerinformationen und startet die Session-Überwachung.
 * Führt einen Backend-Health-Check durch.
 * 
 * @returns {boolean} True, wenn der Benutzer authentifiziert ist, andernfalls false.
 */
export function checkAuthentication() {
    // Prüfen, ob eine gültige Benutzersession existiert
    if (!authUtils.isAuthenticated()) {
        console.log('🔒 Keine gültige Session - Weiterleitung zum Login');
        // Umleitung zur Login-Seite, falls nicht authentifiziert
        window.location.href = 'login.html';
        return false; // Authentifizierung fehlgeschlagen
    }
    
    // Aktuelle Benutzerdaten abrufen
    const user = authUtils.getCurrentUser();
    console.log('✅ Session gültig für Benutzer:', user?.username);
    
    // Navbar mit Benutzerinformationen aktualisieren
    updateNavbarWithUser(user);
    
    // Kontinuierliche Session-Überwachung starten (z.B. für automatischen Token-Refresh)
    authUtils.startSessionMonitoring();
    
    // Gesundheitsstatus des Backends überprüfen
    performHealthCheck();
    
    return true; // Authentifizierung erfolgreich
}

/**
 * Aktualisiert die Navigationsleiste mit den Daten des angemeldeten Benutzers.
 * Zeigt Benutzername und Rolle an und passt UI-Elemente basierend auf der Rolle an.
 * 
 * @param {Object} user - Das Benutzerobjekt mit Informationen wie `username` und `role`.
 * @param {string} user.username - Der Benutzername.
 * @param {string} user.role - Die Rolle des Benutzers (z.B. 'administrator', 'operator').
 */
function updateNavbarWithUser(user) {
    if (!user) return; // Abbruch, falls kein Benutzerobjekt vorhanden ist
    
    // Logout-Link in der Navbar suchen
    const logoutLink = document.querySelector('a[onclick*="handleLogout"]');
    if (logoutLink) {
        // Benutzerinformationen (Name und Rolle) zum Logout-Link hinzufügen
        const userInfo = `${user.username} (${user.role})`;
        logoutLink.textContent = `Logout - ${userInfo}`;
    }
    
    // UI-Elemente basierend auf der Benutzerrolle anpassen
    updateUIForUserRole(user.role);
}

/**
 * Passt die Sichtbarkeit von UI-Elementen basierend auf der Benutzerrolle an.
 * Elemente mit `data-role="admin"` werden nur für Administratoren angezeigt.
 * Elemente mit `data-role="operator"` werden für Administratoren und Operatoren angezeigt.
 * 
 * @param {string} role - Die Rolle des aktuellen Benutzers.
 */
function updateUIForUserRole(role) {
    // Alle Elemente selektieren, die für Administratoren vorgesehen sind
    const adminElements = document.querySelectorAll('[data-role="admin"]');
    // Alle Elemente selektieren, die für Operatoren vorgesehen sind
    const operatorElements = document.querySelectorAll('[data-role="operator"]');
    
    // Admin-spezifische Elemente anzeigen oder ausblenden
    adminElements.forEach(element => {
        element.style.display = role === 'administrator' ? 'block' : 'none';
    });
    
    // Operator-spezifische Elemente anzeigen oder ausblenden
    // Administratoren haben auch Zugriff auf Operator-Elemente
    operatorElements.forEach(element => {
        element.style.display = ['administrator', 'operator'].includes(role) ? 'block' : 'none';
    });
}

/**
 * Führt einen Health-Check des Backends durch, um dessen Erreichbarkeit und Status zu überprüfen.
 * Aktualisiert die UI mit dem Verbindungsstatus.
 */
async function performHealthCheck() {
    try {
        // API-Aufruf zum Health-Check-Endpunkt
        const result = await apiService.utils.healthCheck();
        
        if (result.success) {
            console.log('✅ Backend ist erreichbar');
            showConnectionStatus('online'); // Status als "online" anzeigen
        } else {
            console.warn('⚠️ Backend antwortet nicht korrekt oder mit Fehler');
            showConnectionStatus('warning'); // Status als "Warnung" anzeigen
        }
    } catch (error) {
        console.error('❌ Backend nicht erreichbar:', error);
        showConnectionStatus('offline'); // Status als "offline" anzeigen
    }
}

/**
 * Zeigt den aktuellen Verbindungsstatus zum Backend in der UI an.
 * Ändert Klasse und Inhalt eines Indikator-Elements.
 * 
 * @param {string} status - Der Verbindungsstatus ('online', 'warning', 'offline').
 */
function showConnectionStatus(status) {
    // DOM-Element für den Verbindungsstatus-Indikator
    const statusIndicator = document.getElementById('connection-status');
    if (!statusIndicator) return; // Abbruch, falls Element nicht gefunden
    
    // CSS-Klasse basierend auf dem Status setzen
    statusIndicator.className = `connection-status ${status}`; // Basisklasse und spezifische Statusklasse
    
    // Text und Icon basierend auf dem Status anpassen
    switch (status) {
        case 'online':
            statusIndicator.innerHTML = '<i class="fas fa-wifi"></i> Online';
            break;
        case 'warning':
            statusIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Verbindung instabil';
            break;
        case 'offline':
            statusIndicator.innerHTML = '<i class="fas fa-wifi-slash"></i> Offline';
            break;
    }
}

/**
 * Behandelt den Logout-Vorgang des Benutzers.
 * Ruft die Logout-Funktion des Authentifizierungs-Moduls auf und leitet zur Login-Seite weiter.
 */
export function handleLogout() {
    console.log('🚪 Benutzer meldet sich ab');
    
    // Logout-Funktion aus authUtils aufrufen (löscht lokale Session-Daten und informiert ggf. Backend)
    authUtils.logout();
    // Zurück zur Login-Seite navigieren
    window.location.href = 'login.html';
}

/**
 * Versucht, die aktuelle Benutzersession zu verlängern, indem ein neuer Token angefordert wird.
 * Zeigt eine Erfolgs- oder Fehlermeldung an und leitet ggf. zum Logout weiter.
 */
export async function extendSession() {
    // Versuch, den Token über authUtils zu erneuern
    const success = await authUtils.refreshTokenIfNeeded();
    
    if (success) {
        alert('Session erfolgreich verlängert.');
    } else {
        alert('Session konnte nicht verlängert werden. Sie werden zum Login weitergeleitet.');
        handleLogout(); // Bei Fehlschlag Logout durchführen
    }
}

/**
 * Startet die automatische Aktualisierung von Daten, z.B. Sensordaten.
 * Ruft in regelmäßigen Abständen die Funktion zur Datenaktualisierung auf.
 */
export function startDataRefresh() {
    // Sensordaten alle 30 Sekunden aktualisieren
    setInterval(async () => {
        // Nur aktualisieren, wenn der Benutzer noch authentifiziert ist
        if (authUtils.isAuthenticated()) {
            await updateSensorData();
        }
    }, 30000); // Intervall: 30000 Millisekunden = 30 Sekunden
    
    // Initialen Datenabruf beim Start durchführen
    updateSensorData();
}

/**
 * Ruft aktuelle Sensordaten vom Backend ab und aktualisiert die Anzeige.
 * Behandelt mögliche Fehler beim Laden der Daten.
 */
async function updateSensorData() {
    try {
        // API-Aufruf zum Abrufen der aktuellen Sensordaten
        const result = await apiService.sensors.getCurrentData();
        
        if (result.success) {
            // Bei Erfolg die Anzeige mit den neuen Daten aktualisieren
            updateSensorDisplay(result.data);
        } else {
            // Fehlermeldung loggen, falls Daten nicht geladen werden konnten
            console.error('❌ Sensordaten konnten nicht geladen werden:', result.message);
        }
    } catch (error) {
        // Fehler beim API-Aufruf loggen
        console.error('❌ Fehler beim Laden der Sensordaten:', error);
    }
}

/**
 * Aktualisiert die Anzeige der Sensordaten in der UI.
 * Setzt die Werte für Temperatur, Geschwindigkeit etc. in den entsprechenden DOM-Elementen.
 * 
 * @param {Object} sensorData - Das Objekt mit den aktuellen Sensordaten.
 * @param {number} [sensorData.temperature] - Die aktuelle Temperatur.
 * @param {number} [sensorData.speed] - Die aktuelle Geschwindigkeit.
 * @// ... weitere mögliche Sensordaten
 */
function updateSensorDisplay(sensorData) {
    // Beispiel: Temperatur-Anzeige aktualisieren
    const tempElement = document.getElementById('temperature-value'); // Oder 'temperature-display' etc.
    if (tempElement && typeof sensorData.temperature !== 'undefined') {
        tempElement.textContent = `${sensorData.temperature}°C`;
    }
    
    // Beispiel: Geschwindigkeits-Anzeige aktualisieren
    const speedElement = document.getElementById('speed-value'); // Oder 'speed-display' etc.
    if (speedElement && typeof sensorData.speed !== 'undefined') {
        speedElement.textContent = `${sensorData.speed} km/h`;
    }
    
    // Hier können weitere UI-Updates für andere Sensordaten hinzugefügt werden
    // z.B. Batteriestand, GPS-Position, Signalstärke etc.
    console.log('📊 Sensordaten UI aktualisiert:', sensorData);
}

/**
 * Initialisiert den Kamera-Stream im Dashboard.
 * Erstellt ein `<img>`-Element und setzt dessen `src` auf die Stream-URL.
 * Behandelt Fehler, falls der Stream nicht verfügbar ist.
 */
export function initializeCameraStream() {
    // Container-Element für den Kamera-Stream
    const streamContainer = document.getElementById('camera-stream'); // Oder 'video-placeholder' etc.
    if (!streamContainer) return; // Abbruch, falls Container nicht gefunden
    
    // URL des Kamera-Streams vom API-Service abrufen
    const streamUrl = apiService.camera.getStreamUrl();
    
    // Neues img-Element für den Stream erstellen
    const img = document.createElement('img');
    img.src = streamUrl; // Stream-URL als Quelle setzen
    img.style.width = '100%'; // Bildbreite an Container anpassen
    img.style.height = 'auto'; // Bildhöhe automatisch anpassen
    
    // Fehlerbehandlung, falls der Stream nicht geladen werden kann
    img.onerror = () => {
        streamContainer.innerHTML = '<p class="text-warning">Kamera-Stream nicht verfügbar</p>';
    };
    
    // Vorhandenen Inhalt im Container leeren und neues Bild einfügen
    streamContainer.innerHTML = ''; 
    streamContainer.appendChild(img);
    
    console.log('📹 Kamera-Stream initialisiert');
}

// Debug-Funktionen, die nur in der Entwicklungsumgebung (localhost) verfügbar sind
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Globales Objekt für Debug-Funktionen erstellen
    window.dashboardDebug = {
        checkAuth: () => authUtils.isAuthenticated(),
        getCurrentUser: () => authUtils.getCurrentUser(),
        logout: handleLogout,
        refreshSession: () => authUtils.refreshTokenIfNeeded(),
        healthCheck: performHealthCheck
    };
    
    console.log('🔧 Dashboard Debug-Funktionen verfügbar unter: window.dashboardDebug');
}

/**
 * Dashboard-Service-Objekt.
 * Fasst alle exportierbaren Funktionen des Moduls zusammen.
 * @type {Object}
 * @property {function} checkAuthentication - Überprüft die Authentifizierung.
 * @property {function} handleLogout - Behandelt den Logout.
 * @property {function} extendSession - Versucht, die Session zu verlängern.
 * @property {function} startDataRefresh - Startet die automatische Datenaktualisierung.
 * @property {function} initializeCameraStream - Initialisiert den Kamera-Stream.
 * @property {function} updateSensorData - Aktualisiert Sensordaten vom Backend.
 * @property {function} updateSensorDisplay - Aktualisiert die Sensoranzeige in der UI.
 * @property {function} updateNavbarWithUser - Aktualisiert die Navbar mit Benutzerinfos.
 * @property {function} performHealthCheck - Führt einen Backend-Health-Check durch.
 * @property {function} showConnectionStatus - Zeigt den Verbindungsstatus an.
 */
const dashboardService = {
    checkAuthentication,
    handleLogout,
    extendSession,
    startDataRefresh,
    initializeCameraStream,
    updateSensorData, // Exportiert für direkten Aufruf, falls benötigt
    updateSensorDisplay, // Exportiert für direkten Aufruf, falls benötigt
    updateNavbarWithUser, // Exportiert für direkten Aufruf, falls benötigt
    performHealthCheck, // Exportiert für direkten Aufruf, falls benötigt
    showConnectionStatus // Exportiert für direkten Aufruf, falls benötigt
};

// Export des Dashboard-Service-Objekts als Standard und benannt
export { dashboardService };
export default dashboardService;
