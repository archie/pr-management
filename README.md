# PR Board

A kanban-style dashboard for your GitHub pull requests. Sign in with GitHub
once and see your PRs grouped by repo (swimlanes) across columns: Draft,
Review required, Changes requested, Ready to merge, Done (last 7 days), and
PRs where your review is requested. Stacked PRs (chained branches or PRs
sharing a ticket key like `GXP-1234`) are visually grouped with a colored
indicator.

## Tech stack

- Next.js 15 (App Router) + TypeScript
- Auth.js v5 (NextAuth) — GitHub OAuth, JWT sessions
- GitHub GraphQL via `@octokit/graphql`
- TanStack Query — 60s polling + manual refresh
- Tailwind CSS

## Local setup

1. Install deps:
   ```sh
   npm install
   ```

2. **Create a GitHub OAuth App**:
   - Go to <https://github.com/settings/developers> → "OAuth Apps" → "New OAuth App"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
   - After creating, generate a client secret.

3. Copy env template and fill in values:
   ```sh
   cp .env.local.example .env.local
   ```
   Set:
   - `AUTH_GITHUB_ID` — OAuth App client ID
   - `AUTH_GITHUB_SECRET` — OAuth App client secret
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`

4. Run dev server:
   ```sh
   npm run dev
   ```
   Open <http://localhost:3000>, sign in with GitHub.

## Deploy to Vercel

1. Push the repo to GitHub.
2. In Vercel, "Add New… → Project", import the repo.
3. **Create a second GitHub OAuth App for production** (or update the one
   from local setup) with:
   - Homepage URL: `https://your-app.vercel.app`
   - Authorization callback URL:
     `https://your-app.vercel.app/api/auth/callback/github`
4. In Vercel project settings → Environment Variables, add:
   - `AUTH_GITHUB_ID`
   - `AUTH_GITHUB_SECRET`
   - `AUTH_SECRET` (run `openssl rand -base64 32` and paste the output)
   - `AUTH_TRUST_HOST=true` (required for Auth.js v5 on Vercel)
5. Deploy. Auth.js v5 auto-detects the Vercel URL — no need to set `AUTH_URL`.

> If you use a custom domain, update the callback URL on the GitHub OAuth App
> to match.

## How it works

- The board renders one row per repo and one column per state.
- A PR's column is derived from its GitHub state on the server:
  - `Draft` — open & marked draft
  - `Review required` — open, no review decision yet
  - `Changes requested` — has a `CHANGES_REQUESTED` review, *or* approved but checks failing
  - `Ready to merge` — approved & checks passing/pending
  - `Done` — merged or closed in the last 7 days (cards auto-disappear after)
  - `Your review requested` — open PRs where you're a requested reviewer
- **Stack detection** runs per repo: PRs whose base branch matches another
  PR's head branch form a real stack. PRs that share a ticket key
  (e.g., `GXP-2263`) are grouped as a fallback. Stacks get a colored left
  border and a "Stack N/M" badge.
- **Refresh** happens every 60 seconds automatically; the header has a manual
  refresh button.
- **Settings** lets you configure which GitHub orgs/users to scope the search
  to. Default is `MinutHQ`. Stored in `localStorage` per browser.

## Customising

- Columns are defined in `src/lib/types.ts` (`COLUMN_ORDER`, `COLUMN_LABEL`).
- Column assignment logic is in `src/lib/kanban.ts` (`assignColumn`).
- Stack detection is in `src/lib/kanban.ts` (`detectStacks`).
- The GraphQL search queries are in `src/lib/github.ts`.
