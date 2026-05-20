import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchBoardPRs } from "@/lib/github";
import type { BoardData } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.accessToken || !session.user?.login) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const orgsParam = url.searchParams.get("orgs") ?? "";
  const orgs = orgsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const prs = await fetchBoardPRs({
      token: session.accessToken,
      login: session.user.login,
      orgs,
    });

    const repos = Array.from(new Set(prs.map((p) => p.repo))).sort();

    const body: BoardData = {
      repos,
      prs,
      fetchedAt: new Date().toISOString(),
    };
    return NextResponse.json(body, {
      headers: { "cache-control": "no-store" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
