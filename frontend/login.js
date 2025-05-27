/**
 * Navaro Login System - Authentifizierungs-Controller
 * Sicherer Login für taktische Fahrzeugsteuerung
 * Entwickelt für kritische Rettungs- und Erkundungsmissionen
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🛡️ Navaro Login System initialisiert');
    
    // DOM-Elemente
    const elements = {
        form: document.getElementById('loginForm'),
        username: document.getElementById('username'),
        password: document.getElementById('password'),
        passwordToggle: document.getElementById('passwordToggle'),
        rememberMe: document.getElementById('rememberMe'),
        loginButton: document.getElementById('loginButton'),
        loadingSpinner: document.getElementById('loadingSpinner'),
        alertContainer: document.getElementById('alertContainer')
    };
    
    // Login-Status und Konfiguration
    const config = {
        maxAttempts: 3,
        lockoutTime: 5 * 60 * 1000, // 5 Minuten
        sessionTimeout: 30 * 60 * 1000, // 30 Minuten
        rememberMeTime: 30 * 24 * 60 * 60 * 1000 // 30 Tage
    };
    
    let loginAttempts = parseInt(localStorage.getItem('navaro_login_attempts') || '0');
    let lastAttempt = parseInt(localStorage.getItem('navaro_last_attempt') || '0');
    
    // Initialisierung
    init();
    
    /**
     * System-Initialisierung
     * Prüft vorhandene Sessions und Setup der Event-Listener
     */
    function init() {
        checkExistingSession();
        setupEventListeners();
        checkLockoutStatus();
        updateLoginButtonState();
        
        // Auto-Fokus auf Username-Feld
        setTimeout(() => {
            elements.username.focus();
        }, 500);
        
        console.log('✅ Login-System bereit für Authentifizierung');
    }
    
    /**
     * Event-Listener Setup
     * Bindet alle Interaktionen für das Login-Interface
     */
    function setupEventListeners() {
        // Formular-Submission
        elements.form.addEventListener('submit', handleLogin);
        
        // Passwort-Sichtbarkeit umschalten
        elements.passwordToggle.addEventListener('click', togglePasswordVisibility);
        
        // Enter-Taste für schnelle Anmeldung
        elements.username.addEventListener('keypress', handleEnterKey);
        elements.password.addEventListener('keypress', handleEnterKey);
        
        // Eingabe-Validierung in Echtzeit
        elements.username.addEventListener('input', handleInputChange);
        elements.password.addEventListener('input', handleInputChange);
        
        // Fokus-Effekte für bessere UX
        elements.username.addEventListener('focus', () => addFocusEffect(elements.username));
        elements.password.addEventListener('focus', () => addFocusEffect(elements.password));
        elements.username.addEventListener('blur', () => removeFocusEffect(elements.username));
        elements.password.addEventListener('blur', () => removeFocusEffect(elements.password));
        
        // Vergessenes Passwort (Placeholder)
        const forgotPassword = document.querySelector('.forgot-password');
        if (forgotPassword) {
            forgotPassword.addEventListener('click', handleForgotPassword);
        }
    }
    
    /**
     * Prüfung auf vorhandene Session
     * Auto-Login für bereits authentifizierte Benutzer
     */
    function checkExistingSession() {
        const sessionToken = localStorage.getItem('navaro_session_token');
        const sessionExpiry = parseInt(localStorage.getItem('navaro_session_expiry') || '0');
        const rememberMe = localStorage.getItem('navaro_remember_me') === 'true';
        
        const now = Date.now();
        
        if (sessionToken && sessionExpiry > now) {
            console.log('🔐 Aktive Session gefunden - Auto-Login');
            showAlert('Vorhandene Session erkannt. Weiterleitung zum Dashboard...', 'success');
            
            setTimeout(() => {
                redirectToDashboard();
            }, 1500);
            
            return true;
        }
        
        if (rememberMe) {
            const savedUsername = localStorage.getItem('navaro_saved_username');
            if (savedUsername) {
                elements.username.value = savedUsername;
                elements.rememberMe.checked = true;
                elements.password.focus();
            }
        }
        
        return false;
    }
    
    /**
     * Lockout-Status prüfen
     * Sicherheitsmaßnahme gegen Brute-Force-Angriffe
     */
    function checkLockoutStatus() {
        const now = Date.now();
        
        if (loginAttempts >= config.maxAttempts) {
            const timeRemaining = (lastAttempt + config.lockoutTime) - now;
            
            if (timeRemaining > 0) {
                const minutes = Math.ceil(timeRemaining / 60000);
                showAlert(`Konto temporär gesperrt. Versuchen Sie es in ${minutes} Minute(n) erneut.`, 'warning');
                disableLoginForm(timeRemaining);
                return true;
            } else {
                // Lockout abgelaufen - Reset
                loginAttempts = 0;
                localStorage.removeItem('navaro_login_attempts');
                localStorage.removeItem('navaro_last_attempt');
            }
        }
        
        return false;
    }
    
    /**
     * Login-Behandlung
     * Hauptfunktion für die Benutzerauthentifizierung
     */
    async function handleLogin(event) {
        event.preventDefault();
        
        if (checkLockoutStatus()) {
            return;
        }
        
        const username = elements.username.value.trim();
        const password = elements.password.value;
        const rememberMe = elements.rememberMe.checked;
        
        // Eingabe-Validierung
        if (!validateInput(username, password)) {
            return;
        }
        
        // Login-Prozess starten
        setLoginState('loading');
        clearAlerts();
        
        try {
            console.log('🔐 Authentifizierung gestartet für:', username);
            
            // Simulierte Authentifizierung (später durch echte API ersetzen)
            const authResult = await authenticateUser(username, password);
            
            if (authResult.success) {
                handleSuccessfulLogin(authResult, rememberMe);
            } else {
                handleFailedLogin(authResult.message);
            }
            
        } catch (error) {
            console.error('❌ Login-Fehler:', error);
            handleFailedLogin('Verbindungsfehler. Bitte versuchen Sie es erneut.');
        }
    }
    
    /**
     * Benutzer-Authentifizierung
     * Simuliert Kommunikation mit Backend-API
     */
    async function authenticateUser(username, password) {
        // Simulation einer API-Anfrage mit Verzögerung
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Demo-Credentials (später durch echte API-Validierung ersetzen)
        const validCredentials = [
            { username: 'admin', password: 'navaro2025', role: 'administrator' },
            { username: 'operator', password: 'rescue123', role: 'operator' },
            { username: 'mission', password: 'control456', role: 'mission_control' },
            { username: 'demo', password: 'demo', role: 'demo_user' }
        ];
        
        const user = validCredentials.find(u => 
            u.username === username.toLowerCase() && u.password === password
        );
        
        if (user) {
            return {
                success: true,
                token: generateSessionToken(),
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
                message: 'Ungültige Anmeldedaten. Bitte überprüfen Sie Benutzername und Passwort.'
            };
        }
    }
    
    /**
     * Erfolgreiche Anmeldung verarbeiten
     * Session erstellen und Weiterleitung
     */
    function handleSuccessfulLogin(authResult, rememberMe) {
        console.log('✅ Anmeldung erfolgreich:', authResult.user.username);
        
        // Login-Versuche zurücksetzen
        loginAttempts = 0;
        localStorage.removeItem('navaro_login_attempts');
        localStorage.removeItem('navaro_last_attempt');
        
        // Session speichern
        const sessionExpiry = Date.now() + config.sessionTimeout;
        localStorage.setItem('navaro_session_token', authResult.token);
        localStorage.setItem('navaro_session_expiry', sessionExpiry.toString());
        localStorage.setItem('navaro_user_data', JSON.stringify(authResult.user));
        
        // Remember Me verarbeiten
        if (rememberMe) {
            localStorage.setItem('navaro_remember_me', 'true');
            localStorage.setItem('navaro_saved_username', authResult.user.username);
            
            // Extended Session für Remember Me
            const extendedExpiry = Date.now() + config.rememberMeTime;
            localStorage.setItem('navaro_session_expiry', extendedExpiry.toString());
        } else {
            localStorage.removeItem('navaro_remember_me');
            localStorage.removeItem('navaro_saved_username');
        }
        
        // Erfolgs-Nachricht anzeigen
        showAlert(`Willkommen zurück, ${authResult.user.username}! Weiterleitung zum Mission Control...`, 'success');
        
        // Weiterleitung nach kurzer Verzögerung
        setTimeout(() => {
            redirectToDashboard();
        }, 2000);
    }
    
    /**
     * Fehlgeschlagene Anmeldung verarbeiten
     * Sicherheitsmaßnahmen und Benutzer-Feedback
     */
    function handleFailedLogin(message) {
        console.log('❌ Anmeldung fehlgeschlagen');
        
        loginAttempts++;
        lastAttempt = Date.now();
        
        localStorage.setItem('navaro_login_attempts', loginAttempts.toString());
        localStorage.setItem('navaro_last_attempt', lastAttempt.toString());
        
        setLoginState('error');
        
        // Spezifische Fehlermeldungen basierend auf Versuchen
        if (loginAttempts >= config.maxAttempts) {
            const minutes = Math.ceil(config.lockoutTime / 60000);
            showAlert(`Maximale Anzahl von Anmeldeversuchen erreicht. Konto für ${minutes} Minuten gesperrt.`, 'danger');
            disableLoginForm(config.lockoutTime);
        } else {
            const remainingAttempts = config.maxAttempts - loginAttempts;
            showAlert(`${message} (${remainingAttempts} Versuch(e) verbleibend)`, 'danger');
        }
        
        // Formular nach Fehler zurücksetzen
        setTimeout(() => {
            setLoginState('normal');
            elements.password.value = '';
            elements.password.focus();
        }, 3000);
    }
    
    /**
     * Eingabe-Validierung
     * Prüft Vollständigkeit und Format der Eingaben
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
        
        if (password.length < 4) {
            showAlert('Passwort muss mindestens 4 Zeichen lang sein.', 'warning');
            elements.password.focus();
            return false;
        }
        
        return true;
    }
    
    /**
     * Login-Zustand verwalten
     * Visuelles Feedback für verschiedene Zustände
     */
    function setLoginState(state) {
        const button = elements.loginButton;
        const spinner = elements.loadingSpinner;
        
        // Alle Zustände zurücksetzen
        button.classList.remove('loading', 'error');
        button.disabled = false;
        
        switch (state) {
            case 'loading':
                button.classList.add('loading');
                button.disabled = true;
                break;
                
            case 'error':
                button.classList.add('error');
                // Button kurz rot färben
                setTimeout(() => {
                    button.classList.remove('error');
                }, 1000);
                break;
                
            case 'normal':
            default:
                // Normaler Zustand, bereits durch reset erreicht
                break;
        }
        
        updateLoginButtonState();
    }
    
    /**
     * Login-Button Zustand aktualisieren
     * Aktiviert/deaktiviert basierend auf Eingaben
     */
    function updateLoginButtonState() {
        const hasUsername = elements.username.value.trim().length > 0;
        const hasPassword = elements.password.value.length > 0;
        const isNotLoading = !elements.loginButton.classList.contains('loading');
        
        elements.loginButton.disabled = !(hasUsername && hasPassword && isNotLoading);
    }
    
    /**
     * Passwort-Sichtbarkeit umschalten
     * Toggle zwischen Passwort-Eingabe und Klartext
     */
    function togglePasswordVisibility() {
        const passwordInput = elements.password;
        const toggleIcon = elements.passwordToggle.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
        
        // Fokus beibehalten
        passwordInput.focus();
    }
    
    /**
     * Enter-Taste Behandlung
     * Ermöglicht schnelle Navigation zwischen Feldern
     */
    function handleEnterKey(event) {
        if (event.key === 'Enter') {
            if (event.target === elements.username) {
                event.preventDefault();
                elements.password.focus();
            } else if (event.target === elements.password) {
                event.preventDefault();
                if (!elements.loginButton.disabled) {
                    elements.form.requestSubmit();
                }
            }
        }
    }
    
    /**
     * Eingabe-Änderungen verarbeiten
     * Echtzeit-Validierung und Button-Status
     */
    function handleInputChange(event) {
        updateLoginButtonState();
        
        // Fehler-Nachrichten ausblenden bei neuer Eingabe
        if (event.target.value.trim()) {
            clearAlerts();
        }
    }
    
    /**
     * Fokus-Effekte für bessere UX
     */
    function addFocusEffect(element) {
        element.parentElement.classList.add('focused');
    }
    
    function removeFocusEffect(element) {
        element.parentElement.classList.remove('focused');
    }
    
    /**
     * Vergessenes Passwort verarbeiten
     * Placeholder für zukünftige Funktionalität
     */
    function handleForgotPassword(event) {
        event.preventDefault();
        showAlert('Bitte wenden Sie sich an Ihren Systemadministrator für Passwort-Reset.', 'warning');
    }
    
    /**
     * Formular für bestimmte Zeit deaktivieren
     * Sicherheitsmaßnahme nach zu vielen Versuchen
     */
    function disableLoginForm(duration) {
        elements.loginButton.disabled = true;
        elements.username.disabled = true;
        elements.password.disabled = true;
        
        let remainingTime = Math.ceil(duration / 1000);
        
        const countdown = setInterval(() => {
            remainingTime--;
            
            if (remainingTime <= 0) {
                clearInterval(countdown);
                elements.loginButton.disabled = false;
                elements.username.disabled = false;
                elements.password.disabled = false;
                clearAlerts();
                showAlert('Sie können sich jetzt wieder anmelden.', 'success');
                elements.username.focus();
            }
        }, 1000);
    }
    
    /**
     * Alert-Nachrichten anzeigen
     * Benutzer-Feedback für verschiedene Aktionen
     */
    function showAlert(message, type = 'info') {
        clearAlerts();
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        
        const icon = getAlertIcon(type);
        alertDiv.innerHTML = `<i class="${icon}"></i> ${message}`;
        
        elements.alertContainer.appendChild(alertDiv);
        
        // Auto-Remove für nicht-kritische Nachrichten
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                clearAlerts();
            }, 5000);
        }
    }
    
    /**
     * Icons für verschiedene Alert-Typen
     */
    function getAlertIcon(type) {
        switch (type) {
            case 'success': return 'fas fa-check-circle';
            case 'danger': return 'fas fa-exclamation-triangle';
            case 'warning': return 'fas fa-exclamation-circle';
            case 'info': return 'fas fa-info-circle';
            default: return 'fas fa-info-circle';
        }
    }
    
    /**
     * Alert-Container leeren
     */
    function clearAlerts() {
        elements.alertContainer.innerHTML = '';
    }
    
    /**
     * Session-Token generieren
     * Einfache Token-Generierung für Demo-Zwecke
     */
    function generateSessionToken() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 32; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }
    
    /**
     * Weiterleitung zum Dashboard
     * Navigation nach erfolgreicher Authentifizierung
     */
    function redirectToDashboard() {
        console.log('🚀 Weiterleitung zum Mission Control Dashboard');
        
        // Prüfen ob dashboard.html existiert, ansonsten index.html verwenden
        const dashboardUrl = 'dashboard.html';
        const fallbackUrl = 'index.html';
        
        // Versuche dashboard.html zu laden
        fetch(dashboardUrl, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    window.location.href = dashboardUrl;
                } else {
                    window.location.href = fallbackUrl;
                }
            })
            .catch(() => {
                window.location.href = fallbackUrl;
            });
    }
    
    /**
     * Debug-Funktionen für Entwicklung
     * Nur in Entwicklungsumgebung verfügbar
     */
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.navaroLoginDebug = {
            // Alle gespeicherten Daten anzeigen
            showStoredData: function() {
                console.log('🔧 Navaro Login Debug - Gespeicherte Daten:');
                console.log('Session Token:', localStorage.getItem('navaro_session_token'));
                console.log('Session Expiry:', new Date(parseInt(localStorage.getItem('navaro_session_expiry') || '0')));
                console.log('User Data:', JSON.parse(localStorage.getItem('navaro_user_data') || '{}'));
                console.log('Login Attempts:', localStorage.getItem('navaro_login_attempts'));
                console.log('Remember Me:', localStorage.getItem('navaro_remember_me'));
            },
            
            // Session zurücksetzen
            clearSession: function() {
                ['navaro_session_token', 'navaro_session_expiry', 'navaro_user_data', 
                 'navaro_login_attempts', 'navaro_last_attempt', 'navaro_remember_me', 
                 'navaro_saved_username'].forEach(key => localStorage.removeItem(key));
                console.log('🧹 Session-Daten gelöscht');
                location.reload();
            },
            
            // Auto-Login für Tests
            autoLogin: function(username = 'demo', password = 'demo') {
                elements.username.value = username;
                elements.password.value = password;
                elements.form.requestSubmit();
            },
            
            // Lockout simulieren
            simulateLockout: function() {
                loginAttempts = config.maxAttempts;
                lastAttempt = Date.now();
                localStorage.setItem('navaro_login_attempts', loginAttempts.toString());
                localStorage.setItem('navaro_last_attempt', lastAttempt.toString());
                location.reload();
            }
        };
        
        console.log('🔧 Debug-Funktionen verfügbar: navaroLoginDebug');
    }
});

/**
 * Service Worker Registration (Optional)
 * Für erweiterte Offline-Funktionalität
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registriert:', registration.scope);
            })
            .catch(function(err) {
                console.log('ServiceWorker Registrierung fehlgeschlagen:', err);
            });
    });
}
