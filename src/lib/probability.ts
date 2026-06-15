/**
 * Hypergeometric distribution — exact probability of drawing exactly k copies
 * of a specific card from a deck.
 *
 * P(X = k) = C(K, k) * C(N-K, n-k) / C(N, n)
 *
 * N = deck size, K = total copies in deck, n = hand size, k = copies desired
 */

function combination(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.round(result);
}

export function hypergeometric(N: number, K: number, n: number, k: number): number {
  return (combination(K, k) * combination(N - K, n - k)) / combination(N, n);
}

export function probabilityAtLeast(N: number, K: number, n: number, k: number): number {
  let prob = 0;
  for (let i = k; i <= Math.min(K, n); i++) {
    prob += hypergeometric(N, K, n, i);
  }
  return Math.min(1, prob);
}

export function probabilityAtMost(N: number, K: number, n: number, k: number): number {
  let prob = 0;
  for (let i = 0; i <= k; i++) {
    prob += hypergeometric(N, K, n, i);
  }
  return Math.min(1, prob);
}

export function probabilityExactly(N: number, K: number, n: number, k: number): number {
  return hypergeometric(N, K, n, k);
}

export interface ProbabilityResult {
  exactly: number[];
  atLeastOne: number;
  atLeastTwo: number;
  expected: number;
}

export function calculateCardProbability(
  deckSize: number,
  copies: number,
  handSize: number
): ProbabilityResult {
  const exactly: number[] = [];
  for (let k = 0; k <= Math.min(copies, handSize); k++) {
    exactly.push(hypergeometric(deckSize, copies, handSize, k));
  }

  return {
    exactly,
    atLeastOne: probabilityAtLeast(deckSize, copies, handSize, 1),
    atLeastTwo: copies >= 2 ? probabilityAtLeast(deckSize, copies, handSize, 2) : 0,
    expected: (copies * handSize) / deckSize,
  };
}

export interface ComboResult {
  probability: number;
  label: string;
}

export function calculateComboProbability(
  deckSize: number,
  handSize: number,
  pieces: { copies: number; needed: number }[]
): number {
  // Probability of opening AT LEAST `needed` copies of each piece
  // Use inclusion-exclusion approximation for multi-piece combos
  if (pieces.length === 0) return 1;
  if (pieces.length === 1) {
    return probabilityAtLeast(deckSize, pieces[0].copies, handSize, pieces[0].needed);
  }

  // For multi-piece combos: enumerate all valid combinations
  // This is an approximation using the multiplication of conditional probabilities
  // For exact results we'd need multivariate hypergeometric — this is good enough for display
  let prob = 1;
  let remainingDeck = deckSize;
  let remainingHand = handSize;

  for (const piece of pieces) {
    if (remainingHand <= 0) { prob = 0; break; }
    const pieceProbInRemaining = probabilityAtLeast(remainingDeck, piece.copies, remainingHand, piece.needed);
    prob *= pieceProbInRemaining;
    remainingDeck -= piece.copies;
    remainingHand -= piece.needed;
  }

  return Math.max(0, Math.min(1, prob));
}

export function formatPercent(p: number, decimals = 1): string {
  return `${(p * 100).toFixed(decimals)}%`;
}
