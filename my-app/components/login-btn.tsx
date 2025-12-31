"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function LoginButton() {
  const { data: session } = useSession();

  return (
    <div className="auth-container h-screen text-black">
      <header className="h-[72px] flex items-center justify-center">
        {session && (
          <nav className="w-fit rounded-2xl">
            <div className="flex items-center justify-center gap-10">
              <Link href="/repos" className="font-comic hover:text-blue-600 font-bold">
                Your Repositories
              </Link>
              <Link href="/visualize" className="font-comic hover:text-blue-600 font-bold">
                Visualize
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main className="flex flex-col items-center justify-center text-center px-6 py-24">
        <h1 className="text-4xl font-comic font-bold">3D Repository Visualizer</h1>

        <p className="mt-4 font-comic text-lg max-w-2xl">
          A 3D visualization tool to explore and understand your GitHub repositories.
        </p>

        <button
          className="mt-8 font-comic font-bold text-white rounded-2xl border-4 border-purple-950 bg-purple-950 px-8 py-3 transition-colors hover:border-purple-700 hover:bg-purple-700"
          onClick={() => {
            if (session) return signOut({ callbackUrl: "/" });
            return signIn("github", { callbackUrl: "/" });
          }}
        >
          {session ? "Sign Out" : "Sign In"}
        </button>

        <div className="mt-6 min-h-[24px] font-comic">
          {session ? (
            <p>Signed in as <strong>{session.user?.email ?? session.user?.name ?? "GitHub user"}</strong></p>
          ) : null}
        </div>
      </main>
    </div>
  );
}