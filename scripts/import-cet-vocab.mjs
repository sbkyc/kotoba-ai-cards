import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_URL = "https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv";
const LEVELS = [
  { value: "CET4", tag: "cet4", output: "cet-4" },
  { value: "CET6", tag: "cet6", output: "cet-6" },
];

const POS_LABELS = new Map([
  ["n", "noun"],
  ["v", "verb"],
  ["vi", "verb"],
  ["vt", "verb"],
  ["adj", "adjective"],
  ["a", "adjective"],
  ["adv", "adverb"],
  ["ad", "adverb"],
  ["prep", "preposition"],
  ["pron", "pronoun"],
  ["conj", "conjunction"],
  ["int", "interjection"],
  ["num", "number"],
  ["art", "article"],
]);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function normalizeText(value) {
  return value.replace(/\\n|\n/g, "; ").replace(/\s+/g, " ").trim();
}

function normalizePhonetic(value) {
  const trimmed = value.trim();
  return trimmed ? `/${trimmed}/` : "";
}

function normalizePartOfSpeech(value) {
  const labels = value
    .split("/")
    .map((item) => item.split(":")[0].trim().toLowerCase())
    .map((item) => POS_LABELS.get(item) ?? item)
    .filter(Boolean);

  return Array.from(new Set(labels)).join(" / ") || "vocabulary";
}

function inferPartOfSpeech(row) {
  const fromPos = normalizePartOfSpeech(row.pos);
  if (fromPos !== "vocabulary") return fromPos;

  const source = `${row.translation} ${row.definition}`.toLowerCase();
  const labels = [];
  if (/(^|[\s;])n\./.test(source)) labels.push("noun");
  if (/(^|[\s;])(v|vi|vt)\./.test(source)) labels.push("verb");
  if (/(^|[\s;])(adj|a)\./.test(source)) labels.push("adjective");
  if (/(^|[\s;])(adv|ad)\./.test(source)) labels.push("adverb");
  if (/(^|[\s;])prep\./.test(source)) labels.push("preposition");
  if (/(^|[\s;])pron\./.test(source)) labels.push("pronoun");
  if (/(^|[\s;])conj\./.test(source)) labels.push("conjunction");
  if (/(^|[\s;])int\./.test(source)) labels.push("interjection");
  return Array.from(new Set(labels)).join(" / ") || "vocabulary";
}

function tagsFor(row, levelTag) {
  const sourceTags = row.tag.split(/\s+/).filter(Boolean);
  return Array.from(new Set(["cet", levelTag, ...sourceTags]));
}

function relatedWordsFor(row) {
  const forms = row.exchange
    .split("/")
    .map((item) => item.split(":")[1]?.trim())
    .filter(Boolean)
    .filter((word) => word !== row.word);

  return Array.from(new Set(forms));
}

async function loadRows() {
  const csv = process.env.ECDICT_CSV
    ? await readFile(process.env.ECDICT_CSV, "utf8")
    : await fetchSourceCsv();

  const rows = parseCsv(csv);
  const [header, ...records] = rows;

  return records
    .filter((record) => record.length >= header.length)
    .map((record) => Object.fromEntries(header.map((key, index) => [key, record[index] ?? ""])));
}

async function fetchSourceCsv() {
  const response = await fetch(SOURCE_URL, { headers: { "User-Agent": "kotoba-ai-cards-importer" } });
  if (!response.ok) throw new Error(`Failed to fetch ECDICT csv: ${response.status}`);
  return response.text();
}

async function importLevel(level, rows) {
  const cards = rows
    .filter((row) => row.tag.split(/\s+/).includes(level.tag))
    .map((row) => ({
      id: `${level.output}-${slugify(row.word)}`,
      level: level.value,
      word: row.word,
      kana: normalizePhonetic(row.phonetic),
      meaningZh: normalizeText(row.translation || row.definition),
      partOfSpeech: inferPartOfSpeech(row),
      exampleJa: "",
      exampleZh: "",
      tags: tagsFor(row, level.output),
      relatedWords: relatedWordsFor(row),
    }))
    .filter((card) => card.id !== `${level.output}-`);

  const outputPath = resolve(ROOT, "data", "vocabulary", `${level.output}.json`);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(cards, null, 2)}\n`, "utf8");

  return {
    level: level.value,
    count: cards.length,
    missingDefinitions: cards.filter((card) => !card.meaningZh).length,
  };
}

const rows = await loadRows();
const results = [];
for (const level of LEVELS) {
  results.push(await importLevel(level, rows));
}

console.table(results);
