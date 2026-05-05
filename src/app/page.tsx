import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <div className="border-l-4 border-emerald-500 pl-6">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Paramedic Learnings
        </h1>
        <p className="mt-3 text-lg text-slate-500 max-w-xl">
          A knowledge platform for ambulance personnel — capture and improve
          operational guidance with AI-assisted analysis and human approval.
        </p>
      </div>
      <div className="mt-10">
        <Link
          href="/topics"
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
        >
          Browse Topics
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
