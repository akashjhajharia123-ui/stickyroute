// Checks that site/sticky.js picks exactly what the Go code in engine.go picks.
// go-vectors.json was written by Go's selectStickyWeightedTarget for 8,000 keys over four
// target sets (70/30, 50/30/20 with a key pin, all-zero weights, negative/zero/positive mix).
// Run from the repo root:  node site/verify/check.mjs
import { readFileSync } from "node:fs";
import { selectSticky, stickyHashUnit, targetIdentity } from "../sticky.js";

const UNIT_TOLERANCE = 0; // the hash maps to the same float64 in both languages

const data = JSON.parse(readFileSync(new URL("./go-vectors.json", import.meta.url), "utf8"));
const sets = Object.fromEntries(
  Object.entries(data.sets).map(([name, targets]) => [
    name,
    targets.map(t => ({ provider: t.provider, model: t.model, keyId: t.key_id, weight: t.weight })),
  ]),
);

let pickMismatches = 0;
let unitMismatches = 0;
for (const v of data.vectors) {
  const targets = sets[v.set];
  const pick = selectSticky(targets, v.key);
  if (targetIdentity(pick) !== v.pick) pickMismatches++;
  if (Math.abs(stickyHashUnit(v.key, targetIdentity(targets[0])) - v.unit0) > UNIT_TOLERANCE) unitMismatches++;
}

const total = data.vectors.length;
process.stdout.write(`picks: ${total - pickMismatches}/${total} match Go\n`);
process.stdout.write(`hash units: ${total - unitMismatches}/${total} match Go exactly\n`);
process.exit(pickMismatches === 0 && unitMismatches === 0 ? 0 : 1);
