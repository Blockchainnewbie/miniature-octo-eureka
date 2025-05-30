/**
 * Navaro Login System - Authentifizierungs-Controller
 * 
 * Dieses Skript steuert die Funktionalität der Navaro-Login-Seite.
 * Es ist verantwortlich für:
 * - Initialisierung der Seite und Event-Listener.
 * - Überprüfung auf bestehende Benutzersessions und Lockout-Status.
 * - Handhabung des Login-Formulars, inklusive Eingabevalidierung.
 * - Kommunikation mit dem Backend (apiService) zur Benutzerauthentifizierung.
 * - Verwaltung von Login-Versuchen und Implementierung eines Lockout-Mechanismus.
 * - Anzeige von Feedback-Nachrichten (Alerts) für den Benutzer.
 * - Weiterleitung zum Dashboard nach erfolgreicher Anmeldung.
 * - Bereitstellung von Debug-Funktionen für die Entwicklungsumgebung.
 * 
 * Verwendet `apiService` für Backend-Kommunikation und `authUtils` für Session-Management.
 * 
 * @module LoginController
 * @author Navaro Development Team
 * @version 1.2.0
 */

// Import der Backend-Services und Authentifizierungs-Utilities
import apiService from './src/services/api.js';
import authUtils from './src/services/auth.js';

