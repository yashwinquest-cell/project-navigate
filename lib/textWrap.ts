/**
 * Rough greedy word-wrap for SVG room labels, since SVG <text> doesn't wrap
 * on its own. charWidth is an estimate (13px bold ≈ 7.4px/char average) —
 * good enough for fitting short place names into a room rect, not real typesetting.
 */
export function wrapLabel(
  text: string,
  maxWidth: number,
  maxLines = 2,
  charWidth = 7.4
): string[] {
  const fits = (s: string) => s.length * charWidth <= maxWidth;
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (fits(candidate) || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;

  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last.length > 1 && !fits(`${last}…`)) {
    last = last.slice(0, -1).trimEnd();
  }
  kept[maxLines - 1] = `${last}…`;
  return kept;
}
