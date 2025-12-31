'use client';

import { useSession, signIn } from "next-auth/react"
import { useEffect, useState } from "react"

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
    <main className="p-6 max-w-4xl mx-auto text-black">
      <h1 className="text-2xl font-semibold">Your Repositories</h1>

      {error && <p className="mt-4 text-red-600">{error}</p>}
      {!repos && !error && <p className="mt-4">Loading repos…</p>}

      {repos && (
        <ul className="mt-6 space-y-3">
          {repos.map((r) => (
            <li
              key={r.id}
              className="border rounded p-3 flex items-center justify-between"
            >
              <a
                className="text-sm font-semibold hover:underline"
                href={r.html_url}
                target="_blank"
                rel="noreferrer"
              >
                {r.name}
              </a>

              <span className="text-sm">
                {r.private ? "Private" : "Public"} • Updated{" "}
                {new Date(r.updated_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}