import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const indexHtml = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const stylesSource = fs.readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8');
const mobileSource = fs.readFileSync(new URL('../css/mobile.css', import.meta.url), 'utf8');
const loaderSource = fs.readFileSync(new URL('../js/simplePatternLoader.js', import.meta.url), 'utf8');
const rendererSource = fs.readFileSync(new URL('../js/staffNotationRenderer.js', import.meta.url), 'utf8');

test('validation status copy and roles are wired in the app shell', () => {
    assert.match(indexHtml, /id="validationStatus"/);
    assert.match(indexHtml, /class="validation-status"/);
    assert.match(indexHtml, /Some pieces failed verification/);
    assert.match(indexHtml, /\$\{summary\.rejectedCount\} source\(s\) were not loaded\. Playable pieces remain available\./);
    assert.match(indexHtml, /No verified pieces available/);
    assert.match(indexHtml, /The loaded sources failed verification\. Check the console diagnostics and fix the source data\./);
    assert.match(indexHtml, /No verified piece selected/);
    assert.match(indexHtml, /This score cannot be displayed\./);
    assert.match(indexHtml, /The selected source did not pass verification\./);
    assert.match(indexHtml, /status\.setAttribute\('role', 'status'\)/);
    assert.match(indexHtml, /status\.setAttribute\('role', 'alert'\)/);
});

test('validation feedback uses loader summaries and keeps diagnostic details developer-facing', () => {
    assert.match(indexHtml, /getValidationSummary\?\.\(\)/);
    assert.match(indexHtml, /showValidationStatus\(patternLoader\.getValidationSummary\?\.\(\)\)/);
    assert.match(indexHtml, /renderNoVerifiedSourcesState\(\)/);
    assert.match(indexHtml, /renderScoreFailureState\(\)/);
    assert.match(indexHtml, /playStopBtn\) playStopBtn\.disabled = true/);
    assert.match(indexHtml, /if \(!button \|\| button\.disabled\) return/);
    assert.match(indexHtml, /patternLoader\.getPatternOptions\(\)/);
    assert.doesNotMatch(indexHtml, /JSON\.stringify/);
    assert.doesNotMatch(indexHtml, /diagnostic\.path/);
    assert.match(loaderSource, /console\.warn\('Pattern sources rejected during load', summary\.rejectedSources\)/);
    assert.match(loaderSource, /PATTERN_IMPORT_FAILED/);
    assert.match(loaderSource, /PATTERN_EXPORT_MISSING/);
});

test('validation status styles follow the UI spec tokens', () => {
    assert.match(stylesSource, /\.validation-status/);
    assert.match(stylesSource, /\.validation-status-warning/);
    assert.match(stylesSource, /background:\s*#fff7e6/);
    assert.match(stylesSource, /border-color:\s*#b7791f/);
    assert.match(stylesSource, /\.validation-status-error/);
    assert.match(stylesSource, /background:\s*#fff5f5/);
    assert.match(stylesSource, /border-color:\s*#c53030/);
    assert.match(stylesSource, /color:\s*#1f2933/);
    assert.match(stylesSource, /color:\s*#52606d/);
    assert.match(mobileSource, /\.validation-status/);
});

test('score scaling and bottom keyboard contracts remain intact', () => {
    const cssSource = `${stylesSource}\n${mobileSource}`;

    assert.match(cssSource, /\.score-page-grid/);
    assert.match(cssSource, /grid-template-columns:\s*repeat\(2,\s*794px\)/);
    assert.match(cssSource, /transform:\s*scale\(var\(--score-scale\)\)/);
    assert.match(cssSource, /width:\s*794px/);
    assert.match(cssSource, /height:\s*1123px/);
    assert.match(cssSource, /\.piano-keyboard-container\s*\{[\s\S]*position:\s*fixed !important/);
    assert.match(cssSource, /\.piano-keyboard-container\.is-collapsed/);
    assert.match(rendererSource, /score-sheet-view single-page/);
    assert.match(rendererSource, /scaleScoreSheet\(sheetView,\s*pageGrid\)/);
    assert.match(rendererSource, /This score cannot be displayed\./);
});
