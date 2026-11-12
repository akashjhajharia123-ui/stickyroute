// A line-for-line JavaScript port of the target selection in
// bifrost/plugins/routing/rules/engine.go (selectStickyWeightedTarget and selectWeightedTarget),
// so the website simulates exactly what the gateway does. Verified against the Go code by
// web/verify/check.mjs.

const MASK64 = (1n << 64n) - 1n;
const FNV_OFFSET = 0xcbf29ce484222325n;
const FNV_PRIME = 0x100000001b3n;
const encoder = new TextEncoder();

function fnv64a(bytes, hash = FNV_OFFSET) {
  for (const b of bytes) {
    hash ^= BigInt(b);
    hash = (hash * FNV_PRIME) & MASK64;
  }
  return hash;
}

/** Maps a key and a target identity to a uniform value in (0, 1), as stickyHashUnit in engine.go. */
export function stickyHashUnit(stickyKey, identity) {
  let h = fnv64a(encoder.encode(stickyKey));
  h = fnv64a([0], h);
  h = fnv64a(encoder.encode(identity), h);
  let x = h;
  x ^= x >> 30n;
  x = (x * 0xbf58476d1ce4e5b9n) & MASK64;
  x ^= x >> 27n;
  x = (x * 0x94d049bb133111ebn) & MASK64;
  x ^= x >> 31n;
  return (Number(x >> 11n) + 0.5) / 2 ** 53;
}

/** provider + "\0" + model + "\0" + keyId, as routingTargetIdentity in engine.go. */
export function targetIdentity(target) {
  return `${target.provider ?? ""}\0${target.model ?? ""}\0${target.keyId ?? ""}`;
}

/** Weighted rendezvous hashing: the same key always gets the same target. */
export function selectSticky(targets, stickyKey) {
  const valid = targets.filter(t => t.weight >= 0);
  if (valid.length === 0) return null;
  const total = valid.reduce((sum, t) => sum + t.weight, 0);
  let best = null;
  let bestScore = 0;
  let bestIdentity = "";
  for (const t of valid) {
    const weight = total === 0 && t.weight === 0 ? 1 : t.weight;
    if (weight <= 0) continue;
    const identity = targetIdentity(t);
    const score = weight / -Math.log(stickyHashUnit(stickyKey, identity));
    if (best === null || score > bestScore || (score === bestScore && identity < bestIdentity)) {
      best = t;
      bestScore = score;
      bestIdentity = identity;
    }
  }
  return best;
}

/** Today's behaviour: a fresh weighted random draw on every request. */
export function selectRandom(targets, random = Math.random) {
  const valid = targets.filter(t => t.weight >= 0);
  if (valid.length === 0) return null;
  const total = valid.reduce((sum, t) => sum + t.weight, 0);
  if (total === 0) return valid[Math.floor(random() * valid.length)];
  const r = random() * total;
  let cumulative = 0;
  for (const t of valid) {
    cumulative += t.weight;
    if (r < cumulative) return t;
  }
  return valid[valid.length - 1];
}
