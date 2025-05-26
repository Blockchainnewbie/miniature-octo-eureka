# Tutorial: Picar-X Bibliothek neu schreiben mit Clean Code und SOLID

Dieses Tutorial erklärt Schritt für Schritt, wie du eine eigene Steuerungsbibliothek für den Picar-X entwickelst – von Grund auf, nach Clean Code und SOLID Prinzipien.

---

## 1. Anforderungen und Hardware-Verständnis

- **Informiere dich über die Hardware**:  
  Welche Komponenten willst du ansteuern? (Motoren, Servos, Sensoren, etc.)
- **Doku & Pinbelegung prüfen**:  
  Lies die Picar-X Hardware-Doku und notiere, welche Pins für was benutzt werden.

---

## 2. Projektstruktur anlegen

Erstelle eine saubere Ordnerstruktur:

```
mypicarx/
│
├── interfaces/
│   ├── motor_interface.py
│   └── sensor_interface.py
├── motors/
│   ├── motor_controller.py
│   └── servo.py
├── sensors/
│   ├── ultrasonic.py
│   └── grayscale.py
├── main.py
└── utils.py
```

---

## 3. Interfaces definieren (SOLID: „I“)

Definiere Interfaces für Motoren, Sensoren usw. mit Python `abc`-Modul:

```python
# interfaces/motor_interface.py
from abc import ABC, abstractmethod

class MotorInterface(ABC):
    @abstractmethod
    def set_speed(self, speed: int):
        pass
```

---

## 4. Komponenten implementieren

### Motorsteuerung

```python
# motors/motor_controller.py
from interfaces.motor_interface import MotorInterface

class MotorController(MotorInterface):
    def __init__(self, pwm_pin, dir_pin):
        self.pwm_pin = pwm_pin
        self.dir_pin = dir_pin

    def set_speed(self, speed: int):
        # Implementiere die Ansteuerung
        pass
```

### Servosteuerung

```python
# motors/servo.py
class Servo:
    def __init__(self, pwm_pin):
        self.pwm_pin = pwm_pin

    def set_angle(self, angle: int):
        # Implementiere die Ansteuerung
        pass
```

### Sensoren

```python
# sensors/ultrasonic.py
class UltrasonicSensor:
    def __init__(self, trig_pin, echo_pin):
        self.trig_pin = trig_pin
        self.echo_pin = echo_pin

    def get_distance(self) -> float:
        # Implementiere die Messung
        pass
```

---

## 5. Zentrale Steuerklasse bauen (Single Responsibility, Dependency Injection)

Kapsle die Komponenten in einer zentralen Klasse, aber jede Komponente bleibt für sich allein verantwortlich.

```python
# main.py
from motors.motor_controller import MotorController
from motors.servo import Servo
from sensors.ultrasonic import UltrasonicSensor

class PicarX:
    def __init__(self, motor_left, motor_right, steering_servo, ultrasonic_sensor):
        self.motor_left = motor_left
        self.motor_right = motor_right
        self.steering_servo = steering_servo
        self.ultrasonic_sensor = ultrasonic_sensor

    def forward(self, speed: int):
        self.motor_left.set_speed(speed)
        self.motor_right.set_speed(speed)

    def stop(self):
        self.motor_left.set_speed(0)
        self.motor_right.set_speed(0)

    def read_distance(self):
        return self.ultrasonic_sensor.get_distance()
```

---

## 6. Clean Code umsetzen

- **Sprechende Namen:** Nutze verständliche, präzise Namen.
- **Funktionen kurz halten:** Jede Funktion macht nur eine Sache.
- **Keine Magic Numbers:** Verwende Konstanten oder Konfigurationsdateien.
- **Doku & Typisierung:** Nutze Docstrings und Typhinweise.

---

## 7. Teste jede Komponente

- Schreibe für jede Klasse ein eigenes Testskript.
- Teste Motoren, Servos und Sensoren einzeln.
- Nutze Mocking, wenn du keine Hardware angeschlossen hast.

---

## 8. Erweiterungen und Wartung

- Neue Hardware? Schreibe eine neue Klasse, die das passende Interface implementiert.
- Anpassungen? Passe nur die betroffene Klasse an, nicht das ganze System (Open/Closed Principle).

---

## 9. Beispiel: Einfache Inbetriebnahme

```python
# main.py, Beispiel-Nutzung
if __name__ == "__main__":
    left_motor = MotorController(pwm_pin=13, dir_pin=4)
    right_motor = MotorController(pwm_pin=12, dir_pin=5)
    steering = Servo(pwm_pin=2)
    ultrasonic = UltrasonicSensor(trig_pin=2, echo_pin=3)

    robot = PicarX(left_motor, right_motor, steering, ultrasonic)
    robot.forward(50)
```

---

## 10. Weitere Tipps

- Schreibe regelmäßig Tests und führe sie aus.
- Nutze Code-Linter wie `flake8` oder `black`.
- Refaktoriere deinen Code regelmäßig.

---

**Fazit:**  
Mit diesem Vorgehen schreibst du von Anfang an sauberen, modularen und erweiterbaren Code für deinen Picar-X – nach modernen Software-Standards!
