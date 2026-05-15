import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

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
    assert.equal(sequence.selectedKey, 'Am');
    assert.ok(sequence.events.length > 100);
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

test('score display source contracts stay wired', () => {
    const indexHtml = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const playerSource = fs.readFileSync(new URL('../js/player.js', import.meta.url), 'utf8');
    const rendererSource = fs.readFileSync(new URL('../js/staffNotationRenderer.js', import.meta.url), 'utf8');
    const cssSource = [
        fs.readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8'),
        fs.readFileSync(new URL('../css/mobile.css', import.meta.url), 'utf8')
    ].join('\n');

    assert.doesNotMatch(indexHtml, /select\s+id="key"/);
    assert.match(indexHtml, /id="loopPlayback"/);
    assert.match(indexHtml, /loopToggle\.addEventListener\('change'/);
    assert.match(indexHtml, /player\.setLoopEnabled\(event\.target\.checked === true\)/);
    assert.match(indexHtml, /player\.play\(sequence, \{ loop \}\)/);
    assert.match(playerSource, /play\(sequence, \{ loop = false \} = \{\}\)/);
    assert.match(playerSource, /setLoopEnabled\(enabled\)/);
    assert.doesNotMatch(rendererSource, /MAX_DISPLAY_MEASURES/);
    assert.match(cssSource, /\.score-page-grid/);
    assert.match(cssSource, /\.score-page/);
    assert.match(cssSource, /\.score-sheet-view\.single-page/);
    assert.match(cssSource, /--score-scale:\s*1/);
    assert.match(cssSource, /grid-template-columns:\s*repeat\(2,\s*794px\)/);
    assert.match(cssSource, /transform:\s*scale\(var\(--score-scale\)\)/);
    assert.match(cssSource, /body\.sound-panel-expanded \.container/);
    assert.match(cssSource, /height:\s*1123px/);
    assert.match(cssSource, /\.score-sheet-view\s*\{[\s\S]*overflow:\s*hidden/);
    assert.match(rendererSource, /score-sheet-view single-page/);
    assert.match(rendererSource, /scaleScoreSheet\(sheetView,\s*pageGrid\)/);
    assert.match(rendererSource, /const pages = planScorePages\(scoreMeasures\.measureCount\)/);
    assert.match(rendererSource, /renderer\.resize\(PAGE_WIDTH,\s*PAGE_HEIGHT\)/);
    assert.doesNotMatch(rendererSource, /responsivePageLayout/);
    assert.doesNotMatch(rendererSource, /renderer\.resize\(layout\.pageWidth/);
});

test('sound panel and bottom keyboard state contracts stay wired', () => {
    const indexHtml = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const mobileMenuSource = fs.readFileSync(new URL('../js/mobileMenu.js', import.meta.url), 'utf8');
    const pianoResizeSource = fs.readFileSync(new URL('../js/pianoResizeHandler.js', import.meta.url), 'utf8');
    const cssSource = [
        fs.readFileSync(new URL('../css/mobile.css', import.meta.url), 'utf8'),
        fs.readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8')
    ].join('\n');

    assert.match(indexHtml, /class="sound-panel-toggle"/);
    assert.match(indexHtml, /class="sound-panel-label"/);
    assert.match(indexHtml, /class="physics-sidebar is-collapsed"/);
    assert.doesNotMatch(indexHtml, /id="mobileCloseBtn"/);
    assert.match(indexHtml, /id="pianoKeyboardToggle"/);
    assert.match(indexHtml, /id="pianoKeyboardContent"/);

    assert.match(mobileMenuSource, /SOUND_PANEL_STORAGE_KEY = 'soundPanelExpanded'/);
    assert.match(mobileMenuSource, /physicsSidebar\.classList\.toggle\('is-collapsed'/);
    assert.match(mobileMenuSource, /document\.body\.classList\.toggle\('sound-panel-expanded'/);
    assert.match(mobileMenuSource, /localStorage\.setItem\(SOUND_PANEL_STORAGE_KEY/);
    assert.match(mobileMenuSource, /label\.textContent = isExpanded \? 'Hide' : 'Sound'/);
    assert.match(mobileMenuSource, /score-layout-change/);

    assert.match(pianoResizeSource, /PIANO_EXPANDED_STORAGE_KEY = 'pianoKeyboardExpanded'/);
    assert.match(pianoResizeSource, /localStorage\.getItem\(PIANO_EXPANDED_STORAGE_KEY\) !== 'false'/);
    assert.match(pianoResizeSource, /pianoContainer\.classList\.toggle\('is-collapsed'/);
    assert.match(pianoResizeSource, /--piano-bottom-space/);

    assert.match(cssSource, /\.physics-sidebar\.is-collapsed/);
    assert.match(cssSource, /\.piano-keyboard-container\.is-collapsed/);
});

test('display loader resolves long and short fixtures for score view', () => {
    const loader = new SimplePatternLoader();
    loader.registerPattern('furelise', furelise);
    loader.registerPattern('lombardisch', lombardisch);

    const furElise = loader.resolvePatternSequenceForDisplay('furelise');
    const lombard = loader.resolvePatternSequenceForDisplay('lombardisch');

    assert.equal(loader.getAuthoredKey('furelise'), 'Am');
    assert.equal(furElise.isKeySupported, true);
    assert.equal(furElise.events.length > 100, true);
    assert.equal(buildScoreMeasures(furElise).measureCount, 67);
    assert.equal(loader.getAuthoredKey('lombardisch'), 'C');
    assert.equal(lombard.isKeySupported, true);
});
