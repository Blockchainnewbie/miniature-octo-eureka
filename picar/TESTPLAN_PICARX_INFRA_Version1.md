# Testplan – Picar-X Remote Infrastruktur

---

## **1. Zielsetzung**

Dieser Testplan definiert die notwendigen manuellen und automatisierten Tests, um die Funktionalität und Sicherheit des Picar-X-Setups (Frontend, Backend, VPN, Proxy, Hardware) zu gewährleisten.

---

## **2. Testbereiche**

- **A. VPN & Netzwerk**
- **B. Backend/Proxy (Login, Auth, Weiterleitung)**
- **C. Frontend (UI, Kommunikation, Security)**
- **D. Picar-X-Hardware (nur im Testnetz)**
- **E. CI/CD & Deployment**
- **F. Sicherheit**

---

## **3. Testfälle**

### **A. VPN & Netzwerk**

| Testfall      | Beschreibung                                  | Vorgehen                                                | Erwartetes Ergebnis                  |
|:--------------|:----------------------------------------------|:--------------------------------------------------------|:-------------------------------------|
| VPN-Setup     | WireGuard-Verbindung Pi ↔ Hetzner             | Pi: `wg show`, Hetzner: `ping 10.x.x.x`                 | Ping/UDP-Verkehr funktioniert        |
| Port-Check    | Port 8080/8765 im VPN erreichbar              | Hetzner: `curl ws://10.x.x.x:8765`, `curl ...:8080`     | Erfolgreiche Verbindung              |
| VPN-Drop-Test | VPN-Verbindung absichtlich trennen            | `wg-quick down wg0` auf Pi                              | Keine Verbindung, nach reconnect OK  |

---

### **B. Backend/Proxy**

| Testfall        | Beschreibung                                | Vorgehen                                                 | Erwartetes Ergebnis                       |
|:----------------|:--------------------------------------------|:---------------------------------------------------------|:------------------------------------------|
| Login           | /api/login mit korrektem/inkorrektem User   | API-Call mit HTTPie/Postman                              | 200 mit Token / 400 mit Error             |
| Refresh         | /api/refresh mit gültigem/ungültigem Token  | API-Call mit gültigem/abgelaufenem Refresh-Token         | 200 mit neuem Token / 401 bei Fehler      |
| WS-Proxy        | WebSocket-Handshake mit gültigem JWT        | Mit ws-Client verbinden `/ws?token=...`                  | Erfolgreiche Verbindung                   |
| Cam-Proxy       | MJPEG-Stream via `/camera`                  | Browser oder `curl` auf `/camera`                        | Laufender Stream, Bilddaten sichtbar      |
| Token-Expiry    | Zugriff mit abgelaufenem Token              | Token künstlich verfallen lassen, dann API/WS aufrufen   | 401 Unauthorized                         |

---

### **C. Frontend**

| Testfall           | Beschreibung                           | Vorgehen                                         | Erwartetes Ergebnis               |
|:-------------------|:---------------------------------------|:-------------------------------------------------|:----------------------------------|
| Login/Logout       | Login-UI, Logout-Button                | User einloggen, ausloggen                        | Sichtbarer Statuswechsel          |
| Steuerung          | Steuerkommandos senden                 | Knopf im UI drücken, Picar-X beobachten          | Befehl kommt an, Roboter reagiert |
| Kamera-Stream      | Cam-Bild im Browser anzeigen           | UI öffnen, Stream starten                        | Fließender Stream                 |
| Token Handling     | Token-Refresh im UI                    | Token künstlich ablaufen lassen, weiter bedienen  | Automatische Erneuerung           |
| Fehleranzeige      | Netzwerk/VPN-Ausfall simulieren        | VPN kappen, UI verwenden                         | Fehler-/Reconnect-Dialog          |

---

### **D. Picar-X Hardware**

| Testfall         | Beschreibung                    | Vorgehen                                    | Erwartetes Ergebnis              |
|:-----------------|:--------------------------------|:---------------------------------------------|:---------------------------------|
| Manöver          | Steuerbefehle auslösen          | Vor/Zurück/Lenken testen                     | Hardware bewegt sich wie erwartet|
| Kamera           | Cam-Modul funktioniert          | Stream im UI, ggf. physisch abdecken         | Bild spiegelt Realität           |
| Recovery         | Kabel ziehen, reconnect testen  | Hardware absichtlich trennen/verbinden       | Fehler erkannt, Recovery läuft   |
| Safety           | Bei Fehlern Stop auslösen       | Hardware-Reset/Fehler im Code simulieren     | Roboter geht in sicheren Modus   |

---

### **E. CI/CD & Deployment**

| Testfall        | Beschreibung                  | Vorgehen                         | Erwartetes Ergebnis          |
|:----------------|:------------------------------|:----------------------------------|:-----------------------------|
| Build           | GitHub Actions läuft durch    | Push auf main                    | Build, Test, Push OK         |
| Testabbruch     | Fehler im Test einfügen       | Test absichtlich fehlschlagen    | CI/CD bricht ab              |
| Docker Pull     | Image auf Picar-X aktualisieren| `docker pull/run` auf Pi         | Neues Image läuft            |
| Watchtower      | Automatisches Update testen   | Neues Image pushen               | Pi updatet automatisch       |

---

### **F. Sicherheit**

| Testfall            | Beschreibung                              | Vorgehen                                 | Erwartetes Ergebnis             |
|:--------------------|:------------------------------------------|:------------------------------------------|:-------------------------------|
| Brute Force API     | Falsche Logins mehrfach                   | Skript mit vielen Fehlversuchen           | Rate-Limit, Sperre, kein Login |
| Unbefugter Zugriff  | Ohne Token auf Proxy zugreifen            | `/ws` oder `/camera` ohne Token           | 401/403 Fehler                 |
| Token Leaks         | Versuchen, Token im Netzwerk abzufangen   | Mit Wireshark/Sniffer testen (über HTTPS) | Token nicht lesbar             |
| VPN-Bypass          | API/WS außerhalb VPN versuchen            | Externe IP nutzen                        | Kein Zugriff                   |
| Key/Secret-Check    | Secrets nicht im Repo                     | `grep` nach SECRET_KEY, Token etc.        | Keine Secrets im Code          |

---

## **4. Automatisierte Tests**

- [ ] pytest für Backend (auth, proxy, token-handling)
- [ ] End-to-End-Testscript für Websocket (z. B. mit pytest-asyncio)
- [ ] Frontend-Integrationstest (z. B. Cypress, Playwright)

---

## **5. Dokumentation**

- [ ] Testergebnisse dokumentieren (Testprotokoll)
- [ ] Bugs sofort als GitHub-Issue anlegen
- [ ] Testplan regelmäßig aktualisieren

---

**Hinweis:**  
Alle Tests vor Release/Produktivsetzung mindestens **einmal** vollständig durchführen!