// Event-Listener, der ausgeführt wird, sobald das DOM vollständig geladen ist
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛡️ Navaro Login System initialisiert');
    
    // Sammlung der relevanten DOM-Elemente für einfachen Zugriff
    const elements = {
        form: document.getElementById('loginForm'),             // Das Login-Formular
        username: document.getElementById('username'),          // Eingabefeld für den Benutzernamen
        password: document.getElementById('password'),          // Eingabefeld für das Passwort
        passwordToggle: document.getElementById('passwordToggle'), // Button zum Umschalten der Passwort-Sichtbarkeit
        rememberMe: document.getElementById('rememberMe'),      // Checkbox für "Angemeldet bleiben"
        loginButton: document.getElementById('loginButton'),    // Der Login-Button
        loadingSpinner: document.getElementById('loadingSpinner'),// Lade-Spinner im Login-Button
        alertContainer: document.getElementById('alertContainer') // Container für Fehlermeldungen/Alerts
    };
    
    // Konfigurationsvariablen für das Login-System (teilweise redundant zu authUtils.AUTH_CONFIG, könnte konsolidiert werden)
    const config = {
        maxAttempts: authUtils.AUTH_CONFIG?.MAX_LOGIN_ATTEMPTS || 3, // Maximale Login-Versuche, Fallback falls authUtils nicht geladen
        lockoutTime: authUtils.AUTH_CONFIG?.LOCKOUT_TIME || 5 * 60 * 1000, // Sperrzeit in ms (5 Minuten)
        // sessionTimeout und rememberMeTime werden primär von authUtils verwaltet
    };
    
    // Login-Versuche und Zeit des letzten Versuchs werden nicht mehr lokal hier verwaltet,
    // sondern über authUtils bezogen, um Konsistenz zu gewährleisten.
    // let loginAttempts = parseInt(localStorage.getItem('navaro_login_attempts') || '0'); // Veraltet
    // let lastAttempt = parseInt(localStorage.getItem('navaro_last_attempt') || '0'); // Veraltet
    
    // Initialisierungsfunktion aufrufen
    init();
    
    /**
     * Initialisiert das Login-System.
     * Überprüft auf eine bestehende Session, richtet Event-Listener ein,
     * prüft den Lockout-Status und aktualisiert den Zustand des Login-Buttons.
     * Setzt den Fokus auf das Benutzername-Feld.
     */
    function init() {
        // Prüfen, ob bereits eine aktive Session existiert (Auto-Login)
        if (checkExistingSession()) {
            return; // Wenn Auto-Login erfolgt, weitere Initialisierung überspringen
        }
        // Event-Listener für Formular-Interaktionen einrichten
        setupEventListeners();
        // Lockout-Status prüfen und ggf. Formular sperren
        checkLockoutStatus();
        // Zustand des Login-Buttons basierend auf Eingabefeldern aktualisieren
        updateLoginButtonState();
        
        // Fokus auf das Benutzername-Feld setzen für bessere UX
        setTimeout(() => {
            elements.username.focus();
        }, 500); // Kleine Verzögerung, um sicherzustellen, dass das Element bereit ist
        
        console.log('✅ Login-System bereit für Authentifizierung');
    }
    
    /**
     * Richtet alle notwendigen Event-Listener für das Login-Formular ein.
     * Behandelt Formularabsendung, Passwort-Sichtbarkeit, Enter-Tasten-Navigation,
     * Echtzeit-Eingabevalidierung und Fokus-Effekte.
     */
    function setupEventListeners() {
        // Event-Listener für das Absenden des Formulars
        elements.form.addEventListener('submit', handleLogin);
        
        // Event-Listener für den Klick auf den Passwort-Sichtbarkeits-Toggle
        elements.passwordToggle.addEventListener('click', togglePasswordVisibility);
        
        // Event-Listener für die Enter-Taste in den Eingabefeldern
        elements.username.addEventListener('keypress', handleEnterKey);
        elements.password.addEventListener('keypress', handleEnterKey);
        
        // Event-Listener für Eingabeänderungen zur Echtzeit-Validierung und Button-Aktualisierung
        elements.username.addEventListener('input', handleInputChange);
        elements.password.addEventListener('input', handleInputChange);
        
        // Event-Listener für Fokus-Effekte zur Verbesserung der Benutzererfahrung
        elements.username.addEventListener('focus', () => addFocusEffect(elements.username));
        elements.password.addEventListener('focus', () => addFocusEffect(elements.password));
        elements.username.addEventListener('blur', () => removeFocusEffect(elements.username));
        elements.password.addEventListener('blur', () => removeFocusEffect(elements.password));
        
        // Event-Listener für den "Passwort vergessen"-Link (Placeholder-Funktionalität)
        const forgotPassword = document.querySelector('.forgot-password');
        if (forgotPassword) {
            forgotPassword.addEventListener('click', handleForgotPassword);
        }
    }
    
    /**
     * Überprüft, ob eine gültige, bestehende Benutzersession vorhanden ist.
     * Falls ja, wird der Benutzer automatisch zum Dashboard weitergeleitet.
     * Füllt auch Benutzername und "Remember Me" aus, falls diese Daten gespeichert sind.
     * @returns {boolean} True, wenn eine aktive Session gefunden und Weiterleitung eingeleitet wurde, sonst false.
     */
    function checkExistingSession() {
        // Prüfen, ob der Benutzer authentifiziert ist (gültige Session)
        if (authUtils.isAuthenticated()) { // Verwendet authUtils.getSession() intern
            console.log('🔐 Aktive Session gefunden - Auto-Login');
            showAlert('Vorhandene Session erkannt. Weiterleitung zum Dashboard...', 'success');
            
            // Weiterleitung zum Dashboard nach einer kurzen Verzögerung
            setTimeout(() => {
                redirectToDashboard();
            }, 1500);
            
            return true; // Signalisiert, dass Auto-Login stattfindet
        }
        
        // Gespeicherte "Remember Me"-Daten abrufen
        const { rememberMe, savedUsername } = authUtils.getRememberMeData();
        
        // Falls "Remember Me" aktiv war und ein Benutzername gespeichert ist, Felder vorab ausfüllen
        if (rememberMe && savedUsername) {
            elements.username.value = savedUsername;
            elements.rememberMe.checked = true;
            elements.password.focus(); // Fokus auf das Passwortfeld setzen
        }
        
        return false; // Keine aktive Session für Auto-Login
    }
    
    /**
     * Überprüft den Lockout-Status des Kontos mithilfe von `authUtils`.
     * Wenn das Konto gesperrt ist, wird das Login-Formular für die verbleibende Sperrzeit deaktiviert.
     * @returns {boolean} True, wenn das Konto gesperrt ist, sonst false.
     */
    function checkLockoutStatus() {
        // Lockout-Status von authUtils abrufen
        const lockoutInfo = authUtils.checkLockoutStatus();
        
        if (lockoutInfo.isLocked) {
            // Wenn gesperrt, eine Warnung anzeigen und das Formular deaktivieren
            showAlert(`Konto temporär gesperrt. Versuchen Sie es in ${lockoutInfo.remainingMinutes} Minute(n) erneut.`, 'warning');
            disableLoginForm(lockoutInfo.remainingTime);
            return true; // Konto ist gesperrt
        }
        
        // Login-Versuche werden jetzt von authUtils verwaltet, kein lokales Reset hier nötig.
        return false; // Konto ist nicht gesperrt
    }
    
    /**
     * Verarbeitet das Absenden des Login-Formulars.
     * Verhindert die Standard-Formularabsendung, prüft den Lockout-Status,
     * validiert die Eingaben und initiiert den Authentifizierungsprozess.
     * @param {Event} event - Das Submit-Event des Formulars.
     */
    async function handleLogin(event) {
        event.preventDefault(); // Standard-Formularabsendung verhindern
        
        // Erneut Lockout-Status prüfen, falls zwischenzeitlich ausgelöst
        if (checkLockoutStatus()) {
            return;
        }
        
        // Eingabewerte abrufen und trimmen
        const username = elements.username.value.trim();
        const password = elements.password.value;
        const rememberMe = elements.rememberMe.checked;
        
        // Eingaben validieren
        if (!validateInput(username, password)) {
            return; // Abbruch bei ungültigen Eingaben
        }
        
        // Visuellen Zustand für "Laden" setzen und vorherige Alerts löschen
        setLoginState('loading');
        clearAlerts();
        
        try {
            console.log('🔐 Authentifizierung gestartet für:', username);
            
            // Benutzerauthentifizierung über apiService (Backend-Anfrage)
            const authResult = await authenticateUser(username, password);
            
            if (authResult.success) {
                // Erfolgreiche Anmeldung behandeln
                handleSuccessfulLogin(authResult, rememberMe);
            } else {
                // Fehlgeschlagene Anmeldung behandeln
                handleFailedLogin(authResult.message);
            }
            
        } catch (error) {
            // Generische Fehlermeldung bei unerwarteten Fehlern
            console.error('❌ Login-Fehler (catch block):', error);
            handleFailedLogin('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
        }
    }
    
    /**
     * Führt die eigentliche Benutzerauthentifizierung über den `apiService` durch.
     * Sendet Benutzername und Passwort an das Backend.
     * @param {string} username - Der eingegebene Benutzername.
     * @param {string} password - Das eingegebene Passwort.
     * @returns {Promise<Object>} Ein Objekt, das den Erfolg der Authentifizierung (`success`),
     *                            ggf. Token und Benutzerdaten (`token`, `user`) oder eine Fehlermeldung (`message`) enthält.
     */
    async function authenticateUser(username, password) {
        try {
            console.log('🔐 Sende Login-Anfrage an das Backend...');
            
            // API-Aufruf für Login über apiService
            const result = await apiService.auth.login(username, password);
            
            // Ergebnis direkt zurückgeben (enthält success, data/message)
            return result; 
            
        } catch (error) {
            // Dieser Catch-Block sollte seltener erreicht werden, da apiService.auth.login Fehler intern behandelt
            // und ein { success: false, message: ... } Objekt zurückgibt.
            console.error('❌ Kritischer Fehler bei der Backend-Verbindung in authenticateUser:', error);
            return {
                success: false,
                message: 'Kommunikationsfehler mit dem Server. Bitte versuchen Sie es später erneut.'
            };
        }
    }

    /**
     * Demo-Authentifizierungsfunktion (Fallback).
     * Wird hier nicht mehr direkt verwendet, da `apiService.auth.login` bereits einen Fallback
     * oder eine klare Fehlermeldung liefern sollte, wenn das Backend nicht erreichbar ist.
     * Diese Funktion wird als Referenz beibehalten, falls ein reiner Offline-Demo-Modus benötigt wird.
     * @param {string} username - Der Benutzername.
     * @param {string} password - Das Passwort.
     * @returns {Promise<Object>} Ergebnis der Demo-Authentifizierung.
     * @deprecated Sollte durch Backend-Kommunikation ersetzt oder entfernt werden.
     */
    async function authenticateUserDemo(username, password) {
        // Simulation einer API-Anfrage mit Verzögerung
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Demo-Credentials für Entwicklung
        const validCredentials = [
            { username: 'admin', password: 'navaro2025', role: 'administrator' },
            { username: 'operator', password: 'rescue123', role: 'operator' },
            { username: 'demo', password: 'demo', role: 'demo_user' }
        ];
        
        const user = validCredentials.find(u => 
            u.username === username.toLowerCase() && u.password === password
        );
        
        if (user) {
            return {
                success: true,
                token: generateSessionToken(), // Nur für Demo-Zwecke
                user: {
                    id: Math.random().toString(36).substr(2, 9),
                    username: user.username,
                    role: user.role,
                    lastLogin: new Date().toISOString()
                }
            };
        } else {
            return {
                success: false,
                message: 'Ungültige Demo-Anmeldedaten.'
            };
        }
    }
    
    /**
     * Verarbeitet eine erfolgreiche Benutzeranmeldung.
     * Speichert die Session-Daten mithilfe von `authUtils`, zeigt eine Erfolgsmeldung an
     * und leitet den Benutzer zum Dashboard weiter.
     * @param {Object} authResult - Das Ergebnis der Authentifizierung, enthält Token und Benutzerdaten.
     * @param {boolean} rememberMe - Gibt an, ob die "Remember Me"-Option ausgewählt wurde.
     */
    function handleSuccessfulLogin(authResult, rememberMe) {
        console.log('✅ Anmeldung erfolgreich für:', authResult.user.username);
        
        // Session-Daten (Token, Benutzerinfo, Ablaufzeit) über authUtils speichern
        // authResult sollte hier das Format { token: "...", user: {...} } oder { access_token: "...", user: {...} } haben
        authUtils.saveSession(authResult, rememberMe); // authResult.data, wenn es von apiService kommt
        
        // Erfolgsmeldung anzeigen
        showAlert(`Willkommen zurück, ${authResult.user.username}! Weiterleitung zum Mission Control...`, 'success');
        
        // Weiterleitung zum Dashboard nach einer kurzen Verzögerung
        setTimeout(() => {
            redirectToDashboard();
        }, 2000);
    }
    
    /**
     * Verarbeitet eine fehlgeschlagene Benutzeranmeldung.
     * Inkrementiert die Anzahl der Login-Versuche über `authUtils`,
     * prüft auf einen möglichen Lockout und zeigt eine entsprechende Fehlermeldung an.
     * Setzt das Passwortfeld zurück.
     * @param {string} message - Die Fehlermeldung, die angezeigt werden soll.
     */
    function handleFailedLogin(message) {
        console.log('❌ Anmeldung fehlgeschlagen');
        
        // Login-Versuche über authUtils erhöhen und aktuellen Stand abrufen
        const attempts = authUtils.incrementLoginAttempts();
        
        // Visuellen Zustand für "Fehler" setzen
        setLoginState('error');
        
        // Lockout-Status über authUtils prüfen
        const lockoutInfo = authUtils.checkLockoutStatus();
        
        if (lockoutInfo.isLocked) {
            // Meldung für gesperrtes Konto anzeigen
            showAlert(`Maximale Anzahl von Anmeldeversuchen erreicht. Konto für ${lockoutInfo.remainingMinutes} Minuten gesperrt.`, 'danger');
            disableLoginForm(lockoutInfo.remainingTime);
        } else {
            // Meldung für fehlgeschlagene Anmeldung mit verbleibenden Versuchen anzeigen
            const remainingAttempts = (authUtils.AUTH_CONFIG?.MAX_LOGIN_ATTEMPTS || config.maxAttempts) - attempts;
            showAlert(`${message} (${remainingAttempts > 0 ? remainingAttempts : 0} Versuch(e) verbleibend)`, 'danger');
        }
        
        // Formular nach kurzer Zeit für erneute Eingabe vorbereiten
        setTimeout(() => {
            setLoginState('normal'); // Normalen Button-Zustand wiederherstellen
            elements.password.value = ''; // Passwortfeld leeren
            elements.password.focus();    // Fokus auf Passwortfeld setzen
        }, 3000);
    }
    
    /**
     * Validiert die Benutzereingaben für Benutzername und Passwort.
     * Prüft auf leere Felder und Mindestlängen.
     * @param {string} username - Der eingegebene Benutzername.
     * @param {string} password - Das eingegebene Passwort.
     * @returns {boolean} True, wenn die Eingaben gültig sind, sonst false.
     */
    function validateInput(username, password) {
        if (!username) {
            showAlert('Bitte geben Sie Ihren Benutzernamen ein.', 'warning');
            elements.username.focus();
            return false;
        }
        
        if (username.length < 3) {
            showAlert('Benutzername muss mindestens 3 Zeichen lang sein.', 'warning');
            elements.username.focus();
            return false;
        }
        
        if (!password) {
            showAlert('Bitte geben Sie Ihr Passwort ein.', 'warning');
            elements.password.focus();
            return false;
        }
        
        // Mindestlänge für Passwörter (Beispiel, sollte serverseitig validiert werden)
        if (password.length < 4) { // In einer echten Anwendung wäre dies eher 8+ Zeichen
            showAlert('Passwort muss mindestens 4 Zeichen lang sein.', 'warning');
            elements.password.focus();
            return false;
        }
        
        return true; // Alle Validierungen bestanden
    }
    
    /**
     * Setzt den visuellen Zustand des Login-Buttons (Normal, Laden, Fehler).
     * Deaktiviert den Button im Ladezustand.
     * @param {string} state - Der gewünschte Zustand ('normal', 'loading', 'error').
     */
    function setLoginState(state) {
        const button = elements.loginButton;
        // const spinner = elements.loadingSpinner; // Spinner wird über CSS-Klassen gesteuert
        
        // Alle Zustands-CSS-Klassen entfernen und Button aktivieren
        button.classList.remove('loading', 'error');
        button.disabled = false; // Standardmäßig aktiviert
        
        switch (state) {
            case 'loading':
                button.classList.add('loading'); // CSS-Klasse für Ladezustand hinzufügen
                button.disabled = true;          // Button während des Ladens deaktivieren
                break;
                
            case 'error':
                button.classList.add('error'); // CSS-Klasse für Fehlerzustand hinzufügen
                // Fehlerklasse nach kurzer Zeit entfernen, um visuellen Effekt zu erzielen
                setTimeout(() => {
                    button.classList.remove('error');
                }, 1000);
                break;
                
            case 'normal':
            default:
                // Normaler Zustand, bereits durch initiales Zurücksetzen erreicht
                break;
        }
        
        // Zustand des Login-Buttons basierend auf Eingaben und aktuellem Ladezustand aktualisieren
        updateLoginButtonState();
    }
    
    /**
     * Aktualisiert den Aktivierungszustand des Login-Buttons.
     * Der Button ist nur aktiv, wenn Benutzername und Passwort ausgefüllt sind
     * und kein Ladevorgang aktiv ist.
     */
    function updateLoginButtonState() {
        const hasUsername = elements.username.value.trim().length > 0;
        const hasPassword = elements.password.value.length > 0;
        const isNotLoading = !elements.loginButton.classList.contains('loading'); // Prüfen, ob Ladeklasse aktiv ist
        
        // Button deaktivieren, wenn Felder leer sind oder geladen wird
        elements.loginButton.disabled = !(hasUsername && hasPassword && isNotLoading);
    }
    
    /**
     * Schaltet die Sichtbarkeit des Passworts im Eingabefeld um (Text/Passwort).
     * Ändert auch das Icon des Toggle-Buttons entsprechend.
     */
    function togglePasswordVisibility() {
        const passwordInput = elements.password;
        const toggleIcon = elements.passwordToggle.querySelector('i'); // Das Icon-Element im Button
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text'; // Passwort als Text anzeigen
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash'); // Icon zu "Auge durchgestrichen" ändern
        } else {
            passwordInput.type = 'password'; // Passwort wieder verbergen
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye'); // Icon zu "Auge" ändern
        }
        
        // Fokus auf das Passwortfeld beibehalten/setzen
        passwordInput.focus();
    }
    
    /**
     * Verarbeitet das Drücken der Enter-Taste in den Eingabefeldern.
     * Springt vom Benutzername- zum Passwortfeld oder sendet das Formular ab.
     * @param {KeyboardEvent} event - Das Keypress-Event.
     */
    function handleEnterKey(event) {
        if (event.key === 'Enter') {
            if (event.target === elements.username) {
                event.preventDefault(); // Standardverhalten verhindern
                elements.password.focus(); // Fokus auf Passwortfeld setzen
            } else if (event.target === elements.password) {
                event.preventDefault(); // Standardverhalten verhindern
                // Formular nur absenden, wenn der Login-Button aktiv ist
                if (!elements.loginButton.disabled) {
                    elements.form.requestSubmit(); // Formular programmatisch absenden
                }
            }
        }
    }
    
    /**
     * Verarbeitet Änderungen in den Eingabefeldern.
     * Aktualisiert den Zustand des Login-Buttons und blendet ggf. Fehlermeldungen aus.
     * @param {InputEvent} event - Das Input-Event.
     */
    function handleInputChange(event) {
        // Zustand des Login-Buttons bei jeder Eingabe aktualisieren
        updateLoginButtonState();
        
        // Fehlermeldungen ausblenden, sobald der Benutzer wieder tippt
        if (event.target.value.trim()) { // Nur wenn tatsächlich etwas eingegeben wurde (nicht nur Leerzeichen)
            clearAlerts();
        }
    }
    
    /**
     * Fügt einen visuellen Fokus-Effekt zum Elternelement des Eingabefelds hinzu.
     * @param {HTMLElement} element - Das fokussierte Eingabeelement.
     */
    function addFocusEffect(element) {
        element.parentElement.classList.add('focused'); // CSS-Klasse für Fokus-Effekt
    }
    
    /**
     * Entfernt den visuellen Fokus-Effekt vom Elternelement des Eingabefelds.
     * @param {HTMLElement} element - Das Eingabeelement, das den Fokus verloren hat.
     */
    function removeFocusEffect(element) {
        element.parentElement.classList.remove('focused');
    }
    
    /**
     * Verarbeitet den Klick auf "Passwort vergessen".
     * Zeigt eine Informationsmeldung an (Placeholder-Funktionalität).
     * @param {MouseEvent} event - Das Click-Event.
     */
    function handleForgotPassword(event) {
        event.preventDefault(); // Standard-Linkverhalten verhindern
        showAlert('Bitte wenden Sie sich an Ihren Systemadministrator für einen Passwort-Reset.', 'info');
    }
    
    /**
     * Deaktiviert das Login-Formular für eine bestimmte Dauer (Lockout).
     * Zeigt einen Countdown an, bis das Formular wieder aktiviert wird.
     * @param {number} duration - Die Dauer der Deaktivierung in Millisekunden.
     */
    function disableLoginForm(duration) {
        // Eingabefelder und Button deaktivieren
        elements.loginButton.disabled = true;
        elements.username.disabled = true;
        elements.password.disabled = true;
        
        let remainingTimeSeconds = Math.ceil(duration / 1000); // Verbleibende Zeit in Sekunden
        
        // Countdown-Intervall starten
        const countdownInterval = setInterval(() => {
            remainingTimeSeconds--;
            
            // Alert aktualisieren mit verbleibender Zeit (optional, kann zu viele Updates verursachen)
            // showAlert(`Konto gesperrt. Versuchen Sie es in ${Math.ceil(remainingTimeSeconds / 60)} Minute(n) erneut. (${remainingTimeSeconds}s)`, 'warning');

            if (remainingTimeSeconds <= 0) {
                clearInterval(countdownInterval); // Countdown beenden
                // Formular wieder aktivieren
                elements.loginButton.disabled = false;
                elements.username.disabled = false;
                elements.password.disabled = false;
                updateLoginButtonState(); // Button-Status korrekt setzen
                clearAlerts();
                showAlert('Sie können sich jetzt wieder anmelden.', 'success');
                elements.username.focus(); // Fokus auf Benutzername setzen
            }
        }, 1000); // Jede Sekunde aktualisieren
    }
    
    /**
     * Zeigt eine Alert-Nachricht im dafür vorgesehenen Container an.
     * @param {string} message - Die anzuzeigende Nachricht.
     * @param {string} [type='info'] - Der Typ des Alerts ('info', 'success', 'warning', 'danger').
     */
    function showAlert(message, type = 'info') {
        clearAlerts(); // Vorherige Alerts entfernen
        
        const alertDiv = document.createElement('div');
        // CSS-Klassen für Bootstrap-Alerts und benutzerdefinierte Stile
        alertDiv.className = `alert alert-${type} navaro-alert`; 
        
        const iconClass = getAlertIcon(type); // Passendes Icon basierend auf Alert-Typ
        alertDiv.innerHTML = `<i class="${iconClass} me-2"></i> ${message}`; // Icon und Nachricht
        
        elements.alertContainer.appendChild(alertDiv); // Alert zum DOM hinzufügen
        
        // Nicht-kritische Nachrichten nach einiger Zeit automatisch ausblenden
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                // Nur diesen spezifischen Alert entfernen, falls noch vorhanden
                if (alertDiv.parentElement) {
                    alertDiv.remove();
                }
            }, 5000); // Nach 5 Sekunden
        }
    }
    
    /**
     * Gibt die passende FontAwesome-Icon-Klasse für den jeweiligen Alert-Typ zurück.
     * @param {string} type - Der Typ des Alerts.
     * @returns {string} Die CSS-Klasse für das Icon.
     */
    function getAlertIcon(type) {
        switch (type) {
            case 'success': return 'fas fa-check-circle';
            case 'danger': return 'fas fa-exclamation-triangle';
            case 'warning': return 'fas fa-exclamation-circle';
            case 'info':
            default: return 'fas fa-info-circle';
        }
    }
    
    /**
     * Entfernt alle aktuellen Alert-Nachrichten aus dem Alert-Container.
     */
    function clearAlerts() {
        elements.alertContainer.innerHTML = ''; // Inhalt des Containers leeren
    }
    
    /**
     * Generiert einen einfachen Session-Token (nur für Demo-Zwecke).
     * @returns {string} Ein zufällig generierter Token.
     * @deprecated Diese Funktion sollte in einer Produktivumgebung nicht verwendet werden.
     *             Tokens müssen sicher serverseitig generiert werden.
     */
    function generateSessionToken() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 32; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `demo_token_${token}`; // Präfix zur Kennzeichnung als Demo-Token
    }
    
    /**
     * Leitet den Benutzer zum Dashboard weiter.
     * Versucht zuerst `dashboard.html`, fällt bei Nichtverfügbarkeit auf `index.html` zurück.
     */
    function redirectToDashboard() {
        console.log('🚀 Weiterleitung zum Mission Control Dashboard');
        
        const dashboardUrl = 'dashboard.html'; // Primäres Ziel
        const fallbackUrl = 'index.html';    // Fallback-Ziel
        
        // Überprüfen, ob dashboard.html erreichbar ist (einfacher HEAD-Request)
        fetch(dashboardUrl, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    window.location.href = dashboardUrl; // Weiterleitung zu dashboard.html
                } else {
                    // dashboard.html nicht gefunden oder Fehler, Fallback zu index.html
                    console.warn(`Dashboard (${dashboardUrl}) nicht erreichbar, Fallback zu ${fallbackUrl}`);
                    window.location.href = fallbackUrl;
                }
            })
            .catch(() => {
                // Netzwerkfehler oder anderer Fehler beim fetch, Fallback zu index.html
                console.error(`Fehler beim Prüfen von ${dashboardUrl}, Fallback zu ${fallbackUrl}`);
                window.location.href = fallbackUrl;
            });
    }
    
    /**
     * Stellt Debug-Funktionen im `window`-Objekt bereit, wenn die Seite
     * auf localhost oder 127.0.0.1 ausgeführt wird.
     */
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.navaroLoginDebug = {
            /** Zeigt alle relevanten im LocalStorage gespeicherten Daten an. */
            showStoredData: function() {
                console.group('🔧 Navaro Login Debug - Gespeicherte Daten:');
                console.log('Session Token:', localStorage.getItem(authUtils.AUTH_CONFIG.TOKEN_KEY));
                const expiry = localStorage.getItem(authUtils.AUTH_CONFIG.EXPIRY_KEY);
                console.log('Session Expiry:', expiry ? new Date(parseInt(expiry)) : 'Nicht gesetzt');
                const userData = localStorage.getItem(authUtils.AUTH_CONFIG.USER_DATA_KEY);
                console.log('User Data:', userData ? JSON.parse(userData) : 'Nicht gesetzt');
                console.log('Login Attempts:', localStorage.getItem(authUtils.AUTH_CONFIG.LOGIN_ATTEMPTS_KEY));
                console.log('Last Attempt Time:', localStorage.getItem(authUtils.AUTH_CONFIG.LAST_ATTEMPT_KEY) ? new Date(parseInt(localStorage.getItem(authUtils.AUTH_CONFIG.LAST_ATTEMPT_KEY))) : 'Nicht gesetzt');
                console.log('Remember Me:', localStorage.getItem(authUtils.AUTH_CONFIG.REMEMBER_ME_KEY));
                console.log('Saved Username:', localStorage.getItem(authUtils.AUTH_CONFIG.SAVED_USERNAME_KEY));
                console.groupEnd();
            },
            
            /** Löscht alle Navaro-spezifischen Session- und Login-Daten aus dem LocalStorage und lädt die Seite neu. */
            clearAllNavaroData: function() {
                Object.values(authUtils.AUTH_CONFIG).forEach(key => {
                    if (typeof key === 'string') { // Sicherstellen, dass es ein Schlüsselname ist
                        localStorage.removeItem(key);
                    }
                });
                console.log('🧹 Alle Navaro-spezifischen Daten aus LocalStorage gelöscht.');
                location.reload();
            },
            
            /** Führt einen automatischen Login mit den angegebenen (oder Demo-) Daten durch. */
            autoLogin: function(username = 'demo', password = 'demo') {
                elements.username.value = username;
                elements.password.value = password;
                elements.form.requestSubmit(); // Löst den Submit-Handler aus
            },
            
            /** Simuliert einen Lockout-Zustand, indem maximale Login-Versuche gesetzt werden. */
            simulateLockout: function() {
                // Setzt Versuche auf Maximum über authUtils
                for (let i = 0; i < (authUtils.AUTH_CONFIG?.MAX_LOGIN_ATTEMPTS || config.maxAttempts); i++) {
                    authUtils.incrementLoginAttempts();
                }
                console.log(`🔧 Lockout simuliert. ${authUtils.AUTH_CONFIG?.MAX_LOGIN_ATTEMPTS || config.maxAttempts} Versuche registriert.`);
                location.reload(); // Seite neu laden, um Lockout-Status zu prüfen
            }
        };
        
        console.log('🔧 Debug-Funktionen verfügbar unter: window.navaroLoginDebug');
    }
});

/**
 * Service Worker Registrierung (Optional).
 * Dient der Bereitstellung von Offline-Funktionalitäten oder Caching-Strategien.
 * Die Datei `sw.js` müsste entsprechend implementiert werden.
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js') // Pfad zur Service Worker Datei
            .then(function(registration) {
                // Registrierung erfolgreich
                console.log('ServiceWorker erfolgreich registriert mit Scope:', registration.scope);
            })
            .catch(function(err) {
                // Registrierung fehlgeschlagen
                console.log('ServiceWorker Registrierung fehlgeschlagen:', err);
            });
    });
}
