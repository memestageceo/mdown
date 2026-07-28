# mdown

A calm, focused Markdown reader and note editor that turns your notes into Anki
cloze-deletion flashcards. Everything stays in your browser — nothing is uploaded.

## Making flashcards

1. Switch to **Edit** and write or paste your notes.
2. Select a phrase and press **`Alt+C`** (`⌥C` on a Mac). It becomes a cloze
   deletion: `The {{c1::mitochondria}} is the powerhouse.`
3. Press **`Alt+Shift+C`** instead to reuse the previous number, which groups both
   blanks onto a single card.
4. `Alt+C` on an existing cloze removes it.

Numbering is scoped to the block you are in, matching how Anki works: each
paragraph or list item becomes one note, and numbering restarts at `c1` for each.
Cloze syntax inside fenced code blocks is left alone.

Hints are supported — type `{{c1::answer::hint}}` and the hint shows on hover in
the preview.

## Getting them into Anki

Choose **Export → Anki deck (.tsv)**, then in Anki pick **File → Import**. The
note type, deck and tags are all set by the file, so no configuration is needed.
Requires Anki 2.1.54 or newer.

Each exported row is one note, with three columns:

| Column | Anki field | Content |
| --- | --- | --- |
| 1 | Text | The block, rendered to HTML so bold and code survive |
| 2 | Back Extra | The heading trail above the block, e.g. `Biology › Cells` |
| 3 | Tags | The same headings, slugified |

Only blocks that actually contain a cloze are exported. **Export → Markdown
(.md)** downloads your notes with the cloze syntax inline, so they round-trip.

## Reading

Drop a `.md` file anywhere on the page, paste Markdown with `Ctrl+V` / `Cmd+V`, or
use **Open**. GitHub-flavoured Markdown, syntax-highlighted code blocks, and
click-to-copy inline code all work. Your document is saved to `localStorage`, so a
refresh will not lose it.

## Development

```sh
npm install
npm run dev      # start the dev server
npm test         # run the unit tests
npm run lint     # oxlint
npm run build    # production build
```

The cloze engine, block segmentation and TSV generation live in `src/lib/` as pure
functions and are covered by unit tests.
