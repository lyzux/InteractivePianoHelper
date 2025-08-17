// Pattern Importer - Direkte Imports für alle Patterns
// Diese Datei importiert alle Pattern-Module direkt und registriert sie

export async function importAllPatterns(patternLoader) {
    console.log('📥 Importiere alle Patterns direkt...');
    
    try {
        // Direkte Imports aller Pattern-Module
        const [
            { alberti },
            { waltz },
            { march },
            { boogie },
            { stride },
            { bossa },
            { ragtime },
            { ballad },
            { tango },
            { habanera },
            { arpeggien },
            { lombardisch },
            { chaconne },
            { oktav },
            { ostinato },
            { pompa },
            { polonaise }
        ] = await Promise.all([
            import('../patterns/alberti.js'),
            import('../patterns/waltz.js'),
            import('../patterns/march.js'),
            import('../patterns/boogie.js'),
            import('../patterns/stride.js'),
            import('../patterns/bossa.js'),
            import('../patterns/ragtime.js'),
            import('../patterns/ballad.js'),
            import('../patterns/tango.js'),
            import('../patterns/habanera.js'),
            import('../patterns/arpeggien.js'),
            import('../patterns/lombardisch.js'),
            import('../patterns/chaconne.js'),
            import('../patterns/oktav.js'),
            import('../patterns/ostinato.js'),
            import('../patterns/pompa.js'),
            import('../patterns/polonaise.js')
        ]);

        // Registriere alle Patterns
        const patterns = [
            ['alberti', alberti],
            ['waltz', waltz],
            ['march', march],
            ['boogie', boogie],
            ['stride', stride],
            ['bossa', bossa],
            ['ragtime', ragtime],
            ['ballad', ballad],
            ['tango', tango],
            ['habanera', habanera],
            ['arpeggien', arpeggien],
            ['lombardisch', lombardisch],
            ['chaconne', chaconne],
            ['oktav', oktav],
            ['ostinato', ostinato],
            ['pompa', pompa],
            ['polonaise', polonaise]
        ];

        let loadedCount = 0;
        patterns.forEach(([id, pattern]) => {
            if (pattern) {
                patternLoader.registerPattern(id, pattern);
                console.log(`✅ ${pattern.name} registriert`);
                loadedCount++;
            }
        });

        console.log(`🎵 ${loadedCount} Patterns erfolgreich importiert und registriert!`);
        return true;

    } catch (error) {
        console.error('❌ Fehler beim Importieren der Patterns:', error);
        return false;
    }
}