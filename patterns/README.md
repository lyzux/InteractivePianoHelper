# Patterns Ordner

Dieser Ordner enthält alle Bassline-Pattern-Dateien.

## Automatische Erkennung
Neue Patterns werden automatisch erkannt! Einfach neue `.js` Datei hinzufügen.

## Pattern-Datei Format
```javascript
// patterns/neuesmuster.js
export const neuesmuster = {
    name: 'Neues Muster',
    description: 'Beschreibung...',
    notation: 'Notation...',
    pattern: (key) => { /* Noten für verschiedene Tonarten */ },
    timing: [1, 1, 1, 1],
    fingering: [5, 3, 2, 1],
    timeSignature: '4/4',
    tempo: { min: 80, max: 140, default: 120 }
};
```

## Verfügbare Patterns:
- alberti.js - Alberti-Bass
- waltz.js - Walzer
- march.js - Marsch
- boogie.js - Boogie-Woogie
- stride.js - Stride Piano
- bossa.js - Bossa Nova
- ragtime.js - Ragtime
- ballad.js - Ballade
- tango.js - Tango
- habanera.js - Habanera
- arpeggien.js - Arpeggien
- lombardisch.js - Lombardischer Rhythmus
- chaconne.js - Chaconne/Passacaglia
- oktav.js - Oktav-Bass
- ostinato.js - Ostinato-Bass
- pompa.js - Pompa/Hymnen-Bass
- polonaise.js - Polonaise-Bass

**Neue Patterns einfach als .js Datei hinzufügen - automatische Erkennung!**