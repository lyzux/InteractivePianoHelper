import test from 'node:test';
import assert from 'node:assert/strict';

import { resolvePatternSequence } from '../js/canonicalPatternResolver.js';
import { SimplePatternLoader } from '../js/simplePatternLoader.js';
import { buildScoreMeasures, planScorePages } from '../js/staffNotationRenderer.js';
import { furelise } from '../patterns/furelise.js';
import { lombardisch } from '../patterns/lombardisch.js';

function coveredMeasures(pages) {
    return pages.flatMap(page =>
        page.systems.flatMap(system =>
            Array.from({ length: system.count }, (_, offset) => system.start + offset)
        )
    );
}

test('builds all Fur Elise measures for full-score rendering', () => {
    const sequence = resolvePatternSequence(furelise, { patternId: 'furelise', key: 'Am' });
    const score = buildScoreMeasures(sequence);

    assert.equal(sequence.isKeySupported, true);
    assert.equal(score.measureCount, 67);
});

test('plans A4 pages without measure gaps or duplicates', () => {
    const pages = planScorePages(67);
    const measures = coveredMeasures(pages);

    assert.ok(pages.length > 1);
    assert.equal(measures.length, 67);
    assert.deepEqual(measures, Array.from({ length: 67 }, (_, index) => index));
    assert.equal(new Set(measures).size, 67);
});

test('keeps short patterns on the sheet rendering path', () => {
    const loader = new SimplePatternLoader();
    loader.registerPattern('lombardisch', lombardisch);
    const sequence = loader.resolvePatternSequenceForDisplay('lombardisch');
    const score = buildScoreMeasures(sequence);
    const pages = planScorePages(score.measureCount);

    assert.equal(sequence.isKeySupported, true);
    assert.equal(sequence.selectedKey, 'C');
    assert.equal(score.measureCount, 1);
    assert.ok(pages.length >= 1);
    assert.deepEqual(coveredMeasures(pages), [0]);
});
