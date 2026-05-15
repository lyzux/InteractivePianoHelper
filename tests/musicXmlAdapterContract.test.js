import test from 'node:test';
import assert from 'node:assert/strict';

import {
    createMusicXmlSourceDescriptor,
    DEFERRED_MUSICXML_ROOTS,
    describeMusicXmlAdapterContract,
    MUSICXML_REQUIRED_CANONICAL_FIELDS,
    MUSICXML_REQUIRED_PAGE_LAYOUT_FIELDS,
    MUSICXML_SOURCE_TYPE,
    SUPPORTED_MUSICXML_ROOTS
} from '../js/musicXmlAdapterContract.js';

test('declares musicxml source type and root support boundary', () => {
    assert.equal(MUSICXML_SOURCE_TYPE, 'musicxml');
    assert.ok(SUPPORTED_MUSICXML_ROOTS.includes('score-partwise'));
    assert.ok(DEFERRED_MUSICXML_ROOTS.includes('score-timewise'));
    assert.equal(SUPPORTED_MUSICXML_ROOTS.includes('score-timewise'), false);
});

test('declares required canonical score fields for future adapter output', () => {
    ['events', 'events.id', 'events.startBeat', 'events.durationBeats', 'events.hands', 'metadata'].forEach(field => {
        assert.ok(MUSICXML_REQUIRED_CANONICAL_FIELDS.includes(field), `${field} should be required`);
    });
});

test('declares page-fidelity fields for MusicXML layout hints', () => {
    ['pageNumber', 'pageSize', 'printBreaks', 'measureLayout'].forEach(field => {
        assert.ok(MUSICXML_REQUIRED_PAGE_LAYOUT_FIELDS.includes(field), `${field} should be required`);
    });
});

test('normalizes MusicXML source descriptors and diagnostic source identity', () => {
    const descriptor = createMusicXmlSourceDescriptor({
        id: 'fur-elise-import',
        filename: 'fur-elise.musicxml',
        composer: 'Beethoven',
        diagnostics: [{
            severity: 'warning',
            code: 'MUSICXML_DEFERRED_FEATURE',
            path: 'score-partwise.part[0]',
            message: 'Fixture warning.'
        }]
    });

    assert.equal(descriptor.sourceId, 'fur-elise-import');
    assert.equal(descriptor.id, 'fur-elise-import');
    assert.equal(descriptor.sourceType, 'musicxml');
    assert.equal(descriptor.title, 'fur-elise.musicxml');
    assert.equal(descriptor.composer, 'Beethoven');
    assert.equal(descriptor.root, 'score-partwise');
    assert.equal(descriptor.diagnostics[0].sourceId, 'fur-elise-import');
    assert.equal(descriptor.diagnostics[0].sourceType, 'musicxml');
});

test('describes a serializable contract that targets the existing validator path', () => {
    const contract = describeMusicXmlAdapterContract();
    const serialized = JSON.parse(JSON.stringify(contract));

    assert.equal(serialized.sourceType, 'musicxml');
    assert.deepEqual(serialized.supportedRoots, ['score-partwise']);
    assert.ok(serialized.deferredRoots.includes('score-timewise'));
    assert.ok(serialized.requiredCanonicalFields.includes('events.startBeat'));
    assert.ok(serialized.requiredCanonicalFields.includes('events.durationBeats'));
    assert.ok(serialized.requiredCanonicalFields.includes('events.hands'));
    assert.ok(serialized.requiredPageLayoutFields.includes('pageSize'));
    assert.ok(serialized.requiredPageLayoutFields.includes('pageNumber'));
    assert.ok(serialized.requiredPageLayoutFields.includes('printBreaks'));
    assert.equal(serialized.validation.canonicalValidator, 'validateResolvedSequence');
    assert.equal(serialized.validation.rejectedSourcePath, 'SimplePatternLoader.recordRejectedSource');
    assert.equal(serialized.pageFidelity.responsiveBehavior, 'scale-within-page-not-reflow');
});
