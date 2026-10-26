/**
 * Alt text that carries a local search phrase matched to what the image shows,
 * shared by the division pages (SWS, U1). Each image keeps its own title and
 * gets the one phrase that fits it, rather than every image repeating the same
 * keyword (which reads as stuffing to search engines and screen-reader users).
 */

export interface ImageAltKeyword {
  pattern: RegExp;
  phrase: string;
}

/**
 * "<title> – <phrase>" for the first rule whose pattern matches the title or any
 * extra context (category, event type, tagline); "<title> – <fallback>" otherwise.
 */
export function keywordImageAlt(
  rules: readonly ImageAltKeyword[],
  fallback: string,
  title: string,
  ...context: Array<string | undefined>
): string {
  const subject = [title, ...context].filter(Boolean).join(' ');
  const phrase = rules.find(({ pattern }) => pattern.test(subject))?.phrase ?? fallback;
  return `${title} – ${phrase}`;
}
