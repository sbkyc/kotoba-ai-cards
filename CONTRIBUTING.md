# Contributing to Kotoba AI Cards

Thanks for helping improve Kotoba AI Cards. The project is designed so vocabulary data can grow through small, reviewable contributions.

## Vocabulary Contributions

Vocabulary files live in:

```text
data/vocabulary/jlpt-n2.json
data/vocabulary/jlpt-n1.json
```

The generated CET and JLPT decks also include:

```text
data/vocabulary/cet-4.json
data/vocabulary/cet-6.json
data/vocabulary/jlpt-n5.json
data/vocabulary/jlpt-n4.json
data/vocabulary/jlpt-n3.json
```

Each entry should follow this shape:

```json
{
  "id": "n2-houshin",
  "level": "N2",
  "word": "方針",
  "kana": "ほうしん",
  "meaningZh": "方针，方向",
  "partOfSpeech": "名词",
  "exampleJa": "会社は新しい方針を発表した。",
  "exampleZh": "公司发表了新的方针。",
  "tags": ["business", "abstract"],
  "relatedWords": ["方法", "方向"]
}
```

## Data Rules

- Use original examples or examples from license-compatible sources.
- Do not copy proprietary textbook examples.
- Respect the license notes in `data/vocabulary/NOTICE.md`.
- Keep Chinese meanings concise.
- Prefer natural Japanese example sentences.
- Add `relatedWords` when the word is easily confused with another word.
- Keep tags lowercase English words such as `daily`, `business`, `abstract`, `academic`, `work`, or `news`.

## Code Contributions

Before opening a pull request, run:

```bash
npm run lint
npm test
npm run build
```

For behavior changes, add or update tests first.

## Suggested Issues

Good first issues:

- Add 10 verified N2 vocabulary entries.
- Add 10 verified N1 vocabulary entries.
- Add examples or Chinese meaning improvements for generated JLPT entries.
- Add examples or Chinese meaning improvements for generated CET entries.
- Improve tags for existing words.
- Add related words for confusing vocabulary.
- Improve UI copy or accessibility labels.
