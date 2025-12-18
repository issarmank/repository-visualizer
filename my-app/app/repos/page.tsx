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
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">Your repositories</h1>

      {error && <p className="mt-4 text-red-600">{error}</p>}
      {!repos && !error && <p className="mt-4">Loading repos…</p>}

      {repos && (
        <ul className="mt-6 space-y-3">
          {repos.map((r) => (
            <li key={r.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <a className="font-medium hover:underline" href={r.html_url} target="_blank" rel="noreferrer">
                  {r.full_name}
                </a>
                <div className="text-sm text-neutral-600">
                  {r.private ? "Private" : "Public"} • Updated {new Date(r.updated_at).toLocaleString()}
                </div>
              </div>
              <span className="text-sm text-neutral-500">{r.name}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}