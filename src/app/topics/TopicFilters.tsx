"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AREAS } from "@/db/schema";

export function TopicFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const urlQ = params.get("q") ?? "";
  const urlArea = params.get("area") ?? "";

  // Local state so typing is instant. URL is updated on a debounce, and
  // local state re-syncs from the URL when it changes externally (back
  // button, "Clear filters" link, programmatic navigation).
  const [q, setQ] = useState(urlQ);

  useEffect(() => {
    setQ(urlQ);
  }, [urlQ]);

  useEffect(() => {
    if (q === urlQ) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      const trimmed = q.trim();
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      const qs = next.toString();
      router.replace(qs ? `/topics?${qs}` : "/topics");
    }, 250);
    return () => clearTimeout(timer);
  }, [q, urlQ, params, router]);

  function setArea(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("area", value);
    else next.delete("area");
    const qs = next.toString();
    router.replace(qs ? `/topics?${qs}` : "/topics");
  }

  return (
    <div className="flex gap-3">
      <input
        type="text"
        placeholder="Search topics…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="flex-1 rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
      />
      <select
        value={urlArea}
        onChange={(e) => setArea(e.target.value)}
        className="rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
      >
        <option value="">All areas</option>
        {AREAS.map((a) => (
          <option key={a} value={a}>
            {a.charAt(0).toUpperCase() + a.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
