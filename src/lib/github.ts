import { graphql } from "@octokit/graphql";
import type { PR } from "./types";
import { assignColumn, colorForStack, detectStacks } from "./kanban";

const SEARCH_QUERY = /* GraphQL */ `
  query Search($q: String!) {
    search(query: $q, type: ISSUE, first: 100) {
      nodes {
        ... on PullRequest {
          id
          number
          title
          url
          isDraft
          state
          merged
          mergedAt
          closedAt
          createdAt
          updatedAt
          baseRefName
          headRefName
          repository {
            nameWithOwner
          }
          author {
            login
            avatarUrl
          }
          reviewDecision
          mergeable
          reviewRequests(first: 20) {
            nodes {
              requestedReviewer {
                __typename
                ... on User { login }
                ... on Team { name }
                ... on Mannequin { login }
              }
            }
          }
          commits(last: 1) {
            nodes {
              commit {
                statusCheckRollup {
                  state
                }
              }
            }
          }
        }
      }
    }
  }
`;

interface GraphPR {
  id: string;
  number: number;
  title: string;
  url: string;
  isDraft: boolean;
  state: "OPEN" | "CLOSED" | "MERGED";
  merged: boolean;
  mergedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  baseRefName: string;
  headRefName: string;
  repository: { nameWithOwner: string };
  author: { login: string; avatarUrl?: string } | null;
  reviewDecision: PR["reviewDecision"];
  mergeable: PR["mergeable"];
  reviewRequests: {
    nodes: Array<{
      requestedReviewer:
        | { __typename: "User" | "Mannequin"; login: string }
        | { __typename: "Team"; name: string }
        | null;
    }>;
  };
  commits: {
    nodes: Array<{
      commit: {
        statusCheckRollup: { state: PR["checksState"] } | null;
      };
    }>;
  };
}

interface SearchResponse {
  search: { nodes: (GraphPR | null)[] };
}

function buildOrgFilter(orgs: string[]): string {
  // GitHub search ORs multiple `org:` qualifiers automatically.
  return orgs.map((o) => `org:${o}`).join(" ");
}

function reviewerLabel(
  r: GraphPR["reviewRequests"]["nodes"][number]["requestedReviewer"],
): string | null {
  if (!r) return null;
  if (r.__typename === "Team") return `@${r.name}`;
  return `@${r.login}`;
}

function toPR(node: GraphPR, column: PR["column"]): PR {
  const requestedReviewers = node.reviewRequests.nodes
    .map((n) => reviewerLabel(n.requestedReviewer))
    .filter((s): s is string => s !== null);
  return {
    id: node.id,
    number: node.number,
    title: node.title,
    url: node.url,
    repo: node.repository.nameWithOwner,
    isDraft: node.isDraft,
    merged: node.merged,
    closed: node.state === "CLOSED",
    mergedAt: node.mergedAt,
    closedAt: node.closedAt,
    updatedAt: node.updatedAt,
    createdAt: node.createdAt,
    baseRefName: node.baseRefName,
    headRefName: node.headRefName,
    reviewDecision: node.reviewDecision,
    checksState:
      node.commits.nodes[0]?.commit.statusCheckRollup?.state ?? null,
    mergeable: node.mergeable ?? null,
    author: node.author
      ? {
          login: node.author.login,
          avatarUrl: node.author.avatarUrl ?? "",
        }
      : null,
    requestedReviewers,
    column,
    stackId: null,
    stackPosition: null,
    stackSize: null,
    stackColor: null,
  };
}

export async function fetchBoardPRs(opts: {
  token: string;
  login: string;
  orgs: string[];
}): Promise<PR[]> {
  const { token, login, orgs } = opts;
  const client = graphql.defaults({
    headers: { authorization: `Bearer ${token}` },
  });

  const orgFilter = orgs.length ? buildOrgFilter(orgs) : "";
  // Open PRs authored by user
  const openAuthoredQ = `is:pr is:open author:${login} ${orgFilter} archived:false`;
  // Recently closed/merged PRs authored by user (Done column)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const recentClosedQ = `is:pr author:${login} ${orgFilter} archived:false is:closed closed:>=${sevenDaysAgo}`;
  // Open PRs where user is a requested reviewer
  const reviewRequestQ = `is:pr is:open review-requested:${login} ${orgFilter} archived:false`;

  const [openAuthored, recentClosed, reviewRequests] = await Promise.all([
    client<SearchResponse>(SEARCH_QUERY, { q: openAuthoredQ }),
    client<SearchResponse>(SEARCH_QUERY, { q: recentClosedQ }),
    client<SearchResponse>(SEARCH_QUERY, { q: reviewRequestQ }),
  ]);

  const seen = new Set<string>();
  const result: PR[] = [];

  const pushNode = (node: GraphPR | null, columnOverride?: PR["column"]) => {
    if (!node || !node.id) return;
    if (seen.has(node.id)) return;
    const checksState =
      node.commits.nodes[0]?.commit.statusCheckRollup?.state ?? null;
    const column =
      columnOverride ??
      assignColumn({
        isDraft: node.isDraft,
        merged: node.merged,
        closed: node.state === "CLOSED",
        mergedAt: node.mergedAt,
        closedAt: node.closedAt,
        reviewDecision: node.reviewDecision,
        checksState,
      });
    if (!column) return;
    seen.add(node.id);
    result.push(toPR(node, column));
  };

  for (const node of openAuthored.search.nodes) pushNode(node);
  for (const node of recentClosed.search.nodes) pushNode(node, "done");
  for (const node of reviewRequests.search.nodes) pushNode(node, "reviewRequests");

  // Detect stacks across all PRs
  const stacks = detectStacks(
    result.map((p) => ({
      id: p.id,
      repo: p.repo,
      baseRefName: p.baseRefName,
      headRefName: p.headRefName,
      title: p.title,
      createdAt: p.createdAt,
    })),
  );

  for (const pr of result) {
    const stack = stacks.get(pr.id);
    if (!stack) continue;
    const idx = stack.members.indexOf(pr.id);
    pr.stackId = stack.id;
    pr.stackPosition = idx + 1;
    pr.stackSize = stack.members.length;
    pr.stackColor = colorForStack(stack.id);
  }

  return result;
}
