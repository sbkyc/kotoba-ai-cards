import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_BASE = "https://raw.githubusercontent.com/stephenmk/yomitan-jlpt-vocab/main/original_data";
const LEVELS = ["n5", "n4", "n3", "n2", "n1"];

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
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function normalizeDefinition(value) {
  return value.replace(/\s+/g, " ").trim();
}

async function importLevel(level) {
  const response = await fetch(`${SOURCE_BASE}/${level}.csv`);
  if (!response.ok) throw new Error(`Failed to fetch ${level}.csv: ${response.status}`);

  const csv = await response.text();
  const [header, ...rows] = parseCsv(csv);
  const expectedHeader = ["jmdict_seq", "kana", "kanji", "waller_definition"];
  if (header.join(",") !== expectedHeader.join(",")) {
    throw new Error(`Unexpected header for ${level}.csv: ${header.join(",")}`);
  }

  const seen = new Set();
  const cards = rows.map(([jmdictSeq, kana, kanji, definition], index) => {
    const word = kanji.trim() || kana.trim();
    const baseId = `${level}-${jmdictSeq || slugify(`${kana}-${kanji}`)}`;
    const id = seen.has(baseId) ? `${baseId}-${index + 1}` : baseId;
    seen.add(id);

    return {
      id,
      level: level.toUpperCase(),
      word,
      kana: kana.trim(),
      meaningZh: normalizeDefinition(definition),
      partOfSpeech: "vocabulary",
      exampleJa: "",
      exampleZh: "",
      tags: ["jlpt", level],
    };
  });

  const outputPath = resolve(ROOT, "data", "vocabulary", `jlpt-${level}.json`);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(cards, null, 2)}\n`, "utf8");
  return { level, count: cards.length };
}

const results = [];
for (const level of LEVELS) {
  results.push(await importLevel(level));
}

console.table(results);
