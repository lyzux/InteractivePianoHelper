# Interactive Piano Helper

Eine modulare Web-Anwendung zum Lernen und Üben von Klavierbass-Rhythmen.

## Projektstruktur

```
InteractivePianoHelper/
├── index.html              # Hauptseite
├── css/
│   └── styles.css          # Stylesheet
├── js/                     # JavaScript-Module
│   ├── audioEngine.js      # Audio-Engine für Klavierklänge
│   ├── piano.js            # Wiederverwendbares Piano-Modul
│   ├── settings.js         # Einstellungen (Tempo, Sustain, etc.)
│   ├── patternLoader.js    # Lädt und verwaltet Bassline-Muster
│   └── player.js          # Spielt Muster ab
├── patterns/               # Einzelne Bassline-Dateien (Auto-Discovery)
│   ├── alberti.js         # Alberti-Bass
│   ├── waltz.js           # Walzer
│   ├── tango.js           # Tango
│   ├── boogie.js          # Boogie-Woogie
│   ├── arpeggien.js       # Arpeggien
│   └── ... (17 Patterns) # Alle automatisch erkannt!
└── assets/                # Weitere Ressourcen (zukünftig)
```

## Module

### 1. AudioEngine (`js/audioEngine.js`)
- Erzeugt realistische Klavierklänge mit Harmonischen
- Unterstützt Sustain-Pedal-Simulation
- Web Audio API basiert

### 2. Piano (`js/piano.js`)
- Wiederverwendbares interaktives Piano (88 Tasten)
- Visuelle Tasten-Highlights
- Klick-Funktionalität
- Kann in anderen Seiten verwendet werden

### 3. Settings (`js/settings.js`)
- Verwaltet Tempo, Sustain, Tonart
- Speichert Einstellungen in localStorage
- Callback-System für Änderungen
- Exportier-/Import-Funktionen

### 4. PatternLoader (`js/patternLoader.js`)
- Lädt Bassline-Muster aus separaten Dateien
- Generiert ABC-Notation für Notendarstellung
- Unterstützt dynamisches Laden neuer Muster

### 5. Player (`js/player.js`)
- Spielt Bassline-Muster ab
- Looping-Funktionalität
- Synchronisation mit Piano-Visualisierung

## Bassline-Muster

Jede Bassline ist in einer eigenen Datei gespeichert (`patterns/*.js`) mit folgender Struktur:

```javascript
export const patternName = {
    name: 'Anzeigename',
    description: 'Beschreibung des Musters',
    notation: 'Textuelle Notation',
    pattern: (key) => [...], // Noten-Array für verschiedene Tonarten
    timing: [...],           // Timing-Array
    fingering: [...],        // Fingersatz-Array
    timeSignature: '4/4',    // Taktart
    tempo: { min: 80, max: 140, default: 120 }
};
```

## Erweiterung

### Neue Bassline hinzufügen:
1. Erstelle neue Datei in `patterns/` (z.B. `minuet.js`)
2. Exportiere Muster-Objekt mit obiger Struktur
3. **Das war's!** - Vollautomatische Erkennung!

**🎯 Echte Auto-Discovery:** Neue Patterns werden automatisch erkannt - keine manuelle Konfiguration!

### Neue Features:
- **ABCjs**: Bereits integriert für Notendarstellung
- **Weitere Melodie-Module**: Settings und Piano sind wiederverwendbar
- **Neue Seiten**: Alle Module können einzeln importiert werden

## Verwendung in anderen Seiten

```javascript
// Piano in anderer Seite verwenden
import { Piano } from './js/piano.js';
import { AudioEngine } from './js/audioEngine.js';

const audioEngine = new AudioEngine();
const piano = new Piano('piano-container', audioEngine);

// Settings wiederverwenden
import { Settings } from './js/settings.js';
const settings = new Settings();
settings.init('tempo', 'tempoDisplay', 'sustain', 'key');
```

## Technische Details

- **ES6 Module**: Modulares JavaScript ohne Bundler
- **Web Audio API**: Für Klang-Erzeugung
- **ABCjs**: Für Notation-Rendering
- **localStorage**: Für Einstellungen-Persistierung
- **Responsive Design**: Mobile-freundlich

## Browser-Kompatibilität

- Chrome/Edge 61+
- Firefox 60+
- Safari 10.1+
- Benötigt ES6 Module Support 
