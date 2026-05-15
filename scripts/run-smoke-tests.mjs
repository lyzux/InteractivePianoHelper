import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

function defaultSmokeFiles() {
    return readdirSync('tests/browser-smoke')
        .filter(filename => filename.endsWith('.test.js'))
        .sort()
        .map(filename => join('tests/browser-smoke', filename));
}

const requestedFiles = process.argv.slice(2);
const testFiles = requestedFiles.length > 0 ? requestedFiles : defaultSmokeFiles();
const result = spawnSync(process.execPath, ['--test', ...testFiles], {
    stdio: 'inherit'
});

process.exit(result.status ?? 1);
