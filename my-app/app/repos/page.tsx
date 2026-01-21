'use client';

import { useSession, signIn } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link";

type Repo = {
  id: number
  name: string
  full_name: string
  private: boolean
  html_url: string
  updated_at: string
}

export default function ReposPage() {
  const { data: session, status } = useSession()
  const [repos, setRepos] = useState<Repo[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status !== "authenticated") return

    ;(async () => {
      setError(null)
      const res = await fetch("/api/github/repos")
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body?.error ?? `Failed to load repos (${res.status})`)
        return
      }
      setRepos(await res.json())
    })()
  }, [status])

  if (status === "loading") return <div className="p-6">Loading…</div>

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <p>You must sign in to view repositories.</p>
        <button
          onClick={() => signIn("github", { callbackUrl: "/repos" })}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Sign in with GitHub
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-black">
      {/* Navbar (duplicated from login-btn.tsx) */}
      <header className="h-[72px] flex items-center justify-center">
        <nav className="w-fit rounded-2xl">
          <div className="flex items-center justify-center gap-10">
            <Link href="/" className="font-comic hover:text-blue-600 font-bold">
              Home
            </Link>
            <Link href="/repos" className="font-comic hover:text-blue-600 font-bold">
              Your Repositories
            </Link>
          </div>
        </nav>
      </header>

      <main className="p-6 max-w-4xl mx-auto text-black">
        <h1 className="text-2xl font-semibold">Your Repositories</h1>

        {error && <p className="mt-4 text-red-600">{error}</p>}
        {!repos && !error && <p className="mt-4">Loading repos…</p>}

        {repos && (
          <ul className="mt-6 space-y-3">
            {repos.map((r) => (
              <li key={r.id} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-sm text-gray-500">{r.full_name}</div>
                </div>

                <div className="flex gap-2">
                  {/* Link to external GitHub */}
                  <a
                    href={r.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-blue-700"
                  >
                    GitHub Repo
                  </a>

                  {/* Link to your Visualizer */}
                  <a
                    href={`/visualize/${r.full_name}`} // full_name is usually "owner/repo"
                    className="px-3 py-1 bg-purple-800 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Visualize
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}