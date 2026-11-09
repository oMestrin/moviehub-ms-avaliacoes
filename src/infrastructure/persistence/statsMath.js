/** Arredonda a média para 1 casa decimal (null quando não há avaliações). */
export function roundAverage(value, count) {
  if (!count || value === null || value === undefined) {
    return null;
  }
  return Math.round(Number(value) * 10) / 10;
}
