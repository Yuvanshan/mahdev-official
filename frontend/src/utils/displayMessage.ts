/**
 * Messages shown on screen never name the services behind the site. Errors from
 * the sign-in and storage libraries can say e.g. "Firebase Storage: …"; this
 * turns them into neutral wording before they are displayed.
 */
const PROVIDER_PHRASES: Array<[RegExp, string]> = [
  [/\bFirebase Storage:?\s*/g, 'Storage: '],
  [/\bFirebase (App Check|Auth(entication)?)\b/g, '$1'],
  // "Firebase: Error (...)" -> "Error (...)"; any other mention reads as "the server".
  [/\b(Firebase|Firestore|Turso):\s*/g, ''],
  [/\b(Firebase|Firestore|Turso)\b/g, 'the server'],
];

export function displayMessage(text: string | null | undefined): string {
  if (!text) return '';
  return PROVIDER_PHRASES.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), text)
    .replace(/\s{2,}/g, ' ')
    .trim();
}
