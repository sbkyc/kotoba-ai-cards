# Kotoba AI Cards

Kotoba AI Cards is a vocabulary study app for CET-4, CET-6, and JLPT N5-N1 learners, with optional AI study helpers.

It works as a normal flashcard and practice app without an API key. Offline mode supports daily study, due review, core words, exam-focus words, mistakes, and original four-option practice. If learners add their own API key in Settings, they can also generate example sentences, word-difference explanations, and more flexible exam-style memory checks for the current card. The AI panel supports OpenAI, DeepSeek, Qwen/DashScope, Kimi/Moonshot, Zhipu GLM, OpenRouter, Gemini, Anthropic Claude, and custom OpenAI-compatible endpoints.

Live site: https://sbkyc.github.io/kotoba-ai-cards/

## Features

- CET-4, CET-6, and JLPT N5-N1 vocabulary card study
- Local progress for known, fuzzy, and unknown ratings
- Due-review-first study queue with core vocabulary prioritized before ordinary new cards
- Core, exam-focus, difficult-word, and favorite-word review modes
- Offline single-card quizzes and offline practice papers without an API key
- AI practice falls back to offline questions if the AI request fails
- Daily stats and vocabulary library filters
- Mastery status filtering in the library
- Optional AI helpers using a user-provided API key, including exam-style memory checks, examples, and word-difference explanations
- Android APK packaging through Capacitor
- Local JSON backup export and import
- Static-first Next.js app with local browser storage
- JSON vocabulary files that are easy to improve through pull requests

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Zustand
- Vitest

## Getting Started

```bash
npm install
npm run dev
```

Open http://127.0.0.1:3000.

## Install On Android

For personal use, build and install the debug APK:

```bash
npm run android:apk
```

The generated file is:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Send `app-debug.apk` to your Android phone and open it to install. Android may ask you to allow installs from the app that received the file.

For a signed release APK/AAB, see [docs/android-apk.md](./docs/android-apk.md).

## Install As PWA

After the GitHub Pages deployment finishes, open the live site in Android Chrome or Edge:

```text
https://sbkyc.github.io/kotoba-ai-cards/
```

Use the browser menu and choose **Install app** or **Add to Home screen**. Kotoba will then open from the phone launcher like a standalone app.

## Useful Commands

```bash
npm run lint
npm test
npm run build
npm run import:cet
npm run import:jlpt
npm run android:apk
npm run android:release:apk
```

## Vocabulary Data

Vocabulary lives in:

```text
data/vocabulary/cet-4.json
data/vocabulary/cet-6.json
data/vocabulary/jlpt-n5.json
data/vocabulary/jlpt-n4.json
data/vocabulary/jlpt-n3.json
data/vocabulary/jlpt-n2.json
data/vocabulary/jlpt-n1.json
```

Record shape:

```json
{
  "id": "cet-4-abandon",
  "level": "CET4",
  "word": "abandon",
  "kana": "/?'b?nd?n/",
  "meaningZh": "vt. ??, ??, ??, ???, ??, ??; n. ??, ???, ??",
  "partOfSpeech": "noun / verb",
  "exampleJa": "",
  "exampleZh": "",
  "tags": ["cet", "cet-4", "cet4"]
}
```

For Japanese entries, `kana` stores kana reading and `exampleJa` stores a Japanese example. For English entries, `kana` stores pronunciation and `exampleJa` stores an English example. The field names stay compatible with earlier backups and contribution scripts.

Please contribute only original or license-compatible vocabulary data and examples.

English CET-4 and CET-6 vocabulary is generated from the MIT licensed
`skywind3000/ECDICT` dataset using its `cet4` and `cet6` tags.
The exam-focus mode is derived only from source vocabulary tags such as
`cet4`, `cet6`, `gk`, `zk`, `ky`, `toefl`, and `ielts`; it is not presented as
an unsourced real-exam frequency list.

JLPT N5-N1 vocabulary is generated from the CC BY-SA 4.0 licensed
`stephenmk/yomitan-jlpt-vocab` dataset, which is based on Jonathan Waller's JLPT
Resources and JMdict alignment. JLPT does not publish official vocabulary lists,
so these decks are community reference lists rather than official exam
requirements. See [data/vocabulary/NOTICE.md](./data/vocabulary/NOTICE.md).

See [CONTRIBUTING.md](./CONTRIBUTING.md) for vocabulary format, data rules, and pull request checks.

## AI Key Notice

The first version is static-first and stores the API key in the user's browser storage. This is convenient for personal or self-hosted use, but browser-side keys are visible to the local browser environment. For shared or production deployments, add a server-side proxy before accepting other users' keys.

Built-in provider presets:

```text
OpenAI
DeepSeek
Qwen / DashScope compatible mode
Kimi / Moonshot
Zhipu GLM
OpenRouter
Google Gemini
Anthropic Claude
Custom OpenAI-compatible chat completions
```

The model name and endpoint are editable in Settings. For Gemini endpoints, `{model}` is replaced with the selected model name.

## Local Backups

Settings includes JSON export and import for local progress and preferences. Backups are versioned so future app versions can migrate the shape deliberately.

## License

MIT
