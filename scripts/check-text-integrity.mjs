import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const roots = ["src", "data", "docs", "README.md", "CONTRIBUTING.md"];
const allowedExtensions = new Set([".css", ".json", ".md", ".mjs", ".ts", ".tsx", ".xml", ".yml", ".yaml"]);
const suspiciousPatterns = [
  { name: "replacement character", pattern: /\uFFFD/ },
  { name: "three or more question marks", pattern: /\?{3,}/ },
];

const findings = [];

for (const root of roots) {
  scanPath(root);
}

if (findings.length) {
  console.error("Text integrity check failed:");
  for (const finding of findings) {
    console.error(`${finding.file}:${finding.line}: ${finding.reason}: ${finding.text}`);
  }
  process.exit(1);
}

console.log("Text integrity check passed.");

function scanPath(path) {
  const stats = statSync(path);
  if (stats.isDirectory()) {
    for (const entry of readdirSync(path)) {
      scanPath(join(path, entry));
    }
    return;
  }

  if (!isTextFile(path)) return;

  const text = readFileSync(path, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const { name, pattern } of suspiciousPatterns) {
      if (pattern.test(line)) {
        findings.push({
          file: relative(process.cwd(), path).replaceAll("\\", "/"),
          line: index + 1,
          reason: name,
          text: line.trim(),
        });
      }
    }
  });
}

function isTextFile(path) {
  return allowedExtensions.has(path.match(/\.[^.]+$/)?.[0] ?? "");
}
