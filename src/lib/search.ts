import type { PR } from "./types";

/** Split a query into lowercase whitespace-separated terms. */
export function searchTerms(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/**
 * Everything a term can match on a PR. People carry their "@" and the number
 * its "#", so "leslie", "@leslie", "10774" and "#10774" all work as substrings.
 */
function searchFields(pr: PR): string[] {
  return [
    pr.title,
    `#${pr.number}`,
    pr.headRefName,
    pr.repo,
    ...(pr.author ? [`@${pr.author.login}`] : []),
    ...pr.requestedReviewers,
  ].map((f) => f.toLowerCase());
}

/** A PR matches when every term is a substring of at least one of its fields. */
export function matchesSearch(pr: PR, terms: string[]): boolean {
  if (terms.length === 0) return false;
  const fields = searchFields(pr);
  return terms.every((t) => fields.some((f) => f.includes(t)));
}

/** Split text into alternating plain/matched segments for highlighting. */
export function highlightSegments(
  text: string,
  terms: string[],
): { text: string; match: boolean }[] {
  const lower = text.toLowerCase();
  const marked = new Array<boolean>(text.length).fill(false);
  for (const t of terms) {
    let i = lower.indexOf(t);
    while (i !== -1) {
      marked.fill(true, i, i + t.length);
      i = lower.indexOf(t, i + 1);
    }
  }
  const segments: { text: string; match: boolean }[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = segments[segments.length - 1];
    if (last && last.match === marked[i]) last.text += text[i];
    else segments.push({ text: text[i], match: marked[i] });
  }
  return segments;
}
