/**
 * Joystick-Steuerungsmodul für Navaro
 * 
 * Dieses Modul implementiert eine vollständige Joystick-Steuerung für das Navaro-Fahrzeug.
 * Es behandelt sowohl Maus- als auch Touch-Eingaben und sendet Steuerungsbefehle an das Backend.
 * 
 * Hauptfunktionen:
 * - Drag-and-Drop Joystick-Steuerung
 * - Multi-Touch-Unterstützung für mobile Geräte
 * - Echtzeit-Bewegungsberechnung mit Normalisierung
 * - Throttling von API-Aufrufen für Performance-Optimierung
 * - Visuelle Rückmeldung über Geschwindigkeit und Richtung
 * 
 * @author Navaro Development Team
 * @version 1.0.0
 */

import { apiService } from './api.js';

/**
 * JoystickController - Hauptklasse für Joystick-Steuerung
 * 
 * Diese Klasse verwaltet die komplette Joystick-Funktionalität einschließlich:
 * - Event-Handling für Maus und Touch
 * - Positionsberechnung und Begrenzung
 * - Kommunikation mit dem Backend-API
 * - UI-Updates für Benutzerfeedback
 */
export class JoystickController {
    /**
     * Konstruktor für JoystickController
     * 
     * Initialisiert den Joystick-Controller mit dem angegebenen Container-Element.
     * Richtet alle notwendigen Event-Listener ein und konfiguriert die Steuerung.
     * 
     * @param {string} containerId - ID des HTML-Elements, das den Joystick enthält (Standard: 'joystick')
     */
    constructor(containerId = 'joystick') {
        // DOM-Elemente referenzieren
        this.joystick = document.getElementById(containerId);
        this.container = this.joystick?.parentElement;
        
        // Zustandsvariablen für Drag-Operationen
        this.active = false;           // Gibt an, ob der Joystick aktuell gedraggt wird
        this.offsetX = 0;             // X-Offset vom Mauszeiger zum Joystick-Zentrum
        this.offsetY = 0;             // Y-Offset vom Mauszeiger zum Joystick-Zentrum
        this.containerRect = null;     // Bounding Rectangle des Container-Elements
        
        // Command-Tracking für Optimierung
        this.lastCommand = { x: 0, y: 0, speed: 0 };  // Letzter gesendeter Befehl
        this.commandThrottle = null;   // Timeout-Handle für Command-Throttling
        
        // Initialisierung starten
        this.init();
    }

    /**
     * Initialisierung des Joystick-Controllers
     * 
     * Überprüft die Verfügbarkeit der DOM-Elemente und startet die Konfiguration.
     * Bricht ab, wenn wichtige Elemente nicht gefunden werden.
     */
    init() {
        // Validierung der DOM-Elemente
        if (!this.joystick || !this.container) {
            console.warn('Joystick-Elemente nicht gefunden');
            return;
        }

        // Container-Grenzen aktualisieren
        this.updateLimits();
        
        // Event-Listener einrichten
        this.setupEventListeners();
        
        console.log('🎮 Joystick-Controller initialisiert');
    }

    /**
     * Container-Grenzen aktualisieren
     * 
     * Berechnet die aktuellen Dimensionen und Position des Container-Elements.
     * Diese Werte werden für die Joystick-Positionsberechnung benötigt.
     * Sollte bei Fenstergrößenänderungen aufgerufen werden.
     */
    updateLimits() {
        if (this.container) {
            // Bounding Rectangle des Containers für Positionsberechnungen
            this.containerRect = this.container.getBoundingClientRect();
        }
    }

    /**
     * Event-Listener Setup
     * 
     * Richtet alle notwendigen Event-Listener für Maus- und Touch-Interaktionen ein.
     * Behandelt sowohl Desktop- als auch Mobile-Geräte mit entsprechenden Events.
     */
    setupEventListeners() {
        // Fenstergrößenänderung - Container-Grenzen neu berechnen
        window.addEventListener('resize', () => this.updateLimits());

        // Maus-Events für Desktop-Interaktion
        this.joystick.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.endDrag());

