import test from 'node:test';
import assert from 'node:assert/strict';

import { SimplePatternLoader } from '../js/simplePatternLoader.js';
import { PATTERN_IDS } from '../patterns/index.js';
import { furelise } from '../patterns/furelise.js';
import { lombardisch } from '../patterns/lombardisch.js';

function optionValues(loader) {
    return loader.getPatternOptions().map(option => option.value);
}

test('registers valid patterns and keeps their diagnostics available', () => {
    const loader = new SimplePatternLoader();

    const furElise = loader.registerPattern('furelise', furelise);
    const lombard = loader.registerPattern('lombardisch', lombardisch);

    assert.equal(furElise.ok, true);
    assert.equal(lombard.ok, true);
    assert.deepEqual(optionValues(loader), ['furelise', 'lombardisch']);
    assert.equal(loader.getValidationSummary().validCount, 2);
    assert.equal(loader.getValidationSummary().rejectedCount, 0);
    assert.ok(loader.getDiagnosticsForSource('furelise').every(diagnostic => diagnostic.sourceId === 'furelise'));
});

test('rejects malformed registrations and removes them from selector options', () => {
    const loader = new SimplePatternLoader();

    const result = loader.registerPattern('broken', {
        pattern: () => ['H3'],
        timing: [],
        timeSignature: 'abc'
    });

    assert.equal(result.ok, false);
    assert.deepEqual(optionValues(loader), []);

    const rejected = loader.getRejectedSources();
    assert.equal(rejected.length, 1);
    assert.equal(rejected[0].id, 'broken');
    assert.equal(rejected[0].sourceType, 'pattern');
    assert.ok(rejected[0].diagnostics.some(diagnostic => diagnostic.code === 'PATTERN_REQUIRED_FIELD' && diagnostic.path === 'name'));
    assert.ok(rejected[0].diagnostics.some(diagnostic => diagnostic.code === 'NOTE_INVALID_NAME' && diagnostic.path === 'leftHand()[0]'));
    assert.equal(loader.getDiagnosticsForSource('broken')[0].severity, 'error');
});

test('records import and export failures as rejected source diagnostics', () => {
    const loader = new SimplePatternLoader();

    loader.recordImportFailure('missing-file', new Error('Cannot find module'));
    loader.recordMissingExport('missing-export');

    const rejected = loader.getRejectedSources();
    assert.equal(rejected.length, 2);
    assert.ok(rejected.some(source => source.diagnostics[0].code === 'PATTERN_IMPORT_FAILED'
        && source.diagnostics[0].path === 'patterns/missing-file.js'));
    assert.ok(rejected.some(source => source.diagnostics[0].code === 'PATTERN_EXPORT_MISSING'
        && source.diagnostics[0].path === 'exports.missing-export'));
    assert.equal(loader.getValidationSummary().hasFailures, true);
});

test('registers every production pattern manifest entry without fatal validation failures', async () => {
    const loader = new SimplePatternLoader();

    for (const patternId of PATTERN_IDS) {
        const module = await import(`../patterns/${patternId}.js`);
        const result = loader.registerPattern(patternId, module[patternId]);
        assert.equal(result.ok, true, `${patternId} should register successfully`);
    }

    assert.equal(loader.getValidationSummary().validCount, PATTERN_IDS.length);
    assert.equal(loader.getValidationSummary().rejectedCount, 0);
    assert.deepEqual(optionValues(loader), PATTERN_IDS);
});
