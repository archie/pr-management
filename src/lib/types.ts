export type ColumnId =
  | "draft"
  | "reviewRequired"
  | "changesRequested"
  | "waitingMyInput"
  | "waitingForReview"
  | "readyToMerge"
  | "done"
  | "reviewRequests";

export const COLUMN_ORDER: ColumnId[] = [
  "reviewRequests",
  "draft",
  "reviewRequired",
  "changesRequested",
  "readyToMerge",
  "done",
];

/** Experimental board layout: splits the author's open PRs by whose turn it is
 * ("Waiting my input" vs "Waiting for review") instead of by raw review state. */
export const EXPERIMENTAL_COLUMN_ORDER: ColumnId[] = [
  "reviewRequests",
  "draft",
  "waitingMyInput",
  "waitingForReview",
  "readyToMerge",
  "done",
];

export const COLUMN_LABEL: Record<ColumnId, string> = {
  draft: "Draft",
  reviewRequired: "Review required",
  changesRequested: "Changes requested",
  waitingMyInput: "Waiting my input",
  waitingForReview: "Waiting for review",
  readyToMerge: "Ready to merge",
  done: "Done",
  reviewRequests: "Your review requested",
};

export type ChecksState =
  | "SUCCESS"
  | "PENDING"
  | "FAILURE"
  | "ERROR"
  | "EXPECTED"
  | null;

export type ReviewDecision =
  | "APPROVED"
  | "CHANGES_REQUESTED"
  | "REVIEW_REQUIRED"
  | null;

export interface PR {
  id: string;
  number: number;
  title: string;
  url: string;
  repo: string;
  isDraft: boolean;
  merged: boolean;
  closed: boolean;
  mergedAt: string | null;
  closedAt: string | null;
  updatedAt: string;
  createdAt: string;
  baseRefName: string;
  headRefName: string;
  reviewDecision: ReviewDecision;
  checksState: ChecksState;
  author: {
    login: string;
    avatarUrl: string;
  } | null;
  /** Currently-pending requested reviewers (Users prefixed with @, Teams with @team-name). */
  requestedReviewers: string[];
  /** populated by the server: which column this PR sits in */
  column: ColumnId;
  /** populated by the server: stack id this PR belongs to (if any) */
  stackId: string | null;
  /** position within the stack (1-indexed) */
  stackPosition: number | null;
  /** total size of the stack */
  stackSize: number | null;
  /** color hash for the stack indicator */
  stackColor: string | null;
}

export interface BoardData {
  repos: string[];
  prs: PR[];
  fetchedAt: string;
}
