import type { ColumnId, PR } from "./types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const STACK_COLORS = [
  "#f97316", // orange
  "#22c55e", // green
  "#3b82f6", // blue
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#eab308", // yellow
  "#ef4444", // red
];

/** Assign a PR to a kanban column. The "reviewRequests" column is handled separately
 * (it's not a state, it's a relationship: user is a requested reviewer). */
export function assignColumn(pr: {
  isDraft: boolean;
  merged: boolean;
  closed: boolean;
  mergedAt: string | null;
  closedAt: string | null;
  reviewDecision: PR["reviewDecision"];
  checksState: PR["checksState"];
}): ColumnId | null {
  const finishedAt = pr.mergedAt ?? pr.closedAt;
  if (pr.merged || pr.closed) {
    if (!finishedAt) return null;
    const age = Date.now() - new Date(finishedAt).getTime();
    if (age <= SEVEN_DAYS_MS) return "done";
    return null;
  }
  if (pr.isDraft) return "draft";
  if (pr.reviewDecision === "CHANGES_REQUESTED") return "changesRequested";
  if (pr.reviewDecision === "APPROVED") {
    // Only "ready" if checks aren't actively failing.
    if (pr.checksState === "FAILURE" || pr.checksState === "ERROR") {
      return "changesRequested";
    }
    return "readyToMerge";
  }
  return "reviewRequired";
}

/**
 * Remap a classic column to the experimental board layout, reframing the
 * author's open PRs by whose turn it is:
 *  - "Waiting my input"  — something I, the author, must act on: a reviewer
 *    requested changes, or checks are failing (incl. approved-but-failing,
 *    which lands here via the classic "changesRequested" bucket).
 *  - "Waiting for review" — open and blocked on reviewers, nothing failing.
 * Columns that aren't author-action states (reviewRequests, draft,
 * readyToMerge, done) pass through unchanged.
 */
export function toExperimentalColumn(pr: {
  column: ColumnId;
  checksState: PR["checksState"];
}): ColumnId {
  switch (pr.column) {
    case "changesRequested":
      return "waitingMyInput";
    case "reviewRequired":
      return pr.checksState === "FAILURE" || pr.checksState === "ERROR"
        ? "waitingMyInput"
        : "waitingForReview";
    default:
      return pr.column;
  }
}

/** Extract a ticket key like "GXP-1234" from a PR title. Returns null if none found. */
export function extractTicketKey(title: string): string | null {
  const match = title.match(/[A-Z][A-Z0-9]+-\d+/);
  return match ? match[0] : null;
}

interface StackableRef {
  id: string;
  repo: string;
  baseRefName: string;
  headRefName: string;
  title: string;
  createdAt: string;
}

interface StackAssignment {
  id: string; // stack id
  members: string[]; // PR ids, ordered by base→head (bottom of stack first)
}

/**
 * Detect stacks. Within each repo:
 *  1. Build a graph: PR_a → PR_b iff PR_a.baseRefName === PR_b.headRefName.
 *     Chains of length > 1 are real stacks. Pull them out.
 *  2. Fallback: among PRs not already in a stack, group by extracted ticket key
 *     (e.g., "GXP-2263"). Only counts as a stack when 2+ PRs share the key.
 */
export function detectStacks(prs: StackableRef[]): Map<string, StackAssignment> {
  const byRepo = new Map<string, StackableRef[]>();
  for (const pr of prs) {
    if (!byRepo.has(pr.repo)) byRepo.set(pr.repo, []);
    byRepo.get(pr.repo)!.push(pr);
  }

  const assignment = new Map<string, StackAssignment>();

  for (const [repo, items] of byRepo) {
    const byHead = new Map<string, StackableRef>();
    for (const pr of items) byHead.set(pr.headRefName, pr);

    // base → child PR (the PR sitting on top of `base`)
    const childOfHead = new Map<string, StackableRef>();
    for (const pr of items) {
      if (byHead.has(pr.baseRefName)) {
        // pr is stacked on top of byHead[pr.baseRefName]
        childOfHead.set(pr.baseRefName, pr);
      }
    }

    // Find chain roots: PRs whose baseRefName is NOT another PR's head in this repo
    const inStack = new Set<string>();
    for (const pr of items) {
      if (byHead.has(pr.baseRefName)) continue; // not a root
      // Walk up from this PR following childOfHead chains
      const chain: StackableRef[] = [pr];
      let cursor: StackableRef | undefined = pr;
      while (cursor) {
        const next = childOfHead.get(cursor.headRefName);
        if (!next || chain.includes(next)) break;
        chain.push(next);
        cursor = next;
      }
      if (chain.length > 1) {
        const stackId = `${repo}::base::${pr.headRefName}`;
        const stackAssignment: StackAssignment = {
          id: stackId,
          members: chain.map((p) => p.id),
        };
        for (const m of chain) {
          assignment.set(m.id, stackAssignment);
          inStack.add(m.id);
        }
      }
    }

    // Fallback: group remaining PRs by ticket key
    const byTicket = new Map<string, StackableRef[]>();
    for (const pr of items) {
      if (inStack.has(pr.id)) continue;
      const key = extractTicketKey(pr.title);
      if (!key) continue;
      if (!byTicket.has(key)) byTicket.set(key, []);
      byTicket.get(key)!.push(pr);
    }
    for (const [ticket, group] of byTicket) {
      if (group.length < 2) continue;
      // order by creation time so ordering is stable
      group.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const stackId = `${repo}::ticket::${ticket}`;
      const stackAssignment: StackAssignment = {
        id: stackId,
        members: group.map((p) => p.id),
      };
      for (const m of group) {
        assignment.set(m.id, stackAssignment);
      }
    }
  }

  return assignment;
}

/** Pick a stable color for a stack based on a hash of its id. */
export function colorForStack(stackId: string): string {
  let h = 0;
  for (let i = 0; i < stackId.length; i++) {
    h = (h * 31 + stackId.charCodeAt(i)) | 0;
  }
  return STACK_COLORS[Math.abs(h) % STACK_COLORS.length];
}