        // Touch-Events für Mobile-Geräte
        // passive: false erlaubt preventDefault() um Scrolling zu verhindern
        this.joystick.addEventListener('touchstart', (e) => this.startDrag(e.touches[0]), { passive: false });
        document.addEventListener('touchmove', (e) => this.drag(e.touches[0]), { passive: false });
        document.addEventListener('touchend', () => this.endDrag());
    }

    /**
     * Drag-Operation starten
     * 
     * Wird aufgerufen, wenn der Benutzer beginnt, den Joystick zu ziehen.
     * Berechnet den Offset zwischen Mausposition und Joystick-Zentrum.
     * 
     * @param {MouseEvent|Touch} event - Maus- oder Touch-Event
     */
    startDrag(event) {
        // Drag-Zustand aktivieren
        this.active = true;
        
        // Container-Grenzen aktualisieren für genaue Berechnungen
        this.updateLimits();
        
        // Joystick-Position relativ zum Viewport
        const joystickRect = this.joystick.getBoundingClientRect();
        
        // Offset berechnen: Differenz zwischen Klickposition und Joystick-Zentrum
        this.offsetX = event.clientX - joystickRect.left - joystickRect.width / 2;
        this.offsetY = event.clientY - joystickRect.top - joystickRect.height / 2;
        
        // Visuelles Feedback: Cursor ändern
        this.joystick.style.cursor = 'grabbing';
        
        // Standard-Browser-Verhalten verhindern (Textauswahl, etc.)
        if (event.preventDefault) {
            event.preventDefault();
        }
    }

    /**
     * Drag-Operation durchführen
     * 
     * Wird kontinuierlich aufgerufen, während der Joystick gezogen wird.
     * Berechnet die neue Position, wendet Begrenzungen an und sendet Befehle.
     * 
     * @param {MouseEvent|Touch} event - Maus- oder Touch-Event mit aktueller Position
     */
    drag(event) {
        // Nur verarbeiten, wenn Drag aktiv ist und Container verfügbar
        if (!this.active || !this.containerRect) return;
        
        // Standard-Browser-Verhalten verhindern (Scrolling auf Mobile)
        if (event.preventDefault) {
            event.preventDefault();
        }

        // Container-Zentrum berechnen
        const centerX = this.containerRect.width / 2;
        const centerY = this.containerRect.height / 2;
        
        // Maximaler Radius: Joystick soll im Container bleiben
        const maxRadius = (this.containerRect.width - this.joystick.offsetWidth) / 2;

        // Delta-Werte: Abstand vom Zentrum unter Berücksichtigung des Offsets
        let deltaX = event.clientX - this.containerRect.left - centerX - this.offsetX;
        let deltaY = event.clientY - this.containerRect.top - centerY - this.offsetY;

        // Radiusbegrenzung anwenden: Joystick im Kreis halten
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance > maxRadius) {
            // Position auf Kreisrand projizieren
            const angle = Math.atan2(deltaY, deltaX);
            deltaX = Math.cos(angle) * maxRadius;
            deltaY = Math.sin(angle) * maxRadius;
        }

        // Joystick-Position visuell aktualisieren
        this.joystick.style.left = (centerX + deltaX) + 'px';
        this.joystick.style.top = (centerY + deltaY) + 'px';
        this.joystick.style.transform = 'translate(-50%, -50%)';

        // Normalisierte Werte berechnen (-1 bis 1)
        const normalizedX = deltaX / maxRadius;
        const normalizedY = -deltaY / maxRadius; // Y-Achse umkehren (oben = positiv)

        // UI und Backend mit neuen Werten aktualisieren
        this.updateDisplay(normalizedX, normalizedY, distance / maxRadius);
        this.sendCommand(normalizedX, normalizedY, distance / maxRadius);
    }

    /**
     * Drag-Operation beenden
     * 
     * Wird aufgerufen, wenn der Benutzer den Joystick loslässt.
     * Setzt den Joystick in die Ausgangsposition zurück und stoppt das Fahrzeug.
     */
    endDrag() {
        // Nur verarbeiten, wenn Drag aktiv war
        if (!this.active) return;
        
        // Drag-Zustand deaktivieren
        this.active = false;
        
        // Joystick visuell zum Mittelpunkt zurücksetzen
        this.joystick.style.left = '50%';
        this.joystick.style.top = '50%';
        this.joystick.style.transform = 'translate(-50%, -50%)';
        this.joystick.style.cursor = 'grab';
        
        // UI zurücksetzen und Stop-Befehl senden
        this.updateDisplay(0, 0, 0);
        this.sendCommand(0, 0, 0);
    }

    /**
     * UI-Anzeige aktualisieren
     * 
     * Aktualisiert alle UI-Elemente mit den aktuellen Joystick-Werten.
     * Zeigt Position, Geschwindigkeit und Richtung in verschiedenen Elementen an.
     * 
     * @param {number} normalizedX - X-Koordinate normalisiert (-1 bis 1)
     * @param {number} normalizedY - Y-Koordinate normalisiert (-1 bis 1)
     * @param {number} speedPercent - Geschwindigkeit als Prozentsatz (0 bis 1)
     */
    updateDisplay(normalizedX, normalizedY, speedPercent) {
        // Geschwindigkeit in Prozent umrechnen
        const speed = Math.round(speedPercent * 100);
        
        // Richtung basierend auf dominierender Achse bestimmen
        let direction = 'Stopp';
        if (speed > 5) { // Mindestgeschwindigkeit für Richtungsanzeige
            if (normalizedY > 0.5) direction = 'Vorwärts';
            else if (normalizedY < -0.5) direction = 'Rückwärts';
            else if (normalizedX > 0.5) direction = 'Rechts';
            else if (normalizedX < -0.5) direction = 'Links';
            else direction = 'Diagonal';
        }

        // Position-Anzeige aktualisieren
        const positionElement = document.getElementById('joystickPosition');
        if (positionElement) {
            positionElement.textContent = `X:${normalizedX.toFixed(1)}, Y:${normalizedY.toFixed(1)}`;
        }

        // Geschwindigkeits-Anzeige mit farbkodierter Warnung
        const speedElement = document.getElementById('speed');
        if (speedElement) {
            speedElement.textContent = `${speed}%`;
            // Farbkodierung: Grün (niedrig) -> Gelb (mittel) -> Rot (hoch)
            speedElement.className = speed > 50 ? 'fw-bold text-danger' : 
                                    speed > 20 ? 'fw-bold text-warning' : 'fw-bold text-success';
        }

        // Richtungs-Anzeige
        const directionElement = document.getElementById('direction');
        if (directionElement) {
            directionElement.textContent = direction;
            directionElement.className = direction === 'Stopp' ? 'fw-bold text-warning' : 'fw-bold text-info';
        }

        // Globale Dashboard-Geschwindigkeitsanzeige (simulierte km/h)
        const speedDisplay = document.getElementById('speed-display');
        if (speedDisplay) {
            // Umrechnung: 100% Joystick = ca. 30 km/h Maximalgeschwindigkeit
            speedDisplay.textContent = `${Math.round(speed * 0.3)} km/h`;
        }
    }

    /**
     * Bewegungsbefehl an Backend senden
     * 
     * Sendet die aktuellen Joystick-Werte an das Backend-API.
     * Implementiert Throttling um die Anzahl der API-Aufrufe zu begrenzen.
     * 
     * @param {number} x - X-Koordinate normalisiert (-1 bis 1)
     * @param {number} y - Y-Koordinate normalisiert (-1 bis 1) 
     * @param {number} speed - Geschwindigkeit normalisiert (0 bis 1)
     */
    sendCommand(x, y, speed) {
        // Vorherigen Throttle-Timer löschen
        if (this.commandThrottle) {
            clearTimeout(this.commandThrottle);
        }

        // Neuen Timer setzen für verzögerte Ausführung
        this.commandThrottle = setTimeout(async () => {
            try {
                // Schwellwert für Änderungen: Nur bei signifikanten Unterschieden senden
                const threshold = 0.05;
                if (Math.abs(x - this.lastCommand.x) > threshold ||
                    Math.abs(y - this.lastCommand.y) > threshold ||
                    Math.abs(speed - this.lastCommand.speed) > threshold) {
                    
                    // Bewegungsbefehl-Objekt erstellen
                    const command = {
                        x: x,              // Horizontale Bewegung (-1 = links, 1 = rechts)
                        y: y,              // Vertikale Bewegung (-1 = rückwärts, 1 = vorwärts)
                        speed: speed,      // Geschwindigkeitsintensität (0 = stopp, 1 = maximum)
                        timestamp: Date.now()  // Zeitstempel für Latenz-Tracking
                    };
                    
                    // API-Aufruf an Backend
                    await apiService.movement.sendCommand(command);
                    
                    // Letzten Befehl für nächste Vergleiche speichern
                    this.lastCommand = { x, y, speed };
                }
            } catch (error) {
                // Fehler protokollieren, aber Benutzerinteraktion nicht unterbrechen
                console.warn('⚠️ Bewegungsbefehl konnte nicht gesendet werden:', error.message);
            }
        }, 50); // 50ms Throttle-Zeit für flüssige aber optimierte Steuerung
    }

    // Öffentliche Methoden für externe Steuerung

    /**
     * Joystick aktivieren
     * 
     * Aktiviert die Joystick-Interaktion und macht ihn visuell verfügbar.
     * Nützlich nach temporärer Deaktivierung oder bei Verbindungswiederherstellung.
     */
    enable() {
        this.joystick.style.pointerEvents = 'auto';  // Maus-/Touch-Events erlauben
        this.joystick.style.opacity = '1';           // Vollständig sichtbar
    }

    /**
     * Joystick deaktivieren
     * 
     * Deaktiviert die Joystick-Interaktion und zeigt visuell den deaktivierten Zustand.
     * Stoppt laufende Drag-Operationen und macht den Joystick uninteraktiv.
     */
    disable() {
        this.endDrag();                               // Laufende Operationen beenden
        this.joystick.style.pointerEvents = 'none';  // Interaktion deaktivieren
        this.joystick.style.opacity = '0.5';         // Visuell als deaktiviert anzeigen
    }

    /**
     * Joystick zurücksetzen
     * 
     * Setzt den Joystick in die Ausgangsposition zurück ohne ihn zu deaktivieren.
     * Nützlich für Notfälle oder manuelle Reset-Operationen.
     */
    reset() {
        this.endDrag(); // Automatisches Reset durch endDrag-Funktionalität
    }
}

// Globale Instanz-Verwaltung

/**
 * Globale Joystick-Controller-Instanz
 * Wird automatisch erstellt, wenn das DOM bereit ist
 */
let joystickController = null;

/**
 * Joystick-Initialisierung
 * 
 * Sucht nach dem Joystick-Element im DOM und erstellt eine Controller-Instanz.
 * Wird automatisch aufgerufen, wenn das DOM geladen ist.
 * 
 * @returns {JoystickController|null} Controller-Instanz oder null falls Element nicht gefunden
 */
function initJoystick() {
    if (document.getElementById('joystick')) {
        joystickController = new JoystickController();
        return joystickController;
    }
    return null;
}

// Automatische Initialisierung basierend auf DOM-Zustand
if (document.readyState === 'loading') {
    // DOM lädt noch - Event-Listener für DOMContentLoaded
    document.addEventListener('DOMContentLoaded', initJoystick);
} else {
    // DOM bereits geladen - sofort initialisieren
    initJoystick();
}

// Exports für Module-System
export { joystickController };
export default JoystickController;
