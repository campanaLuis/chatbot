import fs from "fs";
import path from "path";
import readline from "readline";

const SEPOMEX_FILE = path.join(process.cwd(), "data", "sepomex.utf8.txt");

let indexPromise = null;

async function buildIndex() {
  const map = new Map();

  const stream = fs.createReadStream(SEPOMEX_FILE, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let headers = null;

  for await (const line of rl) {
    if (!line.trim()) continue;

    if (!headers) {
      headers = line.split("|");
      continue;
    }

    const parts = line.split("|");
    if (parts.length < 2) continue;

    const d_codigo = (parts[0] || "").trim(); // CP
    const d_asenta = (parts[1] || "").trim(); // colonia

    if (!d_codigo || !d_asenta) continue;

    let entry = map.get(d_codigo);
    if (!entry) {
      entry = { items: [], seen: new Set() };
      map.set(d_codigo, entry);
    }

    if (!entry.seen.has(d_asenta)) {
      entry.seen.add(d_asenta);
      entry.items.push({ d_asenta });
    }
  }

  for (const [cp, entry] of map.entries()) {
    map.set(cp, entry.items);
  }

  return map;
}

async function getIndex() {
  if (!indexPromise) indexPromise = buildIndex();
  return indexPromise;
}

export async function getColoniasByCP(cp) {
  const idx = await getIndex();
  const key = String(cp).trim();
  return idx.get(key) || [];
}
