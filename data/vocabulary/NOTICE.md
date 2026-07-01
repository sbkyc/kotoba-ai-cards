# Vocabulary Data Notice

The English CET-4 and CET-6 vocabulary JSON files are generated from
[`skywind3000/ECDICT`](https://github.com/skywind3000/ECDICT), which is
licensed under the MIT License. ECDICT tags are used to select `cet4` and
`cet6` entries.

The JLPT N5-N1 vocabulary JSON files are generated from
[`stephenmk/yomitan-jlpt-vocab`](https://github.com/stephenmk/yomitan-jlpt-vocab),
which derives JLPT tags from Jonathan Waller's JLPT Resources and JMdict entry
alignment. The upstream project is licensed under Creative Commons
Attribution-ShareAlike 4.0 International.

JLPT does not publish official vocabulary lists. These decks should be treated
as community reference lists, not official exam requirements.

Generated files:

```text
data/vocabulary/cet-4.json
data/vocabulary/cet-6.json
data/vocabulary/jlpt-n5.json
data/vocabulary/jlpt-n4.json
data/vocabulary/jlpt-n3.json
data/vocabulary/jlpt-n2.json
data/vocabulary/jlpt-n1.json
```

Regenerate them with:

```bash
node scripts/import-cet-vocab.mjs
node scripts/import-jlpt-vocab.mjs
```

For slow networks, the CET importer can reuse a downloaded ECDICT CSV:

```bash
ECDICT_CSV=/path/to/ecdict.csv node scripts/import-cet-vocab.mjs
```
