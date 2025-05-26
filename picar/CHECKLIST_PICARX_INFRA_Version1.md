# Picar-X Remote Control – Infrastruktur & Deployment Checkliste

---

## **1. VPN/Netzwerk**

- [ ] WireGuard-Server auf Hetzner installieren und konfigurieren
- [ ] Peer-Konfiguration für Picar-X erzeugen (Key, AllowedIPs)
- [ ] WireGuard-Client auf Picar-X (Docker-Container oder nativ) einrichten
- [ ] VPN-Test: Picar-X von Hetzner aus per Ping erreichen
- [ ] Firewall auf Hetzner: UDP 51820 (WireGuard) erlauben

---

## **2. Backend/Proxy-Server (Hetzner)**

- [ ] Python-Backend (`main.py` etc.) als eigenen Service/Container deployen
- [ ] Backend-Config (`config.py`): VPN-IP und Ports des Picar-X setzen
- [ ] Backend-API: Login, Token-Refresh, Websocket-Relay, MJPEG-Proxy testen
- [ ] JWT-Secret sicher setzen (Umgebungsvariable/Secret)
- [ ] CORS-Domain freigeben (nur deine Frontend-URL)
- [ ] Logging und Monitoring aktivieren

---

## **3. Web-Frontend (Hetzner)**

- [ ] Frontend-Container bauen (React/Vue/Svelte oder statisch)
- [ ] Login/Refresh-Token an Backend implementieren
- [ ] Websocket- und Kamera-API: Verbindung über das Backend/Relay herstellen
- [ ] UI/UX: Steuerbefehle und Cam-Feed anzeigen
- [ ] Deployment als Subdomain (z.B. picarx.deinedomain.de) konfigurieren

---

## **4. Reverse-Proxy & SSL**

- [ ] Traefik/Nginx: Routing für Subdomain und Websockets konfigurieren
- [ ] SSL/TLS via Let's Encrypt aktivieren
- [ ] Nur HTTPS-Zugriff erlauben
- [ ] (Optional) Rate-Limiting und GeoIP-Schutz setzen

---

## **5. Picar-X (bei dir zuhause)**

- [ ] Docker-Compose für WireGuard + picarx-Image erstellen
- [ ] App-Container: Websocket/MJPEG nur im VPN exposen
- [ ] Watchtower oder Pull-Skript für Image-Updates einrichten
- [ ] Systemd-Service für Compose/Container-Autostart einrichten

---

## **6. CI/CD & Automatisierung**

- [ ] GitHub Actions Workflow für Build, Test, Push zu DockerHub einrichten
- [ ] DockerHub-Zugangsdaten als GitHub Secret speichern
- [ ] Automatisches Pull/Restart auf dem Pi (Watchtower/Skript)
- [ ] Testabdeckung für Auth, Proxy, und Hardware-Mocks sicherstellen

---

## **7. Sicherheit & Betrieb**

- [ ] Starke Passwörter/Keys, JWT-Secret niemals hardcoden
- [ ] Backend & VPN nur aus bekannten Netzen zugänglich machen
- [ ] Monitoring (Prometheus/Grafana), Alerting bei Ausfall
- [ ] Backups: WireGuard-Keys und wichtige Configs sichern
- [ ] Logging: Fehler und Zugriffe protokollieren

---

## **8. Funktionale End-to-End-Tests**

- [ ] Login per Frontend → Token erhalten
- [ ] Websocket-Verbindung vom Frontend → Backend → Picar-X erfolgreich
- [ ] Kamera-Stream im Frontend sichtbar
- [ ] Steuerbefehle am Pi ausgeführt
- [ ] Abmeldung/Token-Expiry/Refresh funktioniert

---

**Optional/Erweiterung:**
- [ ] Multi-User/Role-Management
- [ ] Brute-Force-Protection und Rate-Limiting (API)
- [ ] WebRTC statt MJPEG für Cam
- [ ] Mobile-Optimierung des Frontends
- [ ] Integration in Monitoring/Alerting-Stack

---

**Tipp:**  
Diese Checkliste als Markdown im Repo pflegen und regelmäßig mit dem Team abgleichen!