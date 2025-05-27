# Navaro - Dark Earth-Tone Theme Dokumentation

## Übersicht
Das **Navaro Dark Earth-Tone Theme** wurde speziell für Rettungs- und Erkundungsmissionen entwickelt. Es bietet eine optimale Benutzeroberfläche für 24/7-Einsätze mit reduzierter Augenbelastung und hohem Kontrast für kritische Situationen.

## Farbpalette

### Hauptfarben
- **Primary**: `#3A4D39` (Dunkler Schiefer-Grün) - Robustheit und Vertrauen
- **Secondary**: `#1F2F1F` (Tiefes Tannengrün) - Taktische Sicherheit
- **Accent**: `#FF8C42` (Bernstein-Orange) - Kritische Aufmerksamkeit
- **Background**: `#1E1E1E` (Anthrazit-Schwarz) - Reduzierte Augenbelastung
- **Surface**: `#2A2A2A` (Dunkler Granit) - Oberflächenelemente

### Funktionale Farben
- **Warning**: `#CC7A00` (Rost-Orange) - Warnungen
- **Success**: `#4A6741` (Taktisches Grün) - Erfolg/Bestätigung
- **Danger**: `#8B2635` (Dunkles Rot) - Kritische Zustände

### Textfarben
- **Primary Text**: `#E8D5B7` (Warmes Beige) - Optimale Lesbarkeit
- **Secondary Text**: `#B8A082` (Gedämpftes Beige) - Sekundärtext
- **Muted Text**: `#8A7B6B` (Gedämpfter Text) - Weniger wichtige Informationen

## Design-Prinzipien

### 1. Reduzierte Augenbelastung
- Dunkle Hintergründe für lange Einsätze
- Warme Textfarben für angenehme Lesbarkeit
- Minimale Helligkeit bei hohem Kontrast

### 2. Taktische Funktionalität
- Bernstein-Orange Akzente für kritische Aktionen
- Klare Zustandsindikatoren durch Farbcodierung
- Intuitive Navigation mit visuellen Rückmeldungen

### 3. Robustes Interface
- Starke Schatten und Glüheffekte für Tiefe
- Responsive Design für verschiedene Geräte
- Konsistente Interaktionsmuster

## Komponenten-Styling

### Navigation
- **Sidebar**: Dunkler Gradient mit Bernstein-Akzenten
- **Navbar**: Minimalistisch mit taktischen Badges
- **Links**: Hover-Effekte mit Glüh-Animation

### Steuerungsinterface
- **Joystick**: Hochkontrast mit Glüheffekten
- **Video-Container**: Robuste Rahmen für Feldüberwachung
- **Status-Display**: Klare Informationsdarstellung

### Interaktive Elemente
- **Buttons**: Gradient mit Bernstein-Hervorhebung
- **Cards**: Subtile Schatten mit Hover-Transformation
- **Forms**: Dunkle Hintergründe mit Akzent-Fokus

## CSS Custom Properties

Alle Farben werden über CSS Custom Properties verwaltet:

```css
:root {
    --navaro-primary: #3A4D39;
    --navaro-accent: #FF8C42;
    --navaro-dark: #1E1E1E;
    --navaro-text-primary: #E8D5B7;
    /* ... weitere Properties */
}
```

## Responsive Design

### Mobile Optimierung
- Kompaktere Joystick-Steuerung (150px)
- Reduzierte Padding für bessere Platznutzung
- Optimierte Textgrößen für kleinere Bildschirme

### Desktop-Erfahrung
- Vollständige Seitenleiste mit erweiterten Funktionen
- Größere Interaktionsbereiche
- Verbesserte Hover-Effekte

## Accessibility Features

### Kontrast
- WCAG 2.1 AA konform
- Hoher Kontrast für kritische Aktionen
- Klare Zustandsindikatoren

### Navigation
- Tastaturfreundliche Bedienung
- Fokus-Indikatoren mit Glüheffekten
- Semantische HTML-Struktur

## Technische Implementation

### Browser-Unterstützung
- Moderne CSS-Features (Custom Properties, Gradients)
- Fallbacks für ältere Browser
- Progressive Enhancement

### Performance
- Minimale CSS-Größe durch Variablen
- Hardware-beschleunigte Animationen
- Optimierte Schatten und Effekte

## Wartung und Erweiterung

### Theme-Anpassungen
Alle Farben können zentral über die CSS Custom Properties angepasst werden.

### Neue Komponenten
Folgen Sie den etablierten Designmustern:
1. Dunkle Hintergründe mit Gradients
2. Bernstein-Akzente für Interaktionen
3. Konsistente Schatten und Glüheffekte
4. Responsive Anpassungen

---

**Erstellt für**: Navaro Vehicle Control Interface  
**Version**: 1.0  
**Datum**: Mai 2025  
**Zweck**: 24/7 Rettungs- und Erkundungsmissionen
