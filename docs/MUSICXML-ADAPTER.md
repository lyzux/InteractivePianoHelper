# MusicXML Adapter Contract

This document defines the target shape for a future MusicXML parser. It is a contract, not an importer: Phase 04 does not add file picking, persistent imported scores, MusicXML parsing, or a renderer replacement.

The app's source of truth remains the canonical score sequence used by playback and VexFlow notation. A future MusicXML adapter must parse MusicXML as inert data, normalize it into this canonical model, run validation, and only then register a playable score source.

## Supported Boundary

The first supported MusicXML root is `score-partwise`. It maps cleanly to the app's near-term piano score model because parts contain ordered measures. `score-timewise` is deferred until there is a concrete need for it.

Expected future adapter flow:

1. Parse MusicXML as data.
2. Build a source descriptor with `sourceType: musicxml`.
3. Convert score metadata, parts, measures, layout hints, and playable events into canonical score data.
4. Validate the resulting sequence with `validateResolvedSequence()`.
5. Register either a valid source or rejected source diagnostics through the same loader boundary used by built-in patterns.

The adapter must never evaluate user content. Do not use `eval`, `Function`, dynamic script imports, remote script loading, or executable pattern modules for user-provided MusicXML.

## Source Descriptor

A MusicXML source descriptor should include:

- `sourceId`: stable local identifier, unique within the current library.
- `sourceType: musicxml`.
- `title`: display title from `work`, `movement-title`, file name, or fallback label.
- `composer`: optional metadata from `identification`.
- `filename`: optional original file name.
- `adapterVersion`: adapter contract version used to normalize the score.
- `metadata`: work number, movement number/title, rights, encoding, and other non-playback facts that help display or diagnostics.
- `diagnostics`: structured diagnostics with `sourceId`, `sourceType`, `severity`, `code`, `path`, and `message`.

Short built-in pedagogical patterns remain supported through `sourceType: pattern`. MusicXML is the future complete-piece path, not a replacement for compact authorable patterns.

## MusicXML To Canonical Mapping

### Header And Part List

The parser should read score header metadata and the `part-list` before events. The `part-list` provides part IDs and display names, which later measures reference by ID.

For piano-oriented v1 support, a single piano part with two staves is preferred. Multi-part scores may be accepted later if the app can map them safely into left/right hand payloads or explicit parts.

### Measures And Attributes

Each MusicXML `measure` becomes a canonical measure record:

- `measureNumber`: MusicXML measure number or generated index.
- `partId`: owning part.
- `startBeat`: absolute score beat where the measure begins.
- `durationBeats`: expected measure duration from the active time signature.
- `timeSignature`: active time signature after `attributes`.
- `keySignature`: active key signature if present.
- `staves`: staff count and clef hints.
- `canonicalEventIds`: event IDs that start in or belong to the measure.
- `pageNumber` and `systemIndex`: derived from print/layout hints where available.

`attributes` may update divisions, key, time, staves, clefs, and related local state. The adapter must carry these changes forward measure by measure rather than assuming one global value.

### Divisions And Durations

MusicXML `duration` values are expressed in divisions. The adapter must convert divisions to canonical beats:

```text
durationBeats = musicXmlDuration / divisions
```

This preserves the existing app convention where `1` means a quarter-note beat. If a measure changes `divisions`, subsequent durations use the new value until changed again.

### Notes, Rests, And Chords

MusicXML `note` elements map into canonical event hand payloads:

- A note with `pitch` becomes a playable note value such as `C4`, `F#3`, or `Bb2`.
- A note with `rest` becomes a canonical rest payload.
- A note with `chord` attaches to the previous onset and expands the note list for that hand payload instead of advancing time.
- Ties should preserve sustain identity across split notes; the canonical event should include enough tie metadata for future notation/playback refinement.
- Accidentals must be folded into the canonical note spelling.
- Staff and voice data guide whether a note belongs to the left or right hand.

Canonical hand payloads must stay compatible with the current model:

```js
{
  notes: ['C4', 'E4'],
  isRest: false,
  fingering: null
}
```

Rests use `notes: []` and `isRest: true`.

### Backup And Forward

MusicXML `backup` and `forward` change the current cursor within a measure. They are required for piano scores with multiple voices or staves. A future adapter must model a per-part cursor, apply `backup` and `forward` in divisions, and place resulting canonical events at the correct absolute `startBeat`.

The adapter should not treat the note stream as a simple append-only list. Cursor handling is mandatory for `score-partwise` correctness.

### Directions And Playback Metadata

`direction`, tempo, dynamics, pedal, and `sound` metadata may be captured as non-destructive metadata. Phase 04 does not require the player to interpret these fields. Future playback work may use them after validation and product review.

## Page Layout Contract

MusicXML-backed display should preserve page semantics. Page content may scale inside a sheet viewport, but score content should not reflow into another page because the browser viewport is smaller.

The adapter should preserve layout facts where present:

- `pageSize`: dimensions from `defaults/page-layout`, including width and height.
- `pageMargins`: page margins if present.
- `pageNumber`: page index assigned from layout data or generated sequence.
- `systemLayout`: system margins, distances, and index data where available.
- `printBreaks`: measure-level `print` hints such as new page or new system.
- `measureLayout`: measure-to-page and measure-to-system mapping.

The current A4 VexFlow renderer remains active. This contract prepares data for future page-fidelity rendering without adopting OpenSheetMusicDisplay or another production renderer in this phase.

## Validation Contract

Future MusicXML adapter output must pass the same canonical invariants used by current built-in patterns. At minimum, validation must prove:

- The source has stable `sourceId` and `sourceType: musicxml`.
- Events have stable IDs.
- `startBeat` values are ordered and non-negative.
- `durationBeats` values are positive.
- Hand payloads are rests or playable piano notes/chords.
- Notes are within A0 through C8 unless future requirements expand playback.
- Measure and page mappings are internally consistent.
- Unsupported MusicXML features become structured diagnostics instead of silent data loss.

Rejected MusicXML sources should use the existing rejected-source path. Developer diagnostics can stay detailed; user-facing messages should stay concise.

## Deferred Features

These are intentionally out of scope until a future MusicXML import phase:

- File picker and local score library.
- Remembered imported files and removal controls.
- `score-timewise` input.
- Arbitrary orchestral and multi-part score playback.
- Full articulation, ornament, lyric, repeat, coda, segno, transposition, and engraving support.
- Replacing VexFlow with a dedicated MusicXML renderer.
- Exact visual regression snapshots.

## Future Import UI Boundary

The future import UI should not parse or validate directly inside event handlers. It should hand file contents to a MusicXML parser module, receive either a canonical source descriptor or rejected diagnostics, and then call the same loader registration boundary used for built-in sources.

That keeps playback, notation, validation, and library feedback on one path instead of creating a MusicXML-only side channel.
