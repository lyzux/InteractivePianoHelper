---
phase: 05-musicxml-import-and-practice-ux
plan: "02"
subsystem: import
tags: [musicxml, parser, validation, library, node-test]

requires:
  - phase: 05-01
    provides: Browser-local imported score storage and renderer/storage gate
provides:
  - Strict inert MusicXML text parser with structured diagnostics
  - Imported score record registration through SimplePatternLoader
  - Duplicate imported title suffixing and complete-score option filtering
affects: [musicxml-import, score-library, simple-pattern-loader, phase-05]

tech-stack:
  added: []
  patterns:
    - Pure ES module parser returning ok/document/descriptor/diagnostics
    - MusicXML records stored as inert loader sources instead of executable pattern modules

key-files:
  created:
    - js/musicXmlParser.js
    - js/importedScoreLibrary.js
    - tests/musicXmlParser.test.js
  modified:
    - js/simplePatternLoader.js

key-decisions:
  - "MusicXML parser accepts only score-partwise and rejects malformed, timewise, missing-part, missing-measure, and multi-part input with source-scoped diagnostics."
  - "Imported MusicXML library records are inert complete-score sources registered through SimplePatternLoader maps, not executable pattern modules."
  - "Complete-score filtering is exposed as an explicit loader/library surface while preserving existing built-in pattern APIs."

patterns-established:
  - "Parser diagnostics use createDiagnostic-compatible sourceId/sourceType/code/path/message records."
  - "Imported source removal only affects sourceType musicxml records and leaves built-in pattern records untouched."

requirements-completed: [XML-03, XML-04]

duration: 4min
completed: 2026-05-15
---

# Phase 05 Plan 02: Strict Import, Storage, Library Core Summary

**Strict inert MusicXML parsing with source-scoped diagnostics and complete-score library registration for imported records**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-15T14:09:10Z
- **Completed:** 2026-05-15T14:13:07Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Added a strict `score-partwise` MusicXML parser that returns structured results and never throws for expected user-file failures.
- Added diagnostics for malformed XML, unsupported roots, missing part-list, missing parts, missing measures, missing playback attributes, empty measures, and unsupported multi-part files.
- Added imported-score library helpers for inert record creation, duplicate title suffixing, loader registration, removal, and complete-score option filtering.
- Extended `SimplePatternLoader` with a MusicXML source boundary while keeping existing built-in pattern registration and selection APIs intact.

## Task Commits

1. **Task 1: Add strict MusicXML parser tests** - `ae25616` (test)
2. **Task 2: Implement strict parser and diagnostics** - `b871613` (feat)
3. **Task 3: Add imported library registration boundary** - `84afefe` (feat)

## Files Created/Modified

- `js/musicXmlParser.js` - Strict data-only MusicXML parser, structure validator, source descriptor builder, and diagnostic generator.
- `js/importedScoreLibrary.js` - Imported score record helpers, duplicate suffix assignment, loader registration/removal helpers, and complete-score option helper.
- `js/simplePatternLoader.js` - MusicXML registration/removal boundary, complete-score filtering, and imported-source-safe sequence resolution.
- `tests/musicXmlParser.test.js` - Node tests for accepted fixture parsing, rejection diagnostics, source identity, duplicate suffixing, registration, removal, and complete-score filtering.

## Decisions Made

- Used a pure ES module XML reader fallback for Node tests while still supporting browser `DOMParser` and parser injection.
- Kept imported MusicXML records inert in the loader instead of wrapping uploaded content in pattern functions.
- Preserved `getPatternOptions()` as the stable all-source API and added explicit complete-score filtering for the Phase 5 library surface.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Task 2 verification used the shared parser/library test file, so the imported-library boundary needed to be present in the working tree before the parser test suite could pass. Commits remained task-scoped.

## Known Stubs

None.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: xml-input-parser | js/musicXmlParser.js | New untrusted XML text boundary parses uploaded MusicXML as inert data and rejects unsupported structure before registration. |

## Auth Gates

None.

## Verification

- `node --check js/musicXmlParser.js` - passed
- `node --check js/importedScoreLibrary.js js/simplePatternLoader.js` - passed
- `node --test tests/musicXmlParser.test.js` - passed, 11 tests
- `npm test` - passed, 47 tests

## Next Phase Readiness

Plan 05-03 can build the canonical MusicXML adapter on top of `parseMusicXmlText()` descriptors and the inert loader registration boundary. The remaining risk is intentional: imported records do not yet become playable canonical event sequences until 05-03 maps supported MusicXML notes, durations, cursors, and hands.

## Self-Check: PASSED

- Found created files: `js/musicXmlParser.js`, `js/importedScoreLibrary.js`, `tests/musicXmlParser.test.js`, `.planning/phases/05-musicxml-import-and-practice-ux/05-02-SUMMARY.md`
- Found modified file: `js/simplePatternLoader.js`
- Found task commits: `ae25616`, `b871613`, `84afefe`

---
*Phase: 05-musicxml-import-and-practice-ux*
*Completed: 2026-05-15*
