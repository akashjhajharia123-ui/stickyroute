import { selectRandom, selectSticky } from './sticky.js'

const RULE_ID = 'demo-split'

/**
 * Two targets for a Claude/GPT split.
 * @param {number} claudeShare percent, 10..90
 * @returns {{provider: string, model: string, weight: number, cls: 'a' | 'b'}[]}
 */
export function buildTargets(claudeShare) {
  return [
    { provider: 'anthropic', model: 'claude', weight: claudeShare / 100, cls: 'a' },
    { provider: 'openai', model: 'gpt', weight: (100 - claudeShare) / 100, cls: 'b' },
  ]
}

/**
 * Runs every conversation in both modes with fresh session IDs.
 * Random mode draws per message (Bifrost today); sticky mode picks once per session with the
 * gateway's own selection code.
 * @returns {{random: string[][], sticky: string[][]}} per conversation, the class ('a'|'b') per message
 */
export function simulate(targets, conversations, turns) {
  const runId = Math.random().toString(36).slice(2, 10)
  const random = []
  const sticky = []
  for (let i = 0; i < conversations; i++) {
    const pinned = selectSticky(targets, `demo-${runId}-${i}\0${RULE_ID}`)
    random.push(Array.from({ length: turns }, () => selectRandom(targets).cls))
    sticky.push(Array(turns).fill(pinned.cls))
  }
  return { random, sticky }
}

/**
 * @param {string[][]} rows per conversation, the class per message
 * @returns {{switched: number, perConversation: number, shareA: number}}
 */
export function summarise(rows) {
  let switched = 0
  let switches = 0
  let startedOnA = 0
  for (const row of rows) {
    let n = 0
    for (let i = 1; i < row.length; i++) if (row[i] !== row[i - 1]) n++
    switches += n
    if (n > 0) switched++
    if (row[0] === 'a') startedOnA++
  }
  const count = Math.max(rows.length, 1)
  return { switched, perConversation: switches / count, shareA: startedOnA / count }
}

/** Converts benchmark sample strings ("AABA…") into rows of classes. */
export function sampleToRows(sample) {
  return sample.map(s => [...s].map(c => (c === 'A' ? 'a' : 'b')))
}
