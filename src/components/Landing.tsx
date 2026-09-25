"use client";

import { Inter } from "next/font/google";
import clsx from "clsx";
import type { ReactNode } from "react";
import {
  COLUMN_DESCRIPTION,
  COLUMN_LABEL,
  EXPERIMENTAL_COLUMN_ORDER,
  type ColumnId,
  type PR,
} from "@/lib/types";
import { ChecksDot, ConflictBadge, PRCard, ReviewBadge } from "./PRCard";

const inter = Inter({ subsets: ["latin"], display: "swap" });

// Marketing page shown to signed-out visitors. Always dark, in the spirit of
// Linear's site, regardless of the saved theme. Board previews render the real
// PRCard inside a `.dark` wrapper so they match the app pixel for pixel.

export function Landing({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div
      className={clsx(
        inter.className,
        "relative min-h-screen overflow-x-hidden bg-[#08090a] text-[#f7f8f8] antialiased selection:bg-indigo-500/30",
      )}
    >
      <Nav onSignIn={onSignIn} />
      <Hero onSignIn={onSignIn} />
      <Features />
      <Columns />
      <Details />
      <FinalCta onSignIn={onSignIn} />
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layout pieces                                                       */
/* ------------------------------------------------------------------ */

function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>
      {children}
    </div>
  );
}

function Nav({ onSignIn }: { onSignIn: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#08090a]/70 backdrop-blur-xl">
      <Container className="flex h-14 items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight">
            PR Board
          </span>
        </a>
        <nav className="hidden items-center gap-7 text-[13px] text-[#8a8f98] md:flex">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#columns" className="transition hover:text-white">
            How it works
          </a>
          <a href="#details" className="transition hover:text-white">
            Details
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={onSignIn}
            className="hidden rounded-md px-3 py-1.5 text-[13px] text-[#8a8f98] transition hover:text-white sm:block"
          >
            Log in
          </button>
          <button
            onClick={onSignIn}
            className="rounded-md bg-[#e6e6e6] px-3 py-1.5 text-[13px] font-medium text-[#08090a] transition hover:bg-white"
          >
            Sign up
          </button>
        </div>
      </Container>
    </header>
  );
}

function Hero({ onSignIn }: { onSignIn: () => void }) {
  return (
    <section className="relative pt-20 sm:pt-28">
      {/* Top glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[640px]"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.22), transparent 70%)",
        }}
      />
      <Container className="relative text-center">
        <a
          href="#columns"
          className="group inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] py-1 pl-1 pr-3 text-[12px] text-[#b4bcd0] transition hover:border-white/[0.15]"
        >
          <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 font-medium text-indigo-300">
            New
          </span>
          Whose-turn layout for your board
          <Arrow className="transition group-hover:translate-x-0.5" />
        </a>

        <h1 className="mx-auto mt-7 max-w-4xl bg-gradient-to-b from-white via-white to-white/55 bg-clip-text text-[44px] font-semibold leading-[1.05] tracking-[-0.035em] text-transparent sm:text-[64px] lg:text-[76px]">
          Know whose turn it is on every pull request
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-[#8a8f98] sm:text-lg">
          PR Board lays out your GitHub pull requests as a kanban, one lane per
          repo, so you can see what needs you, what&rsquo;s blocked on others,
          and what&rsquo;s ready to ship.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={onSignIn}
            className="inline-flex items-center gap-2 rounded-lg bg-[#e6e6e6] px-5 py-2.5 text-[14px] font-medium text-[#08090a] shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_30px_rgba(99,102,241,0.25)] transition hover:bg-white"
          >
            <GithubMark />
            Sign in with GitHub
          </button>
          <a
            href="#features"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-[14px] text-[#b4bcd0] transition hover:text-white"
          >
            See how it works
            <Arrow />
          </a>
        </div>
      </Container>

      <HeroPreview />
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative mt-16 sm:mt-24" style={{ perspective: "2400px" }}>
      {/* Glow behind the frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-10 mx-auto h-[420px] max-w-5xl rounded-full bg-indigo-500/20 blur-[120px]"
      />
      <Container className="max-w-7xl">
        <div
          className="relative origin-top [mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)]"
          style={{ transform: "rotateX(14deg)" }}
        >
          <div className="rounded-xl bg-gradient-to-b from-white/[0.14] to-white/[0.02] p-px">
            <div className="dark overflow-hidden rounded-[11px] bg-[#0b0c0e]">
              <AppChrome />
              <div className="pointer-events-none overflow-hidden p-3">
                <MiniBoard />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

function AppChrome() {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
      <div className="flex items-baseline gap-3">
        <span className="text-sm font-semibold tracking-tight">PR Board</span>
        <span className="hidden text-[11px] text-neutral-500 sm:inline">
          updated 12s ago
        </span>
      </div>
      <div className="flex items-center gap-2">
        {["?", "Refresh", "Settings"].map((l) => (
          <span
            key={l}
            className="rounded-md border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-[11px] text-neutral-300"
          >
            {l}
          </span>
        ))}
        <span className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-500" />
      </div>
    </div>
  );
}

const PREVIEW_COLUMNS: ColumnId[] = EXPERIMENTAL_COLUMN_ORDER.filter(
  (c) => c !== "done",
);

function MiniBoard() {
  const repos = Array.from(new Set(MOCK_PRS.map((p) => p.repo)));
  return (
    <div
      className="grid min-w-[1180px] gap-3"
      style={{
        gridTemplateColumns: `150px repeat(${PREVIEW_COLUMNS.length}, minmax(0, 1fr))`,
      }}
    >
      <div className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        Repo
      </div>
      {PREVIEW_COLUMNS.map((col) => (
        <div
          key={col}
          className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500"
        >
          {COLUMN_LABEL[col]}
        </div>
      ))}
      {repos.map((repo) => (
        <RepoLane key={repo} repo={repo} />
      ))}
    </div>
  );
}

function RepoLane({ repo }: { repo: string }) {
  return (
    <>
      <div className="border-t border-neutral-800 px-2 py-3 text-sm font-medium text-neutral-200">
        {repo}
      </div>
      {PREVIEW_COLUMNS.map((col) => (
        <div
          key={col}
          className="flex flex-col gap-2 border-t border-neutral-800 px-1.5 py-2"
        >
          {MOCK_PRS.filter((p) => p.repo === repo && p.column === col).map(
            (pr) => (
              <PRCard key={pr.id} pr={pr} />
            ),
          )}
        </div>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: ReactNode;
  body?: ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-[13px] font-medium text-[#8a8f98]">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
        {eyebrow}
      </div>
      <h2 className="mt-4 bg-gradient-to-b from-white to-white/60 bg-clip-text text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] text-transparent sm:text-[48px]">
        {title}
      </h2>
      {body ? (
        <p className="mt-5 text-[16px] leading-relaxed text-[#8a8f98]">{body}</p>
      ) : null}
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="relative scroll-mt-20 py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow="Built for reviewers and authors"
          title={
            <>
              Stop refreshing GitHub.
              <br className="hidden sm:block" /> Start shipping.
            </>
          }
          body="Your notifications tell you something changed. PR Board tells you what to do about it."
        />

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          <FeatureCard
            title="Whose turn is it?"
            body="Open PRs split into “Waiting my input” and “Waiting for review”, so failing checks, conflicts and requested changes never hide in plain sight."
          >
            <div className="space-y-2">
              <MiniLabel>Waiting my input</MiniLabel>
              <PRCard pr={FEATURE_PRS.turn} />
              <MiniLabel className="pt-2">Waiting for review</MiniLabel>
              <PRCard pr={FEATURE_PRS.waiting} showWaitingFor />
            </div>
          </FeatureCard>

          <FeatureCard
            title="Stacks, understood"
            body="Chained branches and PRs sharing a ticket key like GXP-2263 are grouped with a colored edge and a position badge."
          >
            <div className="space-y-2">
              {FEATURE_PRS.stack.map((pr) => (
                <PRCard key={pr.id} pr={pr} />
              ))}
            </div>
          </FeatureCard>

          <FeatureCard
            title="Signal on every card"
            body="Review decision, CI status, merge conflicts and pending reviewers at a glance. No clicking through tabs."
          >
            <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-900/60 p-4">
              <SignalRow label="Review">
                <ReviewBadge decision="APPROVED" />
                <ReviewBadge decision="CHANGES_REQUESTED" />
                <ReviewBadge decision="REVIEW_REQUIRED" />
              </SignalRow>
              <SignalRow label="Checks">
                <ChecksDot state="SUCCESS" />
                <ChecksDot state="FAILURE" />
                <ChecksDot state="PENDING" />
              </SignalRow>
              <SignalRow label="Merge">
                <ConflictBadge mergeable="CONFLICTING" />
              </SignalRow>
              <SignalRow label="Blocked on">
                <span className="text-[11px] text-neutral-200">
                  @alice, @platform-team
                </span>
              </SignalRow>
            </div>
          </FeatureCard>
        </div>
      </Container>
    </section>
  );
}

function FeatureCard({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent transition hover:border-white/[0.14]">
      <div className="dark pointer-events-none relative h-[300px] overflow-hidden px-6 pt-6 [mask-image:linear-gradient(to_bottom,black_70%,transparent)]">
        {children}
      </div>
      <div className="border-t border-white/[0.06] p-6">
        <h3 className="text-[17px] font-medium tracking-tight">{title}</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-[#8a8f98]">
          {body}
        </p>
      </div>
    </div>
  );
}

function MiniLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "text-[10px] font-semibold uppercase tracking-wide text-neutral-500",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SignalRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] text-neutral-500">{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Columns                                                             */
/* ------------------------------------------------------------------ */

function Columns() {
  return (
    <section
      id="columns"
      className="relative scroll-mt-20 border-t border-white/[0.06] py-24 sm:py-32"
    >
      <Container className="grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            eyebrow="How it works"
            title="Six columns. Zero guesswork."
            body="Every PR you author or are asked to review is placed on the server from its live GitHub state. One row per repo, one column per state, refreshed every minute."
          />
        </div>
        <ol className="relative">
          {EXPERIMENTAL_COLUMN_ORDER.map((col, i) => (
            <li
              key={col}
              className="relative flex gap-5 border-t border-white/[0.06] py-6 first:border-t-0 first:pt-0"
            >
              <span className="w-6 shrink-0 pt-0.5 font-mono text-[12px] text-[#62666d]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: COLUMN_ACCENT[col] }}
                  />
                  <h3 className="text-[16px] font-medium tracking-tight">
                    {COLUMN_LABEL[col]}
                  </h3>
                </div>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[#8a8f98]">
                  {COLUMN_DESCRIPTION[col]}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

const COLUMN_ACCENT: Partial<Record<ColumnId, string>> = {
  reviewRequests: "#a78bfa",
  draft: "#62666d",
  waitingMyInput: "#f43f5e",
  waitingForReview: "#f59e0b",
  readyToMerge: "#10b981",
  done: "#6366f1",
};

/* ------------------------------------------------------------------ */
/* Details grid                                                        */
/* ------------------------------------------------------------------ */

const DETAILS: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: "Live, every 60 seconds",
    body: "Background polling plus a manual refresh. The board is never more than a minute stale.",
    icon: <IconRefresh />,
  },
  {
    title: "Filter by organization",
    body: "Scope the board to the orgs you care about and leave side projects out.",
    icon: <IconFilter />,
  },
  {
    title: "Private repos included",
    body: "Sign in once with GitHub OAuth. Your token stays in an encrypted session.",
    icon: <IconLock />,
  },
  {
    title: "A week of wins",
    body: "Merged and closed PRs linger in Done for seven days, then quietly disappear.",
    icon: <IconCheck />,
  },
  {
    title: "Conflicts surfaced",
    body: "PRs that need a rebase get a Conflicts badge and move to your side of the board.",
    icon: <IconBranch />,
  },
  {
    title: "Light, dark or system",
    body: "Pick a theme in Settings. It loads before first paint, with no flash.",
    icon: <IconMoon />,
  },
];

function Details() {
  return (
    <section
      id="details"
      className="relative scroll-mt-20 border-t border-white/[0.06] py-24 sm:py-32"
    >
      <Container>
        <SectionHeading
          eyebrow="The details"
          title="Small touches that add up"
        />
        <div className="mt-14 grid overflow-hidden rounded-2xl border border-white/[0.08] sm:grid-cols-2 lg:grid-cols-3">
          {DETAILS.map((d) => (
            <div
              key={d.title}
              className="-mb-px -mr-px border-b border-r border-white/[0.08] p-7 transition hover:bg-white/[0.02]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-[#b4bcd0]">
                {d.icon}
              </div>
              <h3 className="mt-5 text-[15px] font-medium tracking-tight">
                {d.title}
              </h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[#8a8f98]">
                {d.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* CTA + footer                                                        */
/* ------------------------------------------------------------------ */

function FinalCta({ onSignIn }: { onSignIn: () => void }) {
  return (
    <section className="relative overflow-hidden border-t border-white/[0.06] py-28 sm:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(99,102,241,0.18), transparent 70%)",
        }}
      />
      <Container className="relative text-center">
        <h2 className="mx-auto max-w-3xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-[38px] font-semibold leading-[1.08] tracking-[-0.03em] text-transparent sm:text-[56px]">
          Your review queue, finally in order.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[16px] text-[#8a8f98]">
          Free to use. Sign in with GitHub and your board is ready in seconds.
        </p>
        <button
          onClick={onSignIn}
          className="mt-9 inline-flex items-center gap-2 rounded-lg bg-[#e6e6e6] px-5 py-2.5 text-[14px] font-medium text-[#08090a] transition hover:bg-white"
        >
          <GithubMark />
          Sign in with GitHub
        </button>
      </Container>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-10">
      <Container className="flex flex-col items-center justify-between gap-4 text-[13px] text-[#62666d] sm:flex-row">
        <div className="flex items-center gap-2.5">
          <Logo />
          <span className="text-[#8a8f98]">PR Board</span>
        </div>
        <p>A kanban for your GitHub pull requests.</p>
      </Container>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

function Logo() {
  return (
    <span className="grid h-6 w-6 grid-cols-3 gap-[2px] rounded-md bg-gradient-to-br from-indigo-400 to-violet-600 p-[5px]">
      <span className="rounded-[1px] bg-white/90" />
      <span className="row-span-2 rounded-[1px] bg-white/70" />
      <span className="rounded-[1px] bg-white/50" />
      <span className="rounded-[1px] bg-white/70" />
      <span className="rounded-[1px] bg-white/30" />
    </span>
  );
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M6 3l5 5-5 5" />
    </svg>
  );
}

function GithubMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2.9-.3 2-.4 3-.4s2.1.1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
    </svg>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function IconRefresh() {
  return (
    <Icon>
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
      <path d="M21 3v5h-5" />
    </Icon>
  );
}
function IconFilter() {
  return (
    <Icon>
      <path d="M3 5h18l-7 8v6l-4 2v-8z" />
    </Icon>
  );
}
function IconLock() {
  return (
    <Icon>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Icon>
  );
}
function IconCheck() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-6" />
    </Icon>
  );
}
function IconBranch() {
  return (
    <Icon>
      <circle cx="6" cy="5" r="2" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="8" r="2" />
      <path d="M6 7v10" />
      <path d="M18 10c0 4-6 3-12 7" />
    </Icon>
  );
}
function IconMoon() {
  return (
    <Icon>
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
    </Icon>
  );
}

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

const NOW = "2026-01-01T00:00:00Z";

function mockPR(p: Partial<PR> & Pick<PR, "id" | "number" | "title">): PR {
  return {
    url: "#",
    repo: "acme/api",
    isDraft: false,
    merged: false,
    closed: false,
    mergedAt: null,
    closedAt: null,
    updatedAt: NOW,
    createdAt: NOW,
    baseRefName: "main",
    headRefName: "feature",
    reviewDecision: null,
    checksState: "SUCCESS",
    mergeable: "MERGEABLE",
    author: null,
    requestedReviewers: [],
    column: "draft",
    stackId: null,
    stackPosition: null,
    stackSize: null,
    stackColor: null,
    ...p,
  };
}

const VIOLET = "#8b5cf6";
const SKY = "#0ea5e9";

const MOCK_PRS: PR[] = [
  mockPR({
    id: "1",
    number: 1482,
    title: "Add rate limiting to webhook ingestion",
    headRefName: "gxp-2301-rate-limit",
    column: "reviewRequests",
    reviewDecision: "REVIEW_REQUIRED",
    checksState: "PENDING",
  }),
  mockPR({
    id: "2",
    number: 1490,
    title: "Spike: move session store to Redis",
    headRefName: "spike/redis-sessions",
    column: "draft",
    checksState: null,
  }),
  mockPR({
    id: "3",
    number: 1476,
    title: "Backfill device timezones",
    headRefName: "gxp-2263-backfill-tz",
    column: "waitingMyInput",
    reviewDecision: "CHANGES_REQUESTED",
    checksState: "FAILURE",
    stackId: "a",
    stackPosition: 1,
    stackSize: 2,
    stackColor: VIOLET,
  }),
  mockPR({
    id: "4",
    number: 1477,
    title: "Use device timezone in quiet hours",
    headRefName: "gxp-2263-quiet-hours",
    column: "waitingForReview",
    reviewDecision: "REVIEW_REQUIRED",
    requestedReviewers: ["@alice"],
    stackId: "a",
    stackPosition: 2,
    stackSize: 2,
    stackColor: VIOLET,
  }),
  mockPR({
    id: "5",
    number: 1469,
    title: "Upgrade Postgres driver to v8",
    headRefName: "deps/pg-8",
    column: "readyToMerge",
    reviewDecision: "APPROVED",
  }),
  mockPR({
    id: "6",
    repo: "acme/web",
    number: 822,
    title: "Redesign billing settings page",
    headRefName: "billing-settings-v2",
    column: "waitingMyInput",
    mergeable: "CONFLICTING",
    reviewDecision: "APPROVED",
  }),
  mockPR({
    id: "7",
    repo: "acme/web",
    number: 829,
    title: "Fix focus trap in onboarding modal",
    headRefName: "fix/onboarding-focus",
    column: "waitingForReview",
    reviewDecision: "REVIEW_REQUIRED",
    checksState: "PENDING",
    requestedReviewers: ["@bob", "@web-team"],
  }),
  mockPR({
    id: "8",
    repo: "acme/web",
    number: 817,
    title: "Show invoice PDF preview",
    headRefName: "invoice-preview",
    column: "readyToMerge",
    reviewDecision: "APPROVED",
  }),
  mockPR({
    id: "9",
    repo: "acme/web",
    number: 831,
    title: "Translate dashboard to Swedish",
    headRefName: "i18n/sv",
    column: "reviewRequests",
    checksState: "SUCCESS",
  }),
];

const FEATURE_PRS = {
  turn: mockPR({
    id: "t1",
    number: 1476,
    title: "Backfill device timezones",
    headRefName: "gxp-2263-backfill-tz",
    reviewDecision: "CHANGES_REQUESTED",
    checksState: "FAILURE",
  }),
  waiting: mockPR({
    id: "t2",
    number: 829,
    title: "Fix focus trap in onboarding modal",
    headRefName: "fix/onboarding-focus",
    column: "waitingForReview",
    reviewDecision: "REVIEW_REQUIRED",
    checksState: "PENDING",
    requestedReviewers: ["@bob"],
  }),
  stack: [
    ["Extract notification preferences model", "gxp-2287-prefs-model", "APPROVED"],
    ["Add preferences API endpoints", "gxp-2287-prefs-api", "REVIEW_REQUIRED"],
    ["Preferences UI in settings", "gxp-2287-prefs-ui", null],
  ].map(([title, head, decision], i) =>
    mockPR({
      id: `s${i}`,
      number: 1500 + i,
      title: title as string,
      headRefName: head as string,
      reviewDecision: decision as PR["reviewDecision"],
      checksState: i === 2 ? "PENDING" : "SUCCESS",
      stackId: "s",
      stackPosition: i + 1,
      stackSize: 3,
      stackColor: SKY,
    }),
  ),
};